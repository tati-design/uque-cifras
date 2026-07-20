// ─── Chord name -> notes ──────────────────────────────────────────────────────
function calcularNotasAcorde(nome) {
  // º (ordinal masculino, U+00BA) é usado por engano no lugar de ° (grau, U+00B0)
  // em cifras coladas de outras fontes — normaliza pra sempre reconhecer diminuto
  nome = nome.replace(/º/g, '°');
  const m = nome.match(/^([A-G][b#]?)/);
  if (!m) throw new Error(`Não identifiquei a raiz em: '${nome}'`);
  const rootStr = ENARMONICOS[m[1]] || m[1];
  if (!NOTAS.includes(rootStr)) throw new Error(`Nota raiz inválida: '${rootStr}'`);
  const rootIdx = NOTAS.indexOf(rootStr);
  let resto = nome.slice(m[0].length);

  let intervalos = new Set([0, 4, 7]);

  if (/^m(?!aj)/.test(resto)) { intervalos = new Set([0,3,7]); resto = resto.slice(1); }
  else if (resto.startsWith('min')) { intervalos = new Set([0,3,7]); resto = resto.slice(3); }
  else if (resto.startsWith('dim') || resto.startsWith('°')) {
    intervalos = new Set([0,3,6]);
    resto = resto.startsWith('dim') ? resto.slice(3) : resto.slice(1);
  } else if (resto.startsWith('aug') || resto.startsWith('+')) {
    intervalos = new Set([0,4,8]);
    resto = resto.startsWith('aug') ? resto.slice(3) : resto.slice(1);
  } else if (resto.startsWith('sus2')) { intervalos = new Set([0,2,7]); resto = resto.slice(4); }
  else if (/^sus4?/.test(resto)) { intervalos = new Set([0,5,7]); resto = resto.replace(/^sus4?/,''); }

  let isMajExt = false;
  if (/^(maj|M)(?=\d)/.test(resto)) {
    isMajExt = true;
    resto = resto.replace(/^(maj|M)/,'');
  }

  const extM = resto.match(/^(\d+)/);
  let extension = extM ? parseInt(extM[1]) : null;
  if (extM) resto = resto.slice(extM[0].length);

  if (extension === 7 && resto.startsWith('M')) { isMajExt = true; resto = resto.slice(1); }

  const isMinor = intervalos.has(3) && !intervalos.has(4);
  const isDim = intervalos.has(3) && intervalos.has(6) && !intervalos.has(7);

  // "4"/"5" soltos (sem "sus"/"add") são notação informal comum em cifras:
  // D4 = Dsus4 (retira a terça, usa a quarta); D5 = poder (só fundamental + quinta)
  if (extension === 4) { intervalos.delete(3); intervalos.delete(4); intervalos.add(5); }
  else if (extension === 5) { intervalos.delete(3); intervalos.delete(4); }
  else if (extension === 6) intervalos.add(9);
  else if (extension === 7) intervalos.add(isMajExt ? 11 : (isDim ? 9 : 10));
  else if (extension === 9) { intervalos.add(isMajExt ? 11 : 10); intervalos.add(2); }
  else if (extension === 11) { intervalos.add(isMajExt ? 11 : 10); intervalos.add(2); intervalos.add(5); }
  else if (extension === 13) { intervalos.add(isMajExt ? 11 : 10); intervalos.add(2); intervalos.add(5); intervalos.add(9); }

  resto = resto.replace(/[()]/g,'');
  const altMap = { b5:[7,6], '#5':[7,8], b9:[2,1], '#9':[2,3], '#11':[5,6], b13:[9,8] };
  for (const [alt, [rem, add]] of Object.entries(altMap)) {
    if (resto.includes(alt)) { intervalos.delete(rem); intervalos.add(add); resto = resto.replace(alt,''); }
  }
  for (const extra of [...(resto.matchAll(/\b(9|11|13)\b/g))]) {
    intervalos.add({9:2,11:5,13:9}[parseInt(extra[1])]);
  }
  for (const add of [...(resto.matchAll(/add(\d+)/g))]) {
    const s = {2:2,4:5,6:9,9:2,11:5,13:9}[parseInt(add[1])];
    if (s !== undefined) intervalos.add(s);
  }

  return [...intervalos].sort((a,b)=>a-b).map(i => NOTAS[(rootIdx+i)%12]);
}

// ─── Cache em memória ──────────────────────────────────────────────────────────
// gerarCandidatos testa 6^4 = 1296 combinações por chamada; como o resultado é
// determinístico para um dado nome de acorde, evitamos recalcular a cada render
// (chips, tooltip, modal) guardando o resultado (ou o erro) na primeira vez.
const _cacheAcordes = new Map();

function obterAcordeInfo(nomeAcorde) {
  if (_cacheAcordes.has(nomeAcorde)) {
    const cached = _cacheAcordes.get(nomeAcorde);
    if (cached.erro) throw cached.erro;
    return cached;
  }
  try {
    const notas = calcularNotasAcorde(nomeAcorde);
    const resultado = gerarAcorde(notas, 3, nomeAcorde);
    _cacheAcordes.set(nomeAcorde, resultado);
    return resultado;
  } catch (e) {
    _cacheAcordes.set(nomeAcorde, { erro: e });
    throw e;
  }
}

// ─── Chord identification ─────────────────────────────────────────────────────
const TEMPLATES = [
  [[0,4,7],""], [[0,3,7],"m"], [[0,3,6],"dim"], [[0,4,8],"aug"],
  [[0,2,7],"sus2"], [[0,5,7],"sus4"], [[0,4,7,9],"6"], [[0,3,7,9],"m6"],
  [[0,4,7,10],"7"], [[0,4,7,11],"maj7"], [[0,3,7,10],"m7"], [[0,3,7,11],"mMaj7"],
  [[0,3,6,9],"dim7"], [[0,3,6,10],"m7(b5)"], [[0,4,8,10],"7(#5)"], [[0,4,6,10],"7(b5)"],
  [[0,2,4,7,10],"9"], [[0,2,4,7,11],"maj9"], [[0,2,3,7,10],"m9"],
  [[0,1,4,7,10],"7(b9)"], [[0,3,4,7,10],"7(#9)"], [[0,2,4,6,10],"9(b5)"],
];

function identificarAcorde(notas) {
  const indices = new Set(notas.map(n => NOTAS.indexOf(normalizar(n))));
  const resultados = [];
  for (let root = 0; root < 12; root++) {
    const ints = [...indices].map(i => (i - root + 12) % 12).sort((a,b)=>a-b);
    for (const [tpl, suf] of TEMPLATES) {
      if (JSON.stringify([...tpl].sort((a,b)=>a-b)) === JSON.stringify(ints))
        resultados.push(NOTAS[root] + suf);
    }
  }
  return resultados;
}
