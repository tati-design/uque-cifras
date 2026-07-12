// Pagina "Importar playlist" (importar.html): cola o link da playlist,
// chama o Worker (worker/index.js) em lotes (tamanho definido no Worker) e
// devolve um JSON pra baixar e importar pelo backup do site.

const WORKER_URL = "https://uque-import.tatidigitaldesigner.workers.dev";

const formSecaoEl = document.getElementById("importar-form-secao");
const form = document.getElementById("importar-form");
const linkInput = document.getElementById("importar-link");
const btn = document.getElementById("importar-btn");
const statusEl = document.getElementById("importar-status");
const resultadoEl = document.getElementById("importar-resultado");
const nomePlaylistEl = document.getElementById("importar-nome-playlist");
const contagemFaixasEl = document.getElementById("importar-contagem-faixas");
const segEncontradasEl = document.getElementById("importar-seg-encontradas");
const segFalhasEl = document.getElementById("importar-seg-falhas");
const secaoFalhasEl = document.getElementById("importar-secao-falhas");
const secaoPendentesEl = document.getElementById("importar-secao-pendentes");
const countEncontradasEl = document.getElementById("importar-count-encontradas");
const countFalhasEl = document.getElementById("importar-count-falhas");
const countPendentesEl = document.getElementById("importar-count-pendentes");
const tbodyEncontradasEl = document.getElementById("importar-tbody-encontradas");
const tbodyFalhasEl = document.getElementById("importar-tbody-falhas");
const tbodyPendentesEl = document.getElementById("importar-tbody-pendentes");
const maisBtn = document.getElementById("importar-mais");
const maisTextoEl = document.getElementById("importar-mais-texto");
const adicionarLibBtn = document.getElementById("importar-adicionar-lib");
const adicionarLibTextoEl = document.getElementById("importar-adicionar-lib-texto");
const downloadBtn = document.getElementById("importar-download");
const resetBtn = document.getElementById("importar-reset");

// Estado acumulado ao longo dos lotes de uma mesma playlist.
let estado = null;

function esconder(el) { el.classList.add("hidden"); }
function mostrar(el) { el.classList.remove("hidden"); }

function dotsHTML() {
  return '<span class="importar-dots"><span></span><span></span><span></span></span>';
}

function mostrarStatus(msg, tipo) {
  statusEl.textContent = msg;
  statusEl.className = "importar-status" + (tipo ? " importar-status-" + tipo : "");
}

function mostrarCarregando(msg) {
  statusEl.innerHTML = msg + dotsHTML();
  statusEl.className = "importar-status";
}

function slugifyNome(nome) {
  return nome
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function nomeArquivo() {
  const data = new Date().toISOString().slice(0, 10);
  const slug = estado?.nomePlaylist ? slugifyNome(estado.nomePlaylist) : "playlist";
  return `uque-import-${slug}-${data}.json`;
}

function preencherTabela(tbody, linhas, formatarTitulo) {
  tbody.innerHTML = "";
  linhas.forEach((item) => {
    const tr = document.createElement("tr");
    const tdTitulo = document.createElement("td");
    tdTitulo.textContent = formatarTitulo(item);
    const tdArtista = document.createElement("td");
    tdArtista.textContent = item.artista;
    tr.appendChild(tdTitulo);
    tr.appendChild(tdArtista);
    tbody.appendChild(tr);
  });
}

function preencherTabelaFalhas(tbody, falhas) {
  tbody.innerHTML = "";
  falhas.forEach((item, indice) => {
    const tr = document.createElement("tr");
    const tdTitulo = document.createElement("td");
    tdTitulo.textContent = item.titulo;
    const tdArtista = document.createElement("td");
    tdArtista.textContent = item.artista;
    const tdAcao = document.createElement("td");
    tdAcao.className = "importar-tabela-acao";
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "icon-btn icon-btn-danger";
    delBtn.title = "Remover da lista";
    delBtn.innerHTML = '<span class="material-symbols-outlined">delete</span>';
    delBtn.addEventListener("click", () => {
      estado.falhas.splice(indice, 1);
      renderizarResultado();
    });
    tdAcao.appendChild(delBtn);
    tr.append(tdTitulo, tdArtista, tdAcao);
    tbody.appendChild(tr);
  });
}

function renderizarResultado() {
  const { musicas, falhas, pendentes, totalNaPlaylist, tamanhoLote } = estado;

  nomePlaylistEl.textContent = estado.nomePlaylist;
  contagemFaixasEl.textContent = `${totalNaPlaylist} faixas na playlist`;

  segEncontradasEl.style.width = `${(musicas.length / totalNaPlaylist) * 100}%`;
  segFalhasEl.style.width = `${(falhas.length / totalNaPlaylist) * 100}%`;

  countEncontradasEl.textContent = `${musicas.length} Cifras encontradas`;
  countFalhasEl.textContent = `${falhas.length} Não encontradas`;
  countPendentesEl.textContent = `${pendentes.length} Pendentes`;

  secaoFalhasEl.classList.toggle("hidden", falhas.length === 0);
  secaoPendentesEl.classList.toggle("hidden", pendentes.length === 0);

  preencherTabela(tbodyEncontradasEl, musicas, (m) => m.titulo);
  preencherTabelaFalhas(tbodyFalhasEl, falhas);
  preencherTabela(tbodyPendentesEl, pendentes, (p) => p.titulo);

  if (pendentes.length > 0) {
    const proximoLote = Math.min(tamanhoLote, pendentes.length);
    maisTextoEl.textContent = `Carregar mais ${proximoLote}`;
    mostrar(maisBtn);
  } else {
    esconder(maisBtn);
  }

  adicionarLibTextoEl.textContent = `Adicionar ${musicas.length} à biblioteca`;
  adicionarLibBtn.disabled = musicas.length === 0;
  mostrar(adicionarLibBtn);
  mostrar(downloadBtn);
  mostrar(resultadoEl);
}

async function buscarLote(link, offset) {
  const r = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playlist: link, offset }),
  });
  const dados = await r.json();
  if (!r.ok) throw new Error(dados.erro || "Erro ao importar.");
  return dados;
}

