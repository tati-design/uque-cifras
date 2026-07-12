# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"Uque" — a client-side web app for ukulele: (1) a chord finder/identifier that maps a set of notes to fingering diagrams, and (2) a personal songbook ("Minhas Músicas") that stores chord sheets (cifras) with per-song self-assessment ratings. Everything is plain HTML/CSS/JS with **no build step, no bundler, no package manager, and no framework**. All persistence is `localStorage` — there is no backend.

## Running the app

There's no build/lint/test tooling in this repo. To develop:

```bash
python3 -m http.server 8744
```

(matches `.claude/launch.json`, which the Preview tooling uses — `preview_start` with config name `static`). Then open `index.html` via that server. Opening `index.html` directly with `file://` mostly works too since everything is plain `<script src>` tags, but prefer the http server since it's what's configured.

There is no test suite, linter, or build command — verify changes by loading the page in a browser (or the preview tool) and exercising the UI directly.

## Script load order matters

`index.html` loads scripts as plain globals in a specific dependency order (no modules, no imports):

```
notas.js → candidatos.js → acordes.js → diagrama.js → favoritos.js → musicas.js → ui.js → musicas-ui.js → app.js
```

Every file shares one global scope. Functions/consts defined in an earlier script are used directly (unqualified) in later ones — e.g. `musicas-ui.js` calls functions from `musicas.js`, `ui.js` calls things from `candidatos.js`/`diagrama.js`. When adding a new file or function, respect this ordering and avoid name collisions across files since there's no module isolation.

Each `<script>`/`<link>` tag has a `?v=NN` cache-busting query param hardcoded in `index.html`. **Bump the version number when editing a JS/CSS file** so browsers don't serve a stale cached copy.

## Architecture

Two top-level views toggled via CSS `hidden` class (see `app.js`/`musicas-ui.js`): `#view-lista` (song list + chord search tabs) and `#view-musica` (single song reader). Within `#view-lista` there are two tabs: "Música" (songbook) and "Acordes" (chord finder), switched by `setTab()` in `app.js`.

### Chord engine (`notas.js`, `candidatos.js`, `acordes.js`, `diagrama.js`)

This is the reusable "given some notes/chord name, find playable ukulele fingerings" pipeline, independent of the songbook:

- `notas.js` — note theory primitives: the 4 ukulele strings (`CORDAS`), chromatic scale (`NOTAS`), open-string tuning (`CORDA_SOLTA`), transposition (`transporAcorde`), enharmonic handling.
- `candidatos.js` — given a set of target notes, generates every fret-position candidate (`gerarCandidatos`) up to `MAX_CASA`/`MAX_SPAN`, then filters/dedupes/ranks them (`filtrarMelhorCobertura`, `ordenar`) and detects barre chords (`detectarPestana`). `gerarAcorde()` is the main entry point.
- `acordes.js` — parses a chord name string (e.g. "Am7") into its note set (`calcularNotasAcorde`), and the reverse: identifies a chord name from a set of notes (`identificarAcorde`) using `TEMPLATES`. Caches results in `_cacheAcordes`.
- `diagrama.js` — renders a fingering diagram (`renderDiagram`) as SVG/HTML for a given candidate.
- `ui.js` — wires the chord-finder UI: input parsing (`detectarModo` — chord name vs. note list vs. "contains" query), the `run()` search entry point, chord/option cards, and a "favorite chords" panel (see below).

### Favorites (`favoritos.js`)

Standalone `localStorage`-backed list of favorited chord fingerings (key `ukulele_favoritos`), independent from song favorites/genres. Keyed by a chord identifier + exact fret positions (`ehFavorito`, `toggleFavorito`).

### Songbook (`musicas.js`, `musicas-ui.js`)

