// Worker: importa uma playlist do Spotify e devolve um JSON no formato do
// backup uque, com as cifras encontradas no Cifra Club.
//
// Porta de scripts/importa_playlist_spotify.py. Roda na Cloudflare porque o
// navegador nao consegue chamar cifraclub.com.br / open.spotify.com direto
// (CORS).

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9",
};

const SEARCH_URL = "https://solr.sscdn.co/cc/h2/";
const SIMILARIDADE_MIN = 0.6;
const GENERO_PADRAO = "MPB";
const DELAY_MS = 300; // Workers nao precisam ser tao gentis quanto o script local, mas evita rajada
// Plano free da Cloudflare permite so 50 subrequisicoes por invocacao. Cada
// musica pode custar ate 4 (fetch direto + 2 buscas de fallback + fetch da
// pagina encontrada), entao 10 por lote fica seguro mesmo no pior caso.
const LIMITE_FAIXAS = 10;

const CHORD_RE =
  /^[A-G][#b]?(m|M|maj|dim|aug|sus|add)?[0-9]*(\([^)]*\))?(M|-|\+)?(\/[A-G][#b]?)?[0-9]*$/;

const SUFIXO_RE =
  /\s*[-(]\s*(ao vivo|live|remaster(ed)?|remix(ed)?|ac[uú]stico|deluxe|bonus|vers[aã]o|feat\.?|with |original album).*$/i;

// ─── SPOTIFY ────────────────────────────────────────────────────────────────

function playlistId(url) {
  const m = url.match(/playlist\/([A-Za-z0-9]+)/);
  if (!m) throw new Error("Link de playlist invalido: " + url);
  return m[1];
}

function achaEntidade(obj) {
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    if ("trackList" in obj) return obj;
    for (const v of Object.values(obj)) {
      const r = achaEntidade(v);
      if (r) return r;
    }
  } else if (Array.isArray(obj)) {
    for (const v of obj) {
      const r = achaEntidade(v);
      if (r) return r;
    }
  }
  return null;
}

async function dadosDaPlaylist(url) {
  const pid = playlistId(url);
  const r = await fetch(`https://open.spotify.com/embed/playlist/${pid}`, {
    headers: HEADERS,
  });
  if (!r.ok) throw new Error("Nao consegui ler a playlist (HTTP " + r.status + ")");
  const html = await r.text();

  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) throw new Error("Nao achei os dados da playlist (o Spotify pode ter mudado o HTML).");
  const data = JSON.parse(m[1]);
  const entidade = achaEntidade(data);
  if (!entidade) {
    throw new Error(
      "Não encontrei essa playlist. Verifique se o link está certo e se ela está configurada como pública no Spotify."
    );
  }
  const tracks = entidade.trackList || [];

  const faixas = tracks.map((t) => {
    const titulo = t.title || "";
    let artista = t.subtitle || t.artists || "";
    artista = artista.split(",")[0].trim();
    return { titulo, artista };
  });

  return { nome: entidade?.name || "playlist", faixas };
}

// ─── CIFRA CLUB ─────────────────────────────────────────────────────────────