function resetar() {
  estado = null;
  linkInput.value = "";
  esconder(resultadoEl);
  mostrarStatus("");
  mostrar(formSecaoEl);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const link = linkInput.value.trim();
  if (!link) return;

  btn.disabled = true;
  esconder(resultadoEl);
  mostrarCarregando("Lendo a playlist");

  try {
    const dados = await buscarLote(link, 0);
    estado = {
      link,
      nomePlaylist: dados.nomePlaylist,
      totalNaPlaylist: dados.totalNaPlaylist,
      tamanhoLote: dados.tamanhoLote,
      proximoOffset: dados.proximoOffset,
      musicas: dados.musicas,
      favoritos: [],
      falhas: dados.falhas,
      pendentes: dados.pendentes,
    };
    mostrarStatus("");
    esconder(formSecaoEl);
    renderizarResultado();
  } catch (err) {
    mostrarStatus(err.message || "Não consegui importar essa playlist.", "erro");
  } finally {
    btn.disabled = false;
  }
});

maisBtn.addEventListener("click", async () => {
  if (!estado || estado.proximoOffset === null) return;
  maisBtn.disabled = true;
  maisTextoEl.innerHTML = "Buscando" + dotsHTML();

  try {
    const dados = await buscarLote(estado.link, estado.proximoOffset);
    estado.musicas.push(...dados.musicas);
    estado.falhas.push(...dados.falhas);
    estado.pendentes = dados.pendentes;
    estado.proximoOffset = dados.proximoOffset;
    renderizarResultado();
  } catch (err) {
    mostrarStatus(err.message || "Não consegui buscar as próximas músicas.", "erro");
    renderizarResultado();
  } finally {
    maisBtn.disabled = false;
  }
});

adicionarLibBtn.addEventListener("click", () => {
  if (!estado || !estado.musicas.length) return;
  estado.musicas.forEach((m) => {
    salvarMusica({
      titulo: m.titulo,
      artista: m.artista,
      tom: m.tom,
      cifraTexto: m.cifraTexto,
      acordes: m.acordes,
    });
  });
  const qtd = estado.musicas.length;
  sessionStorage.setItem("uque_toast", `${qtd} música${qtd === 1 ? "" : "s"} adicionada${qtd === 1 ? "" : "s"} à sua biblioteca.`);
  window.location.href = "index.html";
});

downloadBtn.addEventListener("click", () => {
  if (!estado) return;
  const out = {
    musicas: estado.musicas,
    favoritos: estado.favoritos,
    exportadoEm: new Date().toISOString().replace(/\.\d+Z$/, ".000Z"),
    falhas: estado.falhas,
  };
  const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo();
  a.click();
  URL.revokeObjectURL(url);
});

resetBtn.addEventListener("click", resetar);

// ─── Abas ───────────────────────────────────────────────────────────────────

const tabPlaylistEl = document.getElementById("importar-tab-playlist");
const tabMusicaEl = document.getElementById("importar-tab-musica");
const painelPlaylistEl = document.getElementById("importar-painel-playlist");
const painelMusicaEl = document.getElementById("importar-painel-musica");

function selecionarAba(aba) {
  const ehPlaylist = aba === "playlist";
  tabPlaylistEl.classList.toggle("active", ehPlaylist);
  tabMusicaEl.classList.toggle("active", !ehPlaylist);
  painelPlaylistEl.classList.toggle("hidden", !ehPlaylist);
  painelMusicaEl.classList.toggle("hidden", ehPlaylist);
}

