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

## scripts/ + worker/ (Spotify playlist import)

`scripts/importa_playlist_spotify.py` is the original standalone Python tool, run locally (not part of the deployed site), that turns a Spotify playlist into a JSON file in the app's backup format (importable via the site's backup-import feature). It reads the playlist via Spotify's public embed (no token needed), resolves each track to a Cifra Club page (direct URL slug, falling back to Cifra Club's search API for covers/mismatches), and extracts the cifra text + tom. Requires `pip3 install requests beautifulsoup4`; run with `--debug` to see search-fallback diagnostics.

`worker/index.js` is a JS port of that same pipeline meant to run as a Cloudflare Worker (needed because the browser can't hit Cifra Club/Spotify directly due to CORS). Same logic — embed parsing, slugify, direct-URL + search-fallback with a JS reimplementation of `difflib`'s similarity ratio, cifra/tom extraction via regex (Workers have no DOM parser, so no BeautifulSoup-equivalent) — exposed as a single `fetch` handler that takes `{ playlist: <url> }` (POST) and returns the backup-format JSON (plus a `falhas` array of tracks not found). `worker/wrangler.toml` configures it (`name = "uque-import"`). Run it locally with `cd worker && npx wrangler dev --port 8787` — no Cloudflare account needed for local dev. **Deployed** at `https://uque-import.tatidigitaldesigner.workers.dev` (free Cloudflare Workers plan, account email `tatidigitaldesigner@gmail.com`). The free plan caps a single invocation at 50 subrequests, so `LIMITE_FAIXAS = 20` truncates any playlist to its first 20 tracks (each track can cost 2+ subrequests: direct fetch + search fallback); the response includes `limitado`/`totalNaPlaylist` so the UI can warn the user when a playlist got cut off.

`importar.html` + `js/importar.js` is the site-facing page: paste a playlist link, it calls the Worker, shows progress, and offers the resulting JSON as a download (importable via the existing backup-import feature). Styled to match the rest of the site (same header/logo/`style.css`). `WORKER_URL` in `js/importar.js` points to the deployed Worker above.

Entry point in the site: clicking "Adicionar música" (the mobile sticky button, or the compact button next to "Ordenar" on desktop) opens a small menu with 3 options — colar cifra, importar arquivo de backup (.json), or importar do Spotify (navigates to `importar.html`). See `toggleAdicionarMenu`/`abrirImportarSpotify` in `musicas-ui.js`.

Progress:

1. ✅ Python pipeline: direct-URL + search-fallback, tom parsing fixed (capotraste suffix no longer leaks into the tom field), matching quality via a similarity threshold (`SIMILARIDADE_MIN`) so covers/mismatches are rejected instead of guessed.
2. ✅ Ported the pipeline to a Cloudflare Worker (`worker/index.js`). Verified its similarity-scoring output is numerically identical to Python's `difflib`, and tested end-to-end locally via `wrangler dev` (e.g. a 100-track playlist correctly found 95/100 cifras, honestly reporting the other 5 as not found).
3. ✅ Built `importar.html`/`js/importar.js` and wired the "Adicionar música" entry point in the site to link to it.
4. ✅ Created a Cloudflare account, deployed the Worker (`uque-import.tatidigitaldesigner.workers.dev`), updated `WORKER_URL`, and verified end-to-end against a live 50-track Spotify playlist through the browser preview. Hit the free plan's 50-subrequest limit on large playlists, fixed by capping at 20 tracks per import with a user-facing warning (see above) rather than paying for the Workers Paid plan.
5. ⬜ Not started (fase 5): confirm `importar.html`/`js/importar.js` ship correctly alongside the rest of the static site once pushed to GitHub Pages (no server-side routing needed since it's a plain static page, but worth a sanity check after the next deploy).
