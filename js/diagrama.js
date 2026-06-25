// ─── SVG Diagram Renderer ─────────────────────────────────────────────────────
function renderDiagram(candidato) {
  const pos = candidato.posicoes;
  const notasTocadas = candidato.notasTocadas;
  const casaMax = Math.max(Math.max(...Object.values(pos)), 4);
  const casaPestana = detectarPestana(pos);
  const casaApoio = detectarPestanaApoio(pos);

  const W = 120, padL = 18, padT = 28, padB = 30;
  const colW = (W - padL - 10) / 3;
  const rowH = 22;
  const H = padT + casaMax * rowH + padB;

  const xs = [padL, padL+colW, padL+2*colW, padL+3*colW];
  const ys = i => padT + i * rowH;

  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;

  // String labels (G C E A)
  CORDAS.forEach((c, i) => {
    svg += `<text x="${xs[i]}" y="${padT-10}" text-anchor="middle" font-size="9" font-family="sans-serif" fill="#888">${c}</text>`;
  });

  // Nut or position marker
  const nutY = padT;
  const casaMinPressionada = Math.min(...Object.values(pos).filter(v=>v>0), Infinity);
  if (casaMinPressionada <= 1 || casaMinPressionada === Infinity) {
    svg += `<line x1="${xs[0]}" y1="${nutY}" x2="${xs[3]}" y2="${nutY}" stroke="#222" stroke-width="3"/>`;
  } else {
    svg += `<text x="${xs[0]-6}" y="${nutY + rowH/2 + 4}" text-anchor="end" font-size="8" fill="#888">${casaMinPressionada}</text>`;
    svg += `<line x1="${xs[0]}" y1="${nutY}" x2="${xs[3]}" y2="${nutY}" stroke="#bbb" stroke-width="1"/>`;
  }

  // Fret lines
  for (let f = 1; f <= casaMax; f++) {
    svg += `<line x1="${xs[0]}" y1="${ys(f)}" x2="${xs[3]}" y2="${ys(f)}" stroke="#ccc" stroke-width="1"/>`;
  }

  // Fret position markers (discreet dots between strings, like on a real fretboard)
  const MARCADORES = [5, 7, 10, 12];
  MARCADORES.forEach(f => {
    if (f > casaMax) return;
    const my = ys(f) - rowH/2;
    if (f === 12) {
      svg += `<circle cx="${(xs[0]+xs[1])/2}" cy="${my}" r="2.5" fill="#e5e5e5"/>`;
      svg += `<circle cx="${(xs[2]+xs[3])/2}" cy="${my}" r="2.5" fill="#e5e5e5"/>`;
    } else {
      svg += `<circle cx="${(xs[1]+xs[2])/2}" cy="${my}" r="2.5" fill="#e5e5e5"/>`;
    }
  });

  // Strings
  CORDAS.forEach((c, i) => {
    svg += `<line x1="${xs[i]}" y1="${nutY}" x2="${xs[i]}" y2="${ys(casaMax)}" stroke="#bbb" stroke-width="1.5"/>`;
  });

  // Barre indicator
  if (casaPestana) {
    const barreY = ys(casaPestana) - rowH/2;
    svg += `<rect x="${xs[0]-4}" y="${barreY-7}" width="${xs[3]-xs[0]+8}" height="14" rx="7" fill="#5b7cf6" opacity="0.85"/>`;
  }

  // Finger dots
  CORDAS.forEach((c, i) => {
    const f = pos[c];
    if (f === 0) {
      // open string circle
      svg += `<circle cx="${xs[i]}" cy="${nutY-8}" r="4" fill="none" stroke="#5b7cf6" stroke-width="1.5"/>`;
    } else {
      const dotY = ys(f) - rowH/2;
      const isBarre = casaPestana && f === casaPestana;
      svg += `<circle cx="${xs[i]}" cy="${dotY}" r="7" fill="${isBarre ? '#5b7cf6' : '#222'}"/>`;
      svg += `<text x="${xs[i]}" y="${dotY+3}" text-anchor="middle" font-size="8" font-family="sans-serif" font-weight="600" fill="#fff">${f}</text>`;
    }
  });

  // Note labels bottom
  CORDAS.forEach((c, i) => {
    const nota = notasTocadas[c];
    const isOpen = pos[c] === 0;
    svg += `<text x="${xs[i]}" y="${H-4}" text-anchor="middle" font-size="8" font-family="sans-serif" fill="${isOpen?'#5b7cf6':'#555'}">${nota}</text>`;
  });

  svg += `</svg>`;
  return svg;
}