tabPlaylistEl.addEventListener("click", () => selecionarAba("playlist"));
tabMusicaEl.addEventListener("click", () => selecionarAba("musica"));

if (new URLSearchParams(window.location.search).get("aba") === "musica") {
  selecionarAba("musica");
}

// ─── Pesquisar uma música avulsa ────────────────────────────────────────────

const musicaFormSecaoEl = document.getElementById("musica-form-secao");
const musicaTituloInput = document.getElementById("musica-titulo");
const musicaArtistaInput = document.getElementById("musica-artista");
const musicaBtn = document.getElementById("musica-btn");
const musicaStatusEl = document.getElementById("musica-status");
const musicaResultadoEl = document.getElementById("musica-resultado");
const musicaNomeEncontradaEl = document.getElementById("musica-nome-encontrada");
const musicaArtistaEncontradaEl = document.getElementById("musica-artista-encontrada");
const musicaCifraTextoEl = document.getElementById("musica-cifra-texto");
const musicaCopiarBtn = document.getElementById("musica-copiar");
const musicaAdicionarBtn = document.getElementById("musica-adicionar");
const musicaResetBtn = document.getElementById("musica-reset");

let musicaEncontrada = null;

function mostrarStatusMusica(msg, tipo) {
  musicaStatusEl.textContent = msg;
  musicaStatusEl.className = "importar-status" + (tipo ? " importar-status-" + tipo : "");
}

async function buscarMusica(titulo, artista) {
  const r = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ titulo, artista }),
  });
  const dados = await r.json();
  if (!r.ok) throw new Error(dados.erro || "Erro ao pesquisar.");
  return dados;
}

function resetarMusica() {
  musicaEncontrada = null;
  musicaTituloInput.value = "";
  musicaArtistaInput.value = "";
  esconder(musicaResultadoEl);
  mostrarStatusMusica("");
  mostrar(musicaFormSecaoEl);
}

document.getElementById("musica-form").addEventListener("submit", (e) => {
  e.preventDefault();
  musicaBtn.click();
});

musicaBtn.addEventListener("click", async () => {
  const titulo = musicaTituloInput.value.trim();
  const artista = musicaArtistaInput.value.trim();
  if (!titulo) return;

  musicaBtn.disabled = true;
  esconder(musicaResultadoEl);
  mostrarStatusMusica("");
  musicaStatusEl.innerHTML = "Pesquisando" + dotsHTML();
  musicaStatusEl.className = "importar-status";

  try {
    const dados = await buscarMusica(titulo, artista);
    if (!dados.encontrada) {
      mostrarStatusMusica("Não encontrei essa cifra. Confira o nome da música e do artista e tente de novo.", "erro");
      return;
    }
    musicaEncontrada = dados.musica;
    mostrarStatusMusica("");
    esconder(musicaFormSecaoEl);
    musicaNomeEncontradaEl.textContent = musicaEncontrada.titulo;
    musicaArtistaEncontradaEl.textContent = musicaEncontrada.artista;
    musicaCifraTextoEl.textContent = musicaEncontrada.cifraTexto;
    musicaAdicionarBtn.disabled = false;
    musicaAdicionarBtn.innerHTML = '<span class="material-symbols-outlined">add</span><span>Adicionar cifra</span>';
    mostrar(musicaResultadoEl);
  } catch (err) {
    mostrarStatusMusica(err.message || "Não consegui pesquisar essa música.", "erro");
  } finally {
    musicaBtn.disabled = false;
  }
});

function textoParaColar(musica) {
  return `${musica.titulo}\n${musica.artista}\nTom: ${musica.tom}\n\n${musica.cifraTexto}`;
}

musicaCopiarBtn.addEventListener("click", async () => {
  if (!musicaEncontrada) return;
  try {
    await navigator.clipboard.writeText(textoParaColar(musicaEncontrada));
    const original = musicaCopiarBtn.innerHTML;
    musicaCopiarBtn.innerHTML = '<span class="material-symbols-outlined">check</span>';
    setTimeout(() => { musicaCopiarBtn.innerHTML = original; }, 1500);
  } catch {
    mostrarStatusMusica("Não consegui copiar. Selecione o texto manualmente.", "erro");
  }
});

musicaAdicionarBtn.addEventListener("click", () => {
  if (!musicaEncontrada) return;
  const nova = salvarMusica({
    titulo: musicaEncontrada.titulo,
    artista: musicaEncontrada.artista,
    tom: musicaEncontrada.tom,
    cifraTexto: musicaEncontrada.cifraTexto,
    acordes: musicaEncontrada.acordes,
  });
  sessionStorage.setItem("uque_toast", `"${musicaEncontrada.titulo}" foi adicionada à sua biblioteca.`);
  window.location.href = `index.html#m/${nova.id}`;
});

musicaResetBtn.addEventListener("click", resetarMusica);
