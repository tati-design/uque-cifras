# Guia: continuar o projeto "Importar playlist do Spotify" no Claude Code

Guia para quem não é da área técnica, atualizado em 08/07/2026.

## Onde as coisas estão agora

Tudo vive num projeto só: a pasta do site (`cifras-ukulele`), que tem o site
na raiz (index.html, js/, style.css) e as ferramentas em `scripts/`:

- `scripts/importa_playlist_spotify.py`: o importador (playlist Spotify →
  JSON no formato do backup do site). Já corrigido o bug do tom ("tom:C" → "C").
- `scripts/import-spotify-08-07-2026.json`: resultado da primeira rodada real
  (playlist BaianaSystem, 2 músicas, toms corrigidos).
- `scripts/guia-claude-code-projeto-import.md`: este guia.

A pasta também tem um `CLAUDE.md` na raiz que explica o site inteiro para o
Claude Code. Ele lê esse arquivo sozinho ao abrir o projeto.

## Passo 1. Abrir o Claude Code (versão app, sem Terminal)

O Claude Code tem duas versões que usam o mesmo motor: a de Terminal e a de
app desktop. Use a de app: mostra as mudanças de código visualmente e não
exige comandos.

1. Baixe o app do Claude Code em https://www.anthropic.com/claude-code
   (entre com a mesma conta do app do Claude).
2. Abra e escolha "abrir projeto/pasta", apontando para a pasta
   `cifras-ukulele` (a do site).

Se preferir Terminal: `cd` até a pasta e digite `claude`.

## Passo 2. Primeira mensagem: cole este briefing

---

Oi! Sou designer, não técnica, então explique as coisas de forma simples e
me avise antes de fazer mudanças grandes. Sou econômica com tokens: prefira
testes pequenos e baratos antes de rodar coisas pesadas.

CONTEXTO:
Este projeto é meu site estático de cifras de ukulele (uque), hospedado no
GitHub Pages. Leia o CLAUDE.md da raiz para entender o site. O site
importa/exporta backup em JSON: musicas[] (id "musica_<timestamp>", titulo,
artista, tom, cifraTexto, acordes[], criadaEm, transposicao, genero),
favoritos[] e exportadoEm.

O PROJETO ATUAL (não é mexer no site ainda):
Quero uma forma de usuários novos popularem o repertório a partir de uma
playlist do Spotify, sem código nem token. Na pasta scripts/ está o
importa_playlist_spotify.py, que já faz isso rodando localmente:
1. Lê a playlist pelo embed público do Spotify (validado, funciona).
2. Monta a URL da cifra por slug: cifraclub.com.br/artista/musica
   (validado, acertou 5 de 7 numa playlist de teste).
3. Se falhar (covers), cai numa busca via solr.sscdn.co
   (ESCRITO MAS NUNCA TESTADO: essa é a primeira tarefa).
4. Gera JSON no formato do backup. Exemplo real na pasta scripts/.

STATUS:
- Primeira rodada real feita (playlist BaianaSystem) retornou 2 músicas.
  Não sei quantas faixas a playlist tinha nem se o fallback de busca chegou
  a ser usado.
- Bug conhecido já corrigido: o tom vinha como "tom:C".
- A página /imprimir.html do Cifra Club é renderizada via JS, não use.

PLANO EM FASES (uma por vez, me mostre o resultado entre as fases):
1. Rodar scripts/importa_playlist_spotify.py com uma playlist real
   (rode com --debug), medir a taxa de acerto e consertar o fallback
   de busca se necessário.
2. Melhorar o matching: sufixos do Spotify ("- Ao Vivo" etc.), covers,
   músicas com várias versões.
3. Portar a lógica para um Cloudflare Worker + página HTML simples e
   mobile-first: o usuário cola o link da playlist e baixa o JSON.
   (Worker porque o browser não acessa o Cifra Club direto, por CORS.)
4. Me ensinar a publicar o Worker (nunca usei Cloudflare) e adicionar o
   link "Importar do Spotify" no site.

Comece me explicando o plano da fase 1 antes de executar qualquer coisa.

---

## Passo 3. Dicas de uso no dia a dia

- **Peça o plano antes da execução.** "Me explica o que vai fazer antes"
  evita retrabalho e gasta menos tokens.
- **Uma fase por sessão.** Termine, teste, avance. Se a conversa ficar longa,
  abra outra sessão: o CLAUDE.md guarda o contexto do site.
- **Peça para ele atualizar o CLAUDE.md** ao fim de cada fase com o que mudou
  (ex.: "adicione uma seção sobre a pasta scripts/ no CLAUDE.md"). Assim a
  próxima sessão já sabe de tudo.
- **Modo plano:** Shift+Tab (no Terminal) ou o botão de plano no app. Ele só
  planeja, não mexe em nada. Bom para discutir antes.
- **Esc interrompe** o Claude no meio de uma ação.
- **Cache-busting do site:** o CLAUDE.md já avisa, mas reforce se ele mexer
  no site: todo JS/CSS editado precisa do ?v=NN incrementado no index.html.
- **Custo:** o que consome tokens é reler arquivos grandes várias vezes. Se
  ele começar a reler tudo, diga "não precisa reler, só rode o script".

## Rodar o importador manualmente (sem Claude Code)

No Terminal, dentro da pasta do site:

```
python3 scripts/importa_playlist_spotify.py "https://open.spotify.com/playlist/SEU_ID"
```

Com diagnóstico da busca (recomendado enquanto o fallback não for validado):

```
python3 scripts/importa_playlist_spotify.py "LINK" --debug
```

Dependências (uma vez só, se der ModuleNotFoundError):

```
pip3 install requests beautifulsoup4
```

## Decisões já tomadas (para não rediscutir)

- O site continua 100% estático no GitHub Pages.
- Solução para o usuário final: página externa + Cloudflare Worker
  (gratuito), mobile-first, sem login e sem token.
- Alternativas descartadas por atrito: usuário criar token do Spotify,
  bookmarklet como solução principal (fraco no mobile).
- O importador remove tablaturas de violão (REMOVER_TABS = True no script),
  já que o site é de ukulele. Gênero padrão: MPB (ajustável no site depois).
