document.getElementById('query').addEventListener('keydown', e => {
  if (e.key === 'Enter') run();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !document.getElementById('acorde-modal').classList.contains('hidden')) {
    fecharAcordeModal();
    return;
  }

  const digitandoEmCampo = ['INPUT', 'TEXTAREA'].includes(e.target.tagName);
  const musicaViewAberta = !document.getElementById('musica-view-modal').classList.contains('hidden');
  if (!digitandoEmCampo && musicaViewAberta) {
    if (e.key === 'ArrowLeft') { navegarMusica(-1); }
    else if (e.key === 'ArrowRight') { navegarMusica(1); }
  }
});

// ─── Abas: Minhas Músicas / Pesquisar Acorde ───────────────────────────────────
function setTab(nome) {
  document.getElementById('tab-musicas').classList.toggle('hidden', nome !== 'musicas');
  document.getElementById('tab-buscar').classList.toggle('hidden', nome !== 'buscar');
  document.getElementById('tab-btn-musicas').classList.toggle('active', nome === 'musicas');
  document.getElementById('tab-btn-buscar').classList.toggle('active', nome === 'buscar');
}

// Aplica gêneros do CSV a músicas sem gênero definido, então carrega a lista
migrarIdsUnicos();
migrarGeneros();
renderMusicasLista();
setAndRun('Am7');
