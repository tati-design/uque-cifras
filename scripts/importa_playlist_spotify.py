# -*- coding: utf-8 -*-
"""
Importa playlist do Spotify -> cifras do Cifra Club -> JSON no formato do backup uque.

Uso:
    python importa_playlist_spotify.py "https://open.spotify.com/playlist/SEU_ID"

Requisitos (mesmos do scraper_cifraclub.py):
    pip install requests beautifulsoup4

Fluxo:
  1. Lê a playlist pelo embed público do Spotify (sem token).
  2. Para cada faixa, tenta a URL direta cifraclub.com.br/<artista-slug>/<musica-slug>/
  3. Se falhar (ex.: cover), usa a API de busca do Cifra Club (solr) como fallback.
  4. Extrai cifra + tom, monta o JSON no formato do backup (musicas/favoritos/exportadoEm).

Validado no piloto de 08/07/2026: embed do Spotify e extração da cifra funcionam.
O fallback de busca (passo 3) foi escrito mas ainda NÃO testado; se falhar,
rode com --debug para ver a resposta crua e ajustar o parse.
"""

import json
import re
import sys
import time
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

# ─── CONFIG ───────────────────────────────────────────────────────────────────

DELAY = 1.5           # segundos entre requests (seja gentil com o servidor)
REMOVER_TABS = True   # True = remove tablaturas de violao (site e de ukulele)
GENERO_PADRAO = "MPB" # ajuste depois no site se quiser
DEBUG = "--debug" in sys.argv

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "pt-BR,pt;q=0.9",
}

SEARCH_URL = "https://solr.sscdn.co/cc/h2/"

CHORD_RE = re.compile(
    r"^[A-G][#b]?(m|M|maj|dim|aug|sus|add)?[0-9]*(\([^)]*\))?(M|-|\+)?(/[A-G][#b]?)?[0-9]*$"
)

# Sufixos que o Spotify adiciona ao titulo e atrapalham a busca
SUFIXO_RE = re.compile(
    r"\s*[-(]\s*(ao vivo|live|remaster(ed)?|remix(ed)?|ac[uú]stico|deluxe|"
    r"bonus|vers[aã]o|feat\.?|with |original album).*$",
    re.IGNORECASE,
)

# ─── SPOTIFY ─────────────────────────────────────────────────────────────────

def playlist_id(url):
    m = re.search(r"playlist/([A-Za-z0-9]+)", url)
    if not m:
        sys.exit("Link de playlist invalido: " + url)
    return m.group(1)


def _acha_tracklist(obj):
    """Procura recursivamente a chave 'trackList' no JSON do embed."""
    if isinstance(obj, dict):
        if "trackList" in obj:
            return obj["trackList"]
        for v in obj.values():
            r = _acha_tracklist(v)
            if r:
                return r
    elif isinstance(obj, list):
        for v in obj:
            r = _acha_tracklist(v)
            if r:
                return r
    return None


def faixas_da_playlist(url):
    """Retorna [(titulo, artista), ...] usando o embed publico (sem token)."""
    pid = playlist_id(url)
    r = requests.get(f"https://open.spotify.com/embed/playlist/{pid}",
                     headers=HEADERS, timeout=20)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")
    script = soup.find("script", id="__NEXT_DATA__")
    if not script:
        sys.exit("Nao achei __NEXT_DATA__ no embed; o Spotify pode ter mudado o HTML.")
    data = json.loads(script.string)
    tracks = _acha_tracklist(data) or []
    faixas = []
    for t in tracks:
        titulo = t.get("title", "")
        artista = t.get("subtitle", "") or t.get("artists", "")
        # subtitle costuma ser "Artista1, Artista2" -> usa o primeiro
        artista = artista.split(",")[0].strip()
        faixas.append((titulo, artista))
    return faixas

# ─── CIFRA CLUB ──────────────────────────────────────────────────────────────

def slugify(txt):
    txt = unicodedata.normalize("NFKD", txt).encode("ascii", "ignore").decode()
    txt = re.sub(r"[^a-zA-Z0-9]+", "-", txt.lower()).strip("-")
    return txt


def limpa_titulo(titulo):
    return SUFIXO_RE.sub("", titulo).strip()


def busca_fallback(titulo, artista):
    """Busca no solr do Cifra Club. Retorna URL da cifra ou None.
    NAO TESTADO no piloto - se nao funcionar, rode com --debug e ajuste."""
    for query in (f"{titulo} {artista}", titulo):
        try:
            r = requests.get(SEARCH_URL, params={"q": query},
                             headers=HEADERS, timeout=15)
            raw = r.text.strip()
            # resposta pode vir como JSONP: callback({...})
            m = re.search(r"\((\{.*\})\)\s*;?\s*$", raw, re.DOTALL)
            data = json.loads(m.group(1) if m else raw)
            docs = data.get("response", {}).get("docs", [])
            if DEBUG:
                print(f"    [debug] busca '{query}': {len(docs)} docs")
                for d in docs[:3]:
                    print("    [debug]", d)
            for d in docs:
                # t=="2" indica musica; 'd' e o slug do artista, 'a' o nome, 'u' o slug da musica
                if str(d.get("t")) == "2":
                    art_slug = d.get("d") or slugify(d.get("a", ""))
                    mus_slug = d.get("u") or slugify(d.get("m", ""))
                    if art_slug and mus_slug:
                        return f"https://www.cifraclub.com.br/{art_slug}/{mus_slug}/"
        except Exception as e:
            if DEBUG:
                print("    [debug] erro na busca:", e)
    return None