- `musicas.js` — data layer. Songs are stored under `localStorage` key `MUSICAS_KEY` as a flat array (CRUD via `listarMusicas`/`salvarMusica`/`atualizarMusica`/`removerMusica`). Also owns:
  - `GENEROS`/`GENERO_ICONS` — fixed genre taxonomy with icons.
  - `AVALIACAO_CATEGORIAS` — the 3-axis self-rating system (Instrumento/Vocal/Engajamento), each with 4 levels (0–3) stored as `ratingInstrumento`/`ratingVocal`/`ratingEngajamento` fields on a song.
  - Cifra text parsing: `parseMusicaTexto`, `dividirMusicasTexto` (splits pasted multi-song text into individual songs), `extrairAcordes`/`isValidChordToken` (identifies chord tokens vs. lyrics/section-header tokens in raw pasted text).
  - One-time migrations run at load in `app.js`: `migrarIdsUnicos()`, `migrarGeneros()`.
- `musicas-ui.js` (by far the largest file, ~2400 lines) — all songbook rendering/interaction: list view with filters/sort/search (`renderMusicasLista`, `setMusicaFiltroGenero`, `setMusicaOrdem`, etc.), the single-song reader (`abrirMusicaView`, `navegarMusica` for prev/next), font-size controls persisted to `localStorage` (`cifraFontSize`), "Modo Aprendiz" (beginner mode: simplify chords, show chord names, hide tabs — flags persisted as `modoSimplificar`/`modoNomes`/`modoEsconderTab`), bottom sheets/modals (genre picker, sort picker, rating filter, artist filter), multi-select bulk actions (delete, bulk genre assign), and JSON backup export/import (`exportarBackup`/`importarBackupArquivo`, called from `app.js`).

### Naming conventions

Code/comments/UI copy are in Portuguese (pt-BR). Function names follow Portuguese verb-first convention (`abrir*`, `fechar*`, `renderizar*`/`render*`, `selecionar*`, `toggleX`). Match this style for new code rather than switching to English.

## Styling

Single `style.css` file (~2350 lines), no preprocessor. Responsive behavior (mobile vs. desktop layouts, bottom sheets vs. inline panels) is handled with media queries and toggled classes rather than separate templates — check existing patterns (e.g. how the avaliação/rating UI or filter sheets differ between mobile and desktop) before adding new responsive UI.

### Recurring interaction conventions

These are patterns the user has asked for repeatedly across different features — apply them by default to new UI rather than waiting to be told again:

- **Toolbar buttons show icon + label on desktop, icon-only on mobile.** Give the button's text a `<span class="toolbar-btn-label">`; the shared rule at `@media (max-width: 600px) { .toolbar-btn-label { display: none; } }` in `style.css` collapses it to icon-only automatically. Don't build a separate icon-only variant by hand.
- **Completed/active state = brand blue fill.** When a toggle, badge, or filter represents something the user has already "done" or turned on (modo aprendiz options set, autorrolagem running, an avaliação fully filled in, a filter applied), give it `background: #5b7cf6; color: #fff;` (see `.aprendiz-split-btn.active`, `.autoscroll-start-btn.active`, `.avaliar-completa`) rather than leaving it in the neutral gray (`#f3f2ee`/`#444`) idle state.

## scripts/ + worker/ (Spotify playlist import)

`scripts/importa_playlist_spotify.py` is the original standalone Python tool, run locally (not part of the deployed site), that turns a Spotify playlist into a JSON file in the app's backup format (importable via the site's backup-import feature). It reads the playlist via Spotify's public embed (no token needed), resolves each track to a Cifra Club page (direct URL slug, falling back to Cifra Club's search API for covers/mismatches), and extracts the cifra text + tom. Requires `pip3 install requests beautifulsoup4`; run with `--debug` to see search-fallback diagnostics.