function slugify(txt) {
  const semAcento = txt.normalize("NFKD").replace(/[̀-ͯ]/g, "");
  return semAcento
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function limpaTitulo(titulo) {
  return titulo.replace(SUFIXO_RE, "").trim();
}

function similaridade(a, b) {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;
  return (2 * matchBlocks(a, b)) / (a.length + b.length);
}

function matchBlocks(a, b) {
  function longestMatch(aLo, aHi, bLo, bHi) {
    let best = [aLo, bLo, 0];
    let lookup = new Map();
    for (let i = aLo; i < aHi; i++) {
      const newLookup = new Map();
      for (let j = bLo; j < bHi; j++) {
        if (a[i] === b[j]) {
          const len = (lookup.get(j - 1) || 0) + 1;
          newLookup.set(j, len);
          if (len > best[2]) best = [i - len + 1, j - len + 1, len];
        }
      }
      lookup = newLookup;
    }
    return best;
  }
  function recurse(aLo, aHi, bLo, bHi) {
    const [i, j, k] = longestMatch(aLo, aHi, bLo, bHi);
    if (k === 0) return 0;
    let total = k;
    if (aLo < i && bLo < j) total += recurse(aLo, i, bLo, j);
    if (i + k < aHi && j + k < bHi) total += recurse(i + k, aHi, j + k, bHi);
    return total;
  }
  return recurse(0, a.length, 0, b.length);
}

async function buscaSolr(query) {
  const url = `${SEARCH_URL}?q=${encodeURIComponent(query)}`;
  const r = await fetch(url, { headers: HEADERS });
  const raw = (await r.text()).trim();
  const m = raw.match(/\((\{[\s\S]*\})\)\s*;?\s*$/);
  const data = JSON.parse(m ? m[1] : raw);
  const docs = data?.response?.docs || [];
  return docs.filter((d) => String(d.t) === "2");
}

async function buscaFallback(titulo, artista) {
  const tituloSlug = slugify(titulo);
  const candidatos = [];
  for (const query of [`${titulo} ${artista}`, titulo]) {
    try {
      candidatos.push(...(await buscaSolr(query)));
    } catch {
      // segue pra proxima query
    }
  }

  let melhor = null,
    melhorScore = -1;
  for (const d of candidatos) {
    const sim = similaridade(tituloSlug, slugify(d.m || ""));
    if (sim < SIMILARIDADE_MIN) continue;
    const score = d.s || 0;
    if (score > melhorScore) {
      melhor = d;
      melhorScore = score;
    }
  }
  if (!melhor) return null;

  const artSlug = melhor.d || slugify(melhor.a || "");
  const musSlug = melhor.u || slugify(melhor.m || "");
  return artSlug && musSlug ? `https://www.cifraclub.com.br/${artSlug}/${musSlug}/` : null;
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripTags(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, "")).trim();
}

function removeTabs(cifra) {
  const resultado = [];
  for (const ln of cifra.split("\n")) {
    const s = ln.trim();
    if (/^[EBGDAe]\|/.test(s)) continue;
    if (/^\(Guitarra \d\)$/.test(s) || s === "[Tab - Intro]" || s.startsWith("[Tab")) continue;
    resultado.push(ln);
  }
  return resultado.join("\n").replace(/\n{3,}/g, "\n\n");
}

async function pegaCifra(url) {
  const r = await fetch(url, { headers: HEADERS, redirect: "follow" });
  if (!r.ok) return null;
  const profundidadeFinal = new URL(r.url).pathname.split("/").filter(Boolean).length;
  const profundidadeOriginal = new URL(url).pathname.split("/").filter(Boolean).length;
  if (profundidadeFinal < profundidadeOriginal) return null; // redirect = pagina do artista, musica nao existe

  const html = await r.text();
  const preMatch = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
  if (!preMatch) return null;

  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/);
  const titleText = titleMatch ? decodeEntities(titleMatch[1]) : "";
  const parts = titleText.split(" - ");
  const titulo = (parts[0] || "Sem titulo").trim();
  const artista = (parts[1] || "?").trim();

  const tomTag =
    html.match(/<a[^>]*id="cifra_tom"[^>]*>([\s\S]*?)<\/a>/) ||
    html.match(/<span[^>]*id="cifra_tom"[^>]*>([\s\S]*?)<\/span>/) ||
    html.match(/<div[^>]*class="cifra_tom"[^>]*>([\s\S]*?)<\/div>/);
  let tom = "?";
  if (tomTag) {
    const nestedA = tomTag[1].match(/<a[^>]*>([\s\S]*?)<\/a>/);
    tom = stripTags(nestedA ? nestedA[1] : tomTag[1]);
  }
  tom = tom.replace(/^tom:\s*/i, "").replace(/\s*\([^)]*\)\s*$/, "");

  let cifraHtml = preMatch[1].replace(/<a[^>]*>([\s\S]*?)<\/a>/g, "$1");
  cifraHtml = cifraHtml.replace(/<br\s*\/?>/gi, "\n");
  let cifra = decodeEntities(cifraHtml.replace(/<[^>]+>/g, ""));
  cifra = removeTabs(cifra);

  return { titulo, artista, tom, cifra };
}

async function resolveCifra(tituloRaw, artista) {
  const titulo = limpaTitulo(tituloRaw);
  const urlDireta = `https://www.cifraclub.com.br/${slugify(artista)}/${slugify(titulo)}/`;
  let resultado = await pegaCifra(urlDireta);
  if (resultado) return resultado;

  const urlBusca = await buscaFallback(titulo, artista);
  if (urlBusca) resultado = await pegaCifra(urlBusca);
  return resultado;
}