def pega_cifra(url_musica):
    """Baixa a pagina e extrai (titulo, artista, tom, cifra). None se nao achou."""
    r = requests.get(url_musica, headers=HEADERS, timeout=15)
    if r.status_code != 200:
        return None
    # redirect para a pagina do artista = musica nao existe
    if r.url.rstrip("/").count("/") < url_musica.rstrip("/").count("/"):
        return None
    soup = BeautifulSoup(r.text, "html.parser")
    pre = soup.find("pre")
    if not pre:
        return None

    page_title = soup.find("title")
    parts = page_title.get_text().split(" - ") if page_title else []
    titulo = parts[0].strip() if parts else "Sem titulo"
    artista = parts[1].strip() if len(parts) > 1 else "?"

    tom_tag = (soup.find("a", id="cifra_tom")
               or soup.find("span", id="cifra_tom")
               or soup.find("div", class_="cifra_tom"))
    # quando ha capotraste, o tom real fica num <a> aninhado (ex.: "tom: <a>Ab</a> (forma
    # dos acordes no tom de G)"); pega so o link se existir, senao usa o texto inteiro
    if tom_tag:
        tom_link = tom_tag.find("a")
        tom = tom_link.get_text(strip=True) if tom_link else tom_tag.get_text(strip=True)
    else:
        tom = "?"
    tom = re.sub(r"(?i)^tom:\s*", "", tom)  # remove rotulo "tom:" se vier junto
    tom = re.sub(r"\s*\([^)]*\)\s*$", "", tom)  # remove nota tipo "(forma dos acordes...)"

    for a in pre.find_all("a"):
        a.replace_with(a.get_text())
    cifra = pre.get_text()

    if REMOVER_TABS:
        cifra = remove_tabs(cifra)
    return titulo, artista, tom, cifra


def remove_tabs(cifra):
    """Remove linhas de tablatura (E|---...) e cabecalhos tipo (Guitarra 1)."""
    linhas, resultado = cifra.splitlines(), []
    for ln in linhas:
        s = ln.strip()
        if re.match(r"^[EBGDAe]\|", s):
            continue
        if re.match(r"^\(Guitarra \d\)$", s) or s == "[Tab - Intro]" or s.startswith("[Tab"):
            continue
        resultado.append(ln)
    txt = "\n".join(resultado)
    return re.sub(r"\n{3,}", "\n\n", txt)  # colapsa linhas em branco extras

# ─── FORMATO DO BACKUP ───────────────────────────────────────────────────────

def extrai_acordes(cifra):
    acordes, vistos = [], set()
    for line in cifra.splitlines():
        s = line.strip()
        if not s or "|" in s:
            continue
        s2 = re.sub(r"\[[^\]]*\]", "", s).strip()
        if s2.startswith("(") and s2.endswith(")"):
            s2 = s2[1:-1]
        toks = s2.split()
        if toks and all(CHORD_RE.match(t) for t in toks):
            for t in toks:
                if t not in vistos:
                    vistos.add(t)
                    acordes.append(t)
    return acordes


def monta_musica(titulo, artista, tom, cifra):
    agora = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    return {
        "id": "musica_%d" % int(time.time() * 1000),
        "titulo": titulo,
        "artista": artista,
        "tom": tom,
        "cifraTexto": cifra.strip("\n"),
        "acordes": extrai_acordes(cifra),
        "criadaEm": agora,
        "transposicao": 0,
        "genero": GENERO_PADRAO,
    }

# ─── MAIN ────────────────────────────────────────────────────────────────────

def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        sys.exit('Uso: python importa_playlist_spotify.py "<link da playlist>"')

    faixas = faixas_da_playlist(args[0])
    print(f"Playlist com {len(faixas)} faixas.\n")

    musicas, falhas = [], []
    for i, (titulo_raw, artista) in enumerate(faixas, 1):
        titulo = limpa_titulo(titulo_raw)
        print(f"[{i}/{len(faixas)}] {titulo} - {artista}")

        url = f"https://www.cifraclub.com.br/{slugify(artista)}/{slugify(titulo)}/"
        resultado = pega_cifra(url)

        if not resultado:
            print("  slug direto falhou, tentando busca (cover?)...")
            time.sleep(DELAY)
            url2 = busca_fallback(titulo, artista)
            resultado = pega_cifra(url2) if url2 else None

        if resultado:
            t, a, tom, cifra = resultado
            musicas.append(monta_musica(t, a, tom, cifra))
            print(f"  OK: {t} - {a} (tom {tom})")
        else:
            falhas.append(f"{titulo} - {artista}")
            print("  NAO ENCONTRADA")
        time.sleep(DELAY)

    agora = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    out = {"musicas": musicas, "favoritos": [], "exportadoEm": agora}
    nome = Path(f"import-spotify-{datetime.now().strftime('%d-%m-%Y')}.json")
    nome.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\nPronto! {len(musicas)}/{len(faixas)} cifras salvas em '{nome}'")
    if falhas:
        print("Nao encontradas (adicione manualmente ou confira o nome):")
        for f in falhas:
            print("  -", f)


if __name__ == "__main__":
    main()
