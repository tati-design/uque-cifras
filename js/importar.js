// Pagina "Importar do Spotify" (importar.html): cola o link da playlist,
// chama o Worker (worker/index.js) e devolve um JSON pra baixar e importar
// pelo backup do site.

// TODO fase 4: trocar pela URL publicada do Worker na Cloudflare.
const WORKER_URL = "http://localhost:8787";

const form = document.getElementById("importar-form");
const linkInput = document.getElementById("importar-link");
const btn = document.getElementById("importar-btn");
const statusEl = document.getElementById("importar-status");
const progressoEl = document.getElementById("importar-progresso");
const progressoFill = document.getElementById("importar-progresso-fill");
const progressoTexto = document.getElementById("importar-progresso-texto");
const resultadoEl = document.getElementById("importar-resultado");
const resumoEl = document.getElementById("importar-resumo");
const falhasEl = document.getElementById("importar-falhas");
const downloadBtn = document.getElementById("importar-download");

let ultimoJson = null;

function mostrarStatus(msg, tipo) {
  statusEl.textContent = msg;
  statusEl.className = "importar-status" + (tipo ? " importar-status-" + tipo : "");
}

function esconder(el) { el.classList.add("hidden"); }
function mostrar(el) { el.classList.remove("hidden"); }

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
    const r = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playlist: link }),
    });
    progressoFill.style.width = "90%";
    progressoTexto.textContent = "Montando o arquivo...";

    const dados = await r.json();
    if (!r.ok) throw new Error(dados.erro || "Erro ao importar.");

    ultimoJson = dados;
    progressoFill.style.width = "100%";
    progressoTexto.textContent = "Pronto!";

    resumoEl.textContent = `${dados.musicas.length} de ${dados.musicas.length + dados.falhas.length} músicas encontradas.`;
    falhasEl.innerHTML = "";
    if (dados.falhas.length) {
      const titulo = document.createElement("li");
      titulo.className = "importar-falhas-titulo";
      titulo.textContent = "Não encontradas (adicione manualmente):";
      falhasEl.appendChild(titulo);
      dados.falhas.forEach((f) => {
        const li = document.createElement("li");
        li.textContent = f;
        falhasEl.appendChild(li);
      });
    }
    mostrar(downloadBtn);
    mostrar(resultadoEl);
  } catch (err) {
    mostrarStatus(err.message || "Não consegui importar essa playlist.", "erro");
  } finally {
    btn.disabled = false;
    esconder(progressoEl);
  }
});

downloadBtn.addEventListener("click", () => {
  if (!ultimoJson) return;
  const blob = new Blob([JSON.stringify(ultimoJson, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `import-spotify-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});