`worker/index.js` is a JS port of that same pipeline meant to run as a Cloudflare Worker (needed because the browser can't hit Cifra Club/Spotify directly due to CORS). Same logic — embed parsing, slugify, direct-URL + search-fallback with a JS reimplementation of `difflib`'s similarity ratio, cifra/tom extraction via regex (Workers have no DOM parser, so no BeautifulSoup-equivalent) — exposed as a single `fetch` handler with two request shapes: `{ playlist: <url>, offset?: number }` (POST) for playlist batches (returns `musicas`/`falhas` for that batch plus `nomePlaylist`, `totalNaPlaylist`, `offset`, `proximoOffset` — `null` once done), or `{ titulo, artista? }` (POST) for a single-song lookup (routed by the top-level `fetch` handler peeking at `body.titulo` via `request.clone().json()`, since a `Request` body can only be read once) — returns `{ encontrada: false }` or `{ encontrada: true, musica: {...} }` via the same `resolveCifra`/`montaMusica` used by the playlist path. `worker/wrangler.toml` configures it (`name = "uque-import"`). Run it locally with `cd worker && npx wrangler dev --port 8787` — no Cloudflare account needed for local dev. **Deployed** at `https://uque-import.tatidigitaldesigner.workers.dev` (free Cloudflare Workers plan, account email `tatidigitaldesigner@gmail.com`). The free plan caps a single invocation at 50 subrequests; each track can cost up to 4 (direct Cifra Club fetch + up to 2 search-fallback queries + fetch of the page found by search), so `LIMITE_FAIXAS = 10` keeps a playlist batch safely under the limit even in the worst case (tried 20 first — it still hit the cap when a batch had several cache-miss tracks). The client (`js/importar.js`) calls the Worker repeatedly with increasing `offset`, accumulating results across batches and offering a "Carregar mais N" button while `proximoOffset` isn't null, so a full large playlist can still be imported — just across multiple requests instead of one.

`importar.html` + `js/importar.js` is the site-facing page with two tabs. **"Transforme playlist em cifras"**: paste a playlist link, it calls the Worker in batches, shows a playlist-name header with a reset/cancel (trash icon) button, a segmented progress bar (green = found, red = not found, remaining gray = pending, all relative to `totalNaPlaylist`), and three collapsible `<details>` sections ("Cifras encontradas" / "Não encontradas" / "Pendentes", collapsed by default) each with a Título/Artista table — `pendentes` comes from the Worker for free since the full Spotify tracklist (titles/artists) is already fetched on every batch regardless of how many get resolved. The "Não encontradas" rows have a per-row delete button (`icon-btn-danger`) so a false negative can be pruned from `estado.falhas` before download without blocking anything. The "Não encontradas"/"Pendentes" sections and the "Carregar mais" button auto-hide once their count reaches 0 (hiding relies on the global `.hidden { display: none !important; }` utility — it needs `!important` because some component rules like `.importar-acoes button { display: inline-flex }` are more specific than a bare `.hidden` class and would otherwise win). The link input + "Carregar playlist" button (`#importar-form-secao`) hide once a playlist is loaded and only reappear after the reset button clears `estado`. Loading states show an animated 3-dot ellipsis (`.importar-dots`, CSS-only `@keyframes`) instead of a static "..." string. The Worker validates the playlist actually resolved to something (`achaEntidade` returns non-null) and throws a specific "não é pública ou não existe" error otherwise, rather than silently returning 0 tracks. Two action buttons cover the found songs: **"Adicionar X à biblioteca"** (primary, `flex:1`) calls `salvarMusica()` for every song in `estado.musicas` and redirects to `index.html` with a toast, and a small icon-only **download button** still offers the accumulated batch as a `uque-import-<slug-do-nome>-<data>.json` backup file for anyone who wants the raw JSON instead. "Carregar mais N" 's N is computed client-side from the Worker's `tamanhoLote` field so the label always matches the real batch size.

**"Pesquise uma música"** (second tab, fully wired up): two inputs (nome da música / nome do artista) call the Worker's single-song mode; on a hit it shows the found title/artist with a reset button, and a "Cifra encontrada" card with the full cifra text (scrollable `<pre>`), a copy-to-clipboard icon button, and an "Adicionar cifra" button. Not-found errors intentionally don't mention "Cifra Club" (just "Não encontrei essa cifra...") — it's an implementation detail the user doesn't want surfaced. The copy button copies a composite string (`título\nartista\nTom: X\n\ncifraTexto`, built by `textoParaColar()`) rather than the bare cifra text, because that's the exact format `parseMusicaTexto()` (in `musicas.js`) expects when pasted back through the "colar cifra" flow. "Adicionar cifra" calls `salvarMusica()` (from `musicas.js`) directly, writing straight into the same `localStorage` key (`ukulele_musicas`) the main app reads — since `importar.html` and `index.html` are same-origin, this works without any backend round-trip — then redirects to `index.html` with a toast (see below), matching the "close the modal, go home, confirm" flow the user asked for. Because of the direct-save capability, `importar.html` now also loads `notas.js`/`candidatos.js`/`acordes.js`/`diagrama.js`/`favoritos.js`/`musicas.js` (same order as `index.html`, stops short of `ui.js`/`musicas-ui.js`/`app.js` which aren't needed here). New songs default to `genero: 'Outros'` via `salvarMusica`'s own default, matching the existing "colar cifra" flow's behavior. Both tabs are toggled by `js/importar.js`'s `selecionarAba()`, swapping `.active`/`.hidden` on `#importar-tab-playlist`/`#importar-tab-musica` and their `#importar-painel-*` panels — opening `importar.html?aba=musica` auto-selects the música tab (used by the new "Pesquisar uma música" entry point, see below).

