// ─── Favoritos (localStorage) ──────────────────────────────────────────────────
// Regra: no máximo 1 voicing favoritado por acorde (favoritar um novo formato
// para o mesmo acorde substitui o anterior).
const FAVORITOS_KEY = "ukulele_favoritos";

function listarFavoritos() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITOS_KEY)) || [];
  } catch {
    return [];
  }
}

function salvarListaFavoritos(lista) {
  localStorage.setItem(FAVORITOS_KEY, JSON.stringify(lista));
}

function buscarFavorito(identificador) {
  return listarFavoritos().find(f => f.nomeAcorde === identificador) || null;
}

function posicoesIguais(a, b) {
  return CORDAS.every(c => a[c] === b[c]);
}

function ehFavorito(identificador, posicoes) {
  const f = buscarFavorito(identificador);
  return !!f && posicoesIguais(f.posicoes, posicoes);
}

function toggleFavorito(identificador, notas, posicoes) {
  const lista = listarFavoritos();
  const existente = lista.find(f => f.nomeAcorde === identificador);

  if (existente && posicoesIguais(existente.posicoes, posicoes)) {
    // já é o favorito atual -> remove
    salvarListaFavoritos(lista.filter(f => f.nomeAcorde !== identificador));
    return;
  }

  // novo favorito para esse acorde (substitui o anterior, se houver)
  const semEsse = lista.filter(f => f.nomeAcorde !== identificador);
  semEsse.push({
    id: `fav_${Date.now()}`,
    nomeAcorde: identificador,
    notas,
    posicoes,
    criadoEm: new Date().toISOString()
  });
  salvarListaFavoritos(semEsse);
}

function removerFavoritoPorId(id) {
  salvarListaFavoritos(listarFavoritos().filter(f => f.id !== id));
}
