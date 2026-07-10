// Pagina "Importar do Spotify" (importar.html): cola o link da playlist,
// chama o Worker (worker/index.js) em lotes (tamanho definido no Worker) e
// devolve um JSON pra baixar e importar pelo backup do site.

const WORKER_URL = "https://uque-import.tatidigitaldesigner.workers.dev";

const form = document.getElementById("importar-form");
const linkInput = document.getElementById("importar-link");
const btn = document.getElementById("importar-btn");
const statusEl = document.getElementById("importar-status");
const progressoEl = document.getElementById("importar-progresso");
const progressoFill = document.getElementById("importar-progresso-fill");
const progressoTexto = document.getElementById("importar-progresso-texto");
const resultadoEl = document.getElementById("importar-resultado");
const nomePlaylistEl = document.getElementById("importar-nome-playlist");
const resumoEl = document.getElementById("importar-resumo");
const falhasEl = document.getElementById("importar-falhas");
const maisBtn = document.getElementById("importar-mais");
const downloadBtn = document.getElementById("importar-download");

// Estado acumulado ao longo dos lotes de uma mesma playlist.
let estado = null;

function mostrarStatus(msg, tipo) {
  statusEl.textContent = msg;
  statusEl.className = "importar-status" + (tipo ? " importar-status-" + tipo : "");
}

function esconder(el) { el.classList.add("hidden"); }
function mostrar(el) { el.classList.remove("hidden"); }

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

function renderizarResultado() {
  nomePlaylistEl.textContent = estado.nomePlaylist;
  mostrar(nomePlaylistEl);

  const processadas = estado.offsetProcessado;
  resumoEl.textContent = `${estado.musicas.length} de ${processadas} músicas encontradas (${processadas} de ${estado.totalNaPlaylist} da playlist processadas).`;

  falhasEl.innerHTML = "";
  if (estado.falhas.length) {
    const titulo = document.createElement("li");
    titulo.className = "importar-falhas-titulo";
    titulo.textContent = "Não encontradas (adicione manualmente):";
    falhasEl.appendChild(titulo);
    estado.falhas.forEach((f) => {
      const li = document.createElement("li");
      li.textContent = f;
      falhasEl.appendChild(li);
    });
  }

  progressoFill.style.width = `${Math.round((processadas / estado.totalNaPlaylist) * 100)}%`;

  if (estado.proximoOffset !== null) {
    mostrar(maisBtn);
    mostrar(progressoEl);
    progressoTexto.textContent = `${processadas} de ${estado.totalNaPlaylist} músicas processadas.`;
  } else {
    esconder(maisBtn);
    esconder(progressoEl);
  }

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

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const link = linkInput.value.trim();
  if (!link) return;

  btn.disabled = true;
  esconder(resultadoEl);
  esconder(progressoEl);
  mostrar(progressoEl);
  progressoFill.style.width = "10%";
  progressoTexto.textContent = "Lendo a playlist...";
  mostrarStatus("");

  try {
    const dados = await buscarLote(link, 0);
    estado = {
      link,
      nomePlaylist: dados.nomePlaylist,
      totalNaPlaylist: dados.totalNaPlaylist,
      offsetProcessado: dados.offset + dados.musicas.length + dados.falhas.length,
      proximoOffset: dados.proximoOffset,
      musicas: dados.musicas,
      favoritos: [],
      falhas: dados.falhas,
    };
    renderizarResultado();
  } catch (err) {
    mostrarStatus(err.message || "Não consegui importar essa playlist.", "erro");
    esconder(progressoEl);
  } finally {
    btn.disabled = false;
  }
});

maisBtn.addEventListener("click", async () => {
  if (!estado || estado.proximoOffset === null) return;
  maisBtn.disabled = true;
  progressoTexto.textContent = `Buscando as próximas músicas (${estado.offsetProcessado} de ${estado.totalNaPlaylist})...`;

  try {
    const dados = await buscarLote(estado.link, estado.proximoOffset);
    estado.musicas.push(...dados.musicas);
    estado.falhas.push(...dados.falhas);
    estado.offsetProcessado = dados.offset + dados.musicas.length + dados.falhas.length;
    estado.proximoOffset = dados.proximoOffset;
    renderizarResultado();
  } catch (err) {
    mostrarStatus(err.message || "Não consegui buscar as próximas músicas.", "erro");
  } finally {
    maisBtn.disabled = false;
  }
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
