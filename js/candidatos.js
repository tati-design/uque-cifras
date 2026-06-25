function* cartesian(repeat, arr) {
  // itertools.product equivalent
  const len = arr.length ** repeat;
  for (let i = 0; i < len; i++) {
    const combo = [];
    let n = i;
    for (let j = 0; j < repeat; j++) {
      combo.unshift(arr[n % arr.length]);
      n = Math.floor(n / arr.length);
    }
    yield combo;
  }
}

function gerarCandidatos(notasAcorde) {
  const casas = [0,1,2,3,4,5];
  const candidatos = [];

  for (const combo of cartesian(4, casas)) {
    const posicoes = {};
    const notasTocadas = {};
    CORDAS.forEach((c, i) => {
      posicoes[c] = combo[i];
      notasTocadas[c] = notaNaCasa(c, combo[i]);
    });

    if (!CORDAS.every(c => notasAcorde.has(notasTocadas[c]))) continue;

    const pressionadas = combo.filter(c => c > 0);
    if (pressionadas.length > 0) {
      const span = Math.max(...pressionadas) - Math.min(...pressionadas);
      if (span > MAX_SPAN) continue;
    }

    const pressionadasDict = {};
    CORDAS.forEach(c => { if (posicoes[c] > 0) pressionadasDict[c] = posicoes[c]; });
    const cordasSoltas = combo.filter(c => c === 0).length;

    const gruposPestana = {};
    for (const [c, casa] of Object.entries(pressionadasDict)) {
      if (!gruposPestana[casa]) gruposPestana[casa] = [];
      gruposPestana[casa].push(c);
    }
    const pontosPestana = Object.values(gruposPestana).filter(g => g.length >= 2).length;
    const cordasEmPestana = Object.values(gruposPestana).filter(g => g.length >= 2).reduce((s, g) => s + g.length, 0);
    const cordasSolo = Object.keys(pressionadasDict).length - cordasEmPestana;
    const unidadesEsforco = pontosPestana + cordasSolo;

    const notasDistintas = new Set(Object.values(notasTocadas)).size;

    candidatos.push({
      posicoes, notasTocadas, cordasSoltas,
      casaMinima: pressionadas.length ? Math.min(...pressionadas) : 0,
      span: pressionadas.length ? Math.max(...pressionadas) - Math.min(...pressionadas) : 0,
      notasDistintas, unidadesEsforco
    });
  }
  return candidatos;
}

function filtrarMelhorCobertura(cands) {
  if (!cands.length) return [];
  const melhor = Math.max(...cands.map(c => c.notasDistintas));
  return cands.filter(c => c.notasDistintas === melhor);
}

function removerDuplicatas(cands) {
  const vistos = new Set();
  return cands.filter(c => {
    const chave = CORDAS.map(co => c.posicoes[co]).join(',');
    if (vistos.has(chave)) return false;
    vistos.add(chave);
    return true;
  });
}

function ordenar(cands) {
  return [...cands].sort((a, b) =>
    a.unidadesEsforco - b.unidadesEsforco ||
    a.casaMinima - b.casaMinima ||
    a.span - b.span
  );
}

function detectarPestana(posicoes) {
  // Pestana completa impossível se alguma corda precisa ficar solta
  if (Object.values(posicoes).some(v => v === 0)) return null;
  const press = Object.entries(posicoes).filter(([,v]) => v > 0);
  if (press.length < 2) return null;
  const contagem = {};
  press.forEach(([,v]) => contagem[v] = (contagem[v]||0) + 1);
  // Candidatas com >= 2 cordas, ordenadas da mais baixa pra mais alta
  const candidatas = Object.entries(contagem)
    .filter(([,n]) => n >= 2)
    .map(([c]) => parseInt(c))
    .sort((a,b) => a-b);
  for (const casa of candidatas) {
    // Pestana na casa X só é válida se nenhuma corda tiver 0 < pos < X
    const bloqueada = Object.values(posicoes).some(v => v > 0 && v < casa);
    if (!bloqueada) return casa;
  }
  return null;
}

function detectarPestanaApoio(posicoes) {
  const casas = Object.values(posicoes);
  if (casas.some(c => c === 0)) return null;
  return Math.min(...casas);
}

function gerarAcorde(notasEntrada, topN = 3, nomeAcorde = "") {
  const notasNorm = new Set(notasEntrada.map(normalizar));
  let cands = gerarCandidatos(notasNorm);
  cands = filtrarMelhorCobertura(cands);
  cands = removerDuplicatas(cands);
  cands = ordenar(cands);
  return { cands: cands.slice(0, topN), notasNorm, nomeAcorde };
}