**Toast on return to the library**: since both "add to library" actions on `importar.html` navigate back to `index.html`, they hand off a message via `sessionStorage.setItem('uque_toast', msg)` before redirecting. `js/app.js` defines `mostrarToast(msg, duracaoMs=3000)` (lazily creates a `#toast` div, styled by the `.toast`/`.toast.mostrar` rules in `style.css`) and, near the top of its top-level script (before `migrarIdsUnicos()`), checks `sessionStorage.getItem('uque_toast')` and shows+clears it if present. This is a generic mechanism — any future page/flow that redirects into `index.html` can reuse the same `uque_toast` key.

Entry point in the site: clicking "Adicionar música" (the mobile sticky button, or the compact button next to "Ordenar" on desktop) opens a small menu with 4 options — colar cifra, importar arquivo de backup (.json), importar do Spotify (navigates to `importar.html`), and **"Pesquisar uma música"** (navigates to `importar.html?aba=musica`, opening straight into the single-song tab). See `toggleAdicionarMenu`/`abrirImportarSpotify`/`abrirPesquisarMusica` in `musicas-ui.js`.

Progress:

1. ✅ Python pipeline: direct-URL + search-fallback, tom parsing fixed (capotraste suffix no longer leaks into the tom field), matching quality via a similarity threshold (`SIMILARIDADE_MIN`) so covers/mismatches are rejected instead of guessed.
2. ✅ Ported the pipeline to a Cloudflare Worker (`worker/index.js`). Verified its similarity-scoring output is numerically identical to Python's `difflib`, and tested end-to-end locally via `wrangler dev` (e.g. a 100-track playlist correctly found 95/100 cifras, honestly reporting the other 5 as not found).
3. ✅ Built `importar.html`/`js/importar.js` and wired the "Adicionar música" entry point in the site to link to it.
4. ✅ Created a Cloudflare account, deployed the Worker (`uque-import.tatidigitaldesigner.workers.dev`), updated `WORKER_URL`, and verified end-to-end against a live 50-track Spotify playlist through the browser preview. Hit the free plan's 50-subrequest limit on large playlists, fixed by capping batches at 10 tracks with a user-facing "Carregar mais" flow rather than paying for the Workers Paid plan.
5. ✅ Redesigned the import UX based on user-provided mockups (playlist header, segmented progress, collapsible sections, per-row delete, animated loading dots, public-playlist validation) and implemented the "Pesquise uma música" tab end-to-end (single-song search + copy + direct add-to-library).
6. ✅ UX polish round: copy button includes título/artista/tom (matches the paste-parser format), not-found message no longer mentions Cifra Club, both "add to library" actions (single-song and now also playlist-wide via the new "Adicionar X à biblioteca" button) redirect to `index.html` with a success toast instead of just flipping the button label in place, and a "Pesquisar uma música" shortcut was added to the "Adicionar música" menu.
7. ✅ Merged `scripts/import-spotify-playlist` directly into `main` and pushed. Verified live on GitHub Pages (`https://tati-design.github.io/uque-cifras`) that `importar.html`/`js/importar.js` ship correctly and the full flow works end-to-end in production (menu entry → tab routing → real Worker search returning a cifra).
