// ─── SVG Diagram Renderer ─────────────────────────────────────────────────────
function renderDiagram(candidato) {
  const pos = candidato.posicoes;
  const notasTocadas = candidato.notasTocadas;
  const casaPestana = detectarPestana(pos);
  const casaApoio = detectarPestanaApoio(pos);

  const fretsPressionados = Object.values(pos).filter(v => v > 0);
  const casaMinPressionada = fretsPressionados.length ? Math.min(...fretsPressionados) : 0;
  const casaMaxPressionada = fretsPressionados.length ? Math.max(...fretsPressionados) : 0;

  // Sempre 5 casas. Offset só quando o acorde não cabe na janela 1-5.
  const NUM_ROWS = 5;
  const offset = casaMaxPressionada > 5 ? casaMinPressionada - 1 : 0;

  const W = 120, padL = 18, padT = 28, padB = 30;
  const colW = (W - padL - 10) / 3;
  const rowH = 22;
  const H = padT + NUM_ROWS * rowH + padB;

  const xs = [padL, padL + colW, padL + 2 * colW, padL + 3 * colW];
  const ys = r => padT + r * rowH; // r=0 é a linha do topo, r=1 é o fim da 1ª casa...

  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;

  // String labels (G C E A)
  CORDAS.forEach((c, i) => {
    svg += `<text x="${xs[i]}" y="${padT - 10}" text-anchor="middle" font-size="9" font-family="sans-serif" fill="#888">${c}</text>`;
  });

  // Nut (se começa do fret 1) ou indicador de posição (se começa acima)
  if (offset === 0) {
    svg += `<line x1="${xs[0]}" y1="${ys(0)}" x2="${xs[3]}" y2="${ys(0)}" stroke="#222" stroke-width="3"/>`;
  } else {
    svg += `<text x="${xs[0] - 6}" y="${ys(0) + rowH / 2 + 4}" text-anchor="end" font-size="8" fill="#888">${offset + 1}</text>`;
    svg += `<line x1="${xs[0]}" y1="${ys(0)}" x2="${xs[3]}" y2="${ys(0)}" stroke="#bbb" stroke-width="1"/>`;
  }

  // Fret lines
  for (let r = 1; r <= NUM_ROWS; r++) {
    svg += `<line x1="${xs[0]}" y1="${ys(r)}" x2="${xs[3]}" y2="${ys(r)}" stroke="#ccc" stroke-width="1"/>`;
  }

  // Fret position markers (pontos discretos entre cordas, como no braço real)
  const MARCADORES = [5, 7, 10, 12];
  MARCADORES.forEach(f => {
    const r = f - offset;
    if (r < 1 || r > NUM_ROWS) return;
    const my = ys(r) - rowH / 2;
    if (f === 12) {
      svg += `<circle cx="${(xs[0] + xs[1]) / 2}" cy="${my}" r="2.5" fill="#e5e5e5"/>`;
      svg += `<circle cx="${(xs[2] + xs[3]) / 2}" cy="${my}" r="2.5" fill="#e5e5e5"/>`;
    } else {
      svg += `<circle cx="${(xs[1] + xs[2]) / 2}" cy="${my}" r="2.5" fill="#e5e5e5"/>`;
    }
  });

  // Strings
  CORDAS.forEach((c, i) => {
    svg += `<line x1="${xs[i]}" y1="${ys(0)}" x2="${xs[i]}" y2="${ys(NUM_ROWS)}" stroke="#bbb" stroke-width="1.5"/>`;
  });

  // Barre indicator
  if (casaPestana) {
    const r = casaPestana - offset;
    const barreY = ys(r) - rowH / 2;
    svg += `<rect x="${xs[0] - 4}" y="${barreY - 7}" width="${xs[3] - xs[0] + 8}" height="14" rx="7" fill="#5b7cf6" opacity="0.85"/>`;
    svg += `<text x="${(xs[0] + xs[3]) / 2}" y="${barreY + 3.5}" text-anchor="middle" font-size="8" font-family="sans-serif" font-weight="bold" fill="#fff">${casaPestana}</text>`;
  }

  // Finger dots
  CORDAS.forEach((c, i) => {
    const f = pos[c];
    if (f === 0) {
      svg += `<circle cx="${xs[i]}" cy="${ys(0) - 8}" r="4" fill="none" stroke="#5b7cf6" stroke-width="1.5"/>`;
    } else {
      const r = f - offset; // linha visual (1-based)
      const dotY = ys(r) - rowH / 2;
      const isBarre = casaPestana && f === casaPestana;
      svg += `<circle cx="${xs[i]}" cy="${dotY}" r="7" fill="${isBarre ? '#5b7cf6' : '#222'}"/>`;
      if (!isBarre) svg += `<text x="${xs[i]}" y="${dotY + 3.5}" text-anchor="middle" font-size="8" font-family="sans-serif" font-weight="bold" fill="#fff">${f}</text>`;
    }
  });

  // Note labels bottom
  CORDAS.forEach((c, i) => {
    const nota = notasTocadas[c];
    const isOpen = pos[c] === 0;
    svg += `<text x="${xs[i]}" y="${H - 4}" text-anchor="middle" font-size="8" font-family="sans-serif" fill="${isOpen ? '#5b7cf6' : '#555'}">${nota}</text>`;
  });

  svg += `</svg>`;
  return svg;
}