// ─── FORMATO DO BACKUP ──────────────────────────────────────────────────────

function extraiAcordes(cifra) {
  const acordes = [];
  const vistos = new Set();
  for (const line of cifra.split("\n")) {
    const s = line.trim();
    if (!s || s.includes("|")) continue;
    let s2 = s.replace(/\[[^\]]*\]/g, "").trim();
    if (s2.startsWith("(") && s2.endsWith(")")) s2 = s2.slice(1, -1);
    const toks = s2.split(/\s+/).filter(Boolean);
    if (toks.length && toks.every((t) => CHORD_RE.test(t))) {
      for (const t of toks) {
        if (!vistos.has(t)) {
          vistos.add(t);
          acordes.push(t);
        }
      }
    }
  }
  return acordes;
}

function montaMusica(titulo, artista, tom, cifra) {
  const agora = new Date().toISOString().replace(/\.\d+Z$/, ".000Z");
  return {
    id: "musica_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    titulo,
    artista,
    tom,
    cifraTexto: cifra.replace(/^\n+|\n+$/g, ""),
    acordes: extraiAcordes(cifra),
    criadaEm: agora,
    transposicao: 0,
    genero: GENERO_PADRAO,
  };
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// ─── HANDLER ────────────────────────────────────────────────────────────────

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

async function handleBuscarMusica(titulo, artista) {
  if (!titulo) {
    return new Response(JSON.stringify({ erro: "Informe o nome da música." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const resultado = await resolveCifra(titulo, artista || "");
  if (!resultado) {
    return new Response(JSON.stringify({ encontrada: false }), {
      headers: { "Content-Type": "application/json" },
    });
  }
  const musica = montaMusica(resultado.titulo, resultado.artista, resultado.tom, resultado.cifra);
  return new Response(JSON.stringify({ encontrada: true, musica }), {
    headers: { "Content-Type": "application/json" },
  });
}

async function handleImportar(request) {
  const { searchParams } = new URL(request.url);
  let playlistUrl = searchParams.get("playlist");
  let offset = Number(searchParams.get("offset")) || 0;
  if (request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    playlistUrl = body.playlist || playlistUrl;
    if (Number.isFinite(body.offset)) offset = body.offset;
  }
  if (!playlistUrl) {
    return new Response(JSON.stringify({ erro: "Informe o link da playlist (parametro 'playlist')." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { nome: nomePlaylist, faixas: todasFaixas } = await dadosDaPlaylist(playlistUrl);
  const faixas = todasFaixas.slice(offset, offset + LIMITE_FAIXAS);
  const proximoOffset = offset + faixas.length < todasFaixas.length ? offset + faixas.length : null;
  const musicas = [];
  const falhas = [];

  for (const { titulo, artista } of faixas) {
    const resultado = await resolveCifra(titulo, artista);
    if (resultado) {
      musicas.push(montaMusica(resultado.titulo, resultado.artista, resultado.tom, resultado.cifra));
    } else {
      falhas.push({ titulo, artista });
    }
    await delay(DELAY_MS);
  }

  const pendentes = todasFaixas.slice(offset + faixas.length);

  const out = {
    musicas,
    favoritos: [],
    exportadoEm: new Date().toISOString().replace(/\.\d+Z$/, ".000Z"),
    falhas,
    pendentes,
    nomePlaylist,
    totalNaPlaylist: todasFaixas.length,
    offset,
    proximoOffset,
    tamanhoLote: LIMITE_FAIXAS,
  };
  return new Response(JSON.stringify(out, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin");
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin) });
    }
    try {
      let body = {};
      if (request.method === "POST") {
        body = await request.clone().json().catch(() => ({}));
      }
      const resp = body.titulo
        ? await handleBuscarMusica(body.titulo, body.artista)
        : await handleImportar(request);
      const headers = new Headers(resp.headers);
      for (const [k, v] of Object.entries(corsHeaders(origin))) headers.set(k, v);
      return new Response(resp.body, { status: resp.status, headers });
    } catch (e) {
      return new Response(JSON.stringify({ erro: String(e.message || e) }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      });
    }
  },
};
