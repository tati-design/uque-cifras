// ─── Mode detection ───────────────────────────────────────────────────────────
function detectarModo(entrada) {
  entrada = entrada.trim();
  if (entrada.endsWith('?')) {
    return { modo: 'identificar', dado: entrada.slice(0,-1).trim().split(',').map(n=>n.trim()) };
  }
  if (!entrada.includes(',')) return { modo: 'unico', dado: entrada };
  const tokens = entrada.split(',').map(t=>t.trim());
  if (tokens.every(t => /^[A-G][#b]?$/.test(t))) return { modo: 'notas', dado: tokens };
  return { modo: 'lista', dado: tokens };
}

// ─── Icon helper ────────────────────────────────────────────────────────────────
function iconeFavorito(ativo) {
  return `<span class="material-symbols-outlined" style="${ativo ? "font-variation-settings:'FILL' 1;" : ''}">kid_star</span>`;
}

// ─── Card state (for grid mode) ───────────────────────────────────────────────
const cardState = {}; // cardId -> { cands, current, identificador, notas }

function switchOption(cardId, dir) {
  const s = cardState[cardId];
  s.current = (s.current + dir + s.cands.length) % s.cands.length;
  updateCard(cardId);
}

function updateCard(cardId) {
  const s = cardState[cardId];
  if (!s || !s.cands.length) return;
  const c = s.cands[s.current];
  const pestana = detectarPestana(c.posicoes);
  const apoio = detectarPestanaApoio(c.posicoes);
  const soltas = CORDAS.filter(co => c.posicoes[co] === 0);
  const tags = [];
  if (pestana) tags.push(`👇 Pestana ${pestana}`);
  else if (apoio) tags.push(`💡 Apoio ${apoio}`);
  if (soltas.length) tags.push(`🫳 ${soltas.map(co=>c.notasTocadas[co]).join(' ')}`);

  const tagsEl = document.getElementById(`card-tags-${cardId}`);
  const diagEl = document.getElementById(`card-diagram-${cardId}`);
  const cntEl  = document.getElementById(`card-counter-${cardId}`);
  const favEl  = document.getElementById(`card-fav-${cardId}`);
  if (tagsEl) tagsEl.textContent = tags.join(' · ') || ' ';
  if (diagEl) diagEl.innerHTML = renderDiagram(c);
  if (cntEl)  cntEl.textContent = `${s.current+1}/${s.cands.length}`;
  if (favEl)  favEl.innerHTML = iconeFavorito(ehFavorito(s.identificador, c.posicoes));
}

function toggleCardFavorito(cardId) {
  const s = cardState[cardId];
  if (!s || !s.cands.length) return;
  const c = s.cands[s.current];
  toggleFavorito(s.identificador, s.notas, c.posicoes);
  run();
}

function renderChordCard(result, cardId) {
  const { cands, notasNorm, nomeAcorde } = result;
  const notasStr = [...notasNorm].join(', ');
  const identificador = nomeAcorde || notasStr;

  const favorito = buscarFavorito(identificador);
  let current = 0;
  if (favorito) {
    const idx = cands.findIndex(c => posicoesIguais(c.posicoes, favorito.posicoes));
    if (idx !== -1) current = idx;
  }
  cardState[cardId] = { cands, current, identificador, notas: [...notasNorm] };

  if (!cands.length) {
    return `<div class="chord-card">
      <div class="card-name">${nomeAcorde || notasStr}</div>
      <div style="font-size:0.75rem;color:#c00;margin-top:8px;">Sem posição válida</div>
    </div>`;
  }

  return `<div class="chord-card">
    <button class="fav-btn" id="card-fav-${cardId}" onclick="toggleCardFavorito('${cardId}')">${iconeFavorito(false)}</button>
    <div class="card-name">${nomeAcorde || notasStr}</div>
    ${nomeAcorde ? `<div class="card-notes">${notasStr}</div>` : ''}
    <div class="card-tags" id="card-tags-${cardId}"></div>
    <div id="card-diagram-${cardId}"></div>
    ${cands.length > 1 ? `<div class="card-nav">
      <button onclick="switchOption('${cardId}',-1)"><span class="material-symbols-outlined">chevron_left</span></button>
      <span class="nav-counter" id="card-counter-${cardId}">1/${cands.length}</span>
      <button onclick="switchOption('${cardId}',1)"><span class="material-symbols-outlined">chevron_right</span></button>
    </div>` : ''}
  </div>`;
}

// ─── UI Rendering (single chord / notes mode) ──────────────────────────────────
const blockState = {}; // blockId -> { identificador, notas, cands }

function toggleBlockFavorito(blockId, idx) {
  const s = blockState[blockId];
  if (!s) return;
  const c = s.cands[idx];
  toggleFavorito(s.identificador, s.notas, c.posicoes);
  run();
}

function renderOptionCard(c, idx, identificador, blockId) {
  const pestana = detectarPestana(c.posicoes);
  const apoio = detectarPestanaApoio(c.posicoes);
  const soltas = CORDAS.filter(co => c.posicoes[co] === 0);
  const tags = [];
  if (pestana) tags.push(`👇 Pestana ${pestana}`);
  else if (apoio) tags.push(`💡 Apoio ${apoio}`);
  if (soltas.length) tags.push(`🫳 Solta${soltas.length>1?'s':''}: ${soltas.map(co=>c.notasTocadas[co]).join(',')}`);

  return `<div class="chord-option">
    <button class="fav-btn" id="block-fav-${blockId}-${idx}" onclick="toggleBlockFavorito('${blockId}',${idx})">${iconeFavorito(ehFavorito(identificador, c.posicoes))}</button>
    <div class="option-label">Opção ${idx+1}</div>
    <div class="option-tags">${tags.join(' · ')}</div>
    ${renderDiagram(c)}
  </div>`;
}

function renderChordBlock(result, blockId = `b${Date.now()}`) {
  const { cands, notasNorm, nomeAcorde } = result;
  const notasStr = [...notasNorm].join(', ');
  const identificador = nomeAcorde || notasStr;
  blockState[blockId] = { identificador, notas: [...notasNorm], cands };

  let html = `<div class="chord-block">`;
  html += `<div class="chord-title">${nomeAcorde || notasStr}</div>`;
  if (nomeAcorde) html += `<div style="font-size:0.75rem;color:#888;margin-bottom:6px;">${notasStr}</div>`;

  const cobertura = cands[0]?.notasDistintas || 0;
  if (cobertura < notasNorm.size) {
    html += `<div class="chord-warning">⚠️ Nenhuma posição cobre as ${notasNorm.size} notas — mostrando opções com ${cobertura} notas.</div>`;
  }

  if (!cands.length) {
    html += `<div class="error-msg">Nenhuma posição encontrada (máx. casa 5, span 4).</div>`;
  } else {
    html += `<div class="options-row">`;
    cands.forEach((c, idx) => { html += renderOptionCard(c, idx, identificador, blockId); });
    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

function run() {
  const query = document.getElementById('query').value.trim();
  const results = document.getElementById('results');
  if (!query) return;

  results.innerHTML = '';
  Object.keys(cardState).forEach(k => delete cardState[k]);
  Object.keys(blockState).forEach(k => delete blockState[k]);

  try {
    const { modo, dado } = detectarModo(query);
    let html = '';

    if (modo === 'identificar') {
      const nomes = identificarAcorde(dado);
      if (!nomes.length) {
        html = `<div class="error-msg">Não reconheci nenhum acorde com as notas: ${dado.join(', ')}</div>`;
      } else {
        html += `<div class="identified">Acorde identificado: <strong>${nomes.join(' / ')}</strong></div>`;
        const r = obterAcordeInfo(nomes[0]);
        html += renderChordBlock({ ...r, cands: r.cands.slice(0, 1) });
      }
    } else if (modo === 'lista') {
      const cards = [];
      dado.forEach((nome, idx) => {
        const nomeLimpo = nome.split('/')[0];
        try {
          const r = obterAcordeInfo(nomeLimpo);
          cards.push(renderChordCard({ ...r, nomeAcorde: nome }, `c${idx}`));
        } catch(e) {
          cards.push(`<div class="error-msg">[${nome}] ${e.message}</div>`);
        }
      });
      html += `<div class="chord-grid">${cards.join('')}</div>`;
    } else if (modo === 'notas') {
      const r = gerarAcorde(dado, 3);
      html += renderChordBlock(r);
    } else {
      const nomeLimpo = dado.split('/')[0];
      const r = obterAcordeInfo(nomeLimpo);
      html += renderChordBlock({ ...r, nomeAcorde: dado });
    }

    results.innerHTML = html;
    // Initialize card diagrams (DOM must exist first)
    Object.keys(cardState).forEach(id => updateCard(id));
    renderFavoritos();
  } catch(e) {
    results.innerHTML = `<div class="error-msg">${e.message}</div>`;
  }
}

function setAndRun(v) {
  document.getElementById('query').value = v;
  run();
  fecharFavoritosModal();
}

// ─── Favoritos modal ────────────────────────────────────────────────────────────
function abrirFavoritosModal() {
  document.getElementById('favoritos-modal').classList.remove('hidden');
  renderFavoritos();
}

function fecharFavoritosModal() {
  document.getElementById('favoritos-modal').classList.add('hidden');
}

function toggleFavoritosPanel() {
  const modal = document.getElementById('favoritos-modal');
  if (!modal) return;
  if (modal.classList.contains('hidden')) abrirFavoritosModal();
  else fecharFavoritosModal();
}

function removerFavoritoEAtualizar(id) {
  removerFavoritoPorId(id);
  renderFavoritos();
  run();
}

// ─── Cards de favorito dentro do modal (com navegação entre voicings) ─────────
const favModalState = {}; // favId -> { cands, current, identificador, notas }

function switchFavOption(favId, dir) {
  const s = favModalState[favId];
  if (!s) return;
  s.current = (s.current + dir + s.cands.length) % s.cands.length;
  updateFavCard(favId);
}

function updateFavCard(favId) {
  const s = favModalState[favId];
  if (!s || !s.cands.length) return;
  const c = s.cands[s.current];
  const diagEl = document.getElementById(`fav-diagram-${favId}`);
  const cntEl  = document.getElementById(`fav-counter-${favId}`);
  const favEl  = document.getElementById(`fav-star-${favId}`);
  if (diagEl) diagEl.innerHTML = renderDiagram(c);
  if (cntEl)  cntEl.textContent = `${s.current+1}/${s.cands.length}`;
  if (favEl)  favEl.innerHTML = iconeFavorito(ehFavorito(s.identificador, c.posicoes));
}

function toggleFavModalFavorito(favId) {
  const s = favModalState[favId];
  if (!s || !s.cands.length) return;
  const c = s.cands[s.current];
  toggleFavorito(s.identificador, s.notas, c.posicoes);
  renderFavoritos();
  run();
}

function obterNotaRaiz(identificador) {
  const m = identificador.match(/^([A-G][b#]?)/);
  if (!m) return '?';
  return ENARMONICOS[m[1]] || m[1];
}

let favFiltroNota = 'todos';

function setFavFiltro(nota) {
  favFiltroNota = nota;
  renderFavoritos();
}

function renderFavoritos() {
  const wrap = document.getElementById('favoritos');
  const modal = document.getElementById('favoritos-modal');
  if (!wrap || !modal || modal.classList.contains('hidden')) return;
  const lista = listarFavoritos();
  Object.keys(favModalState).forEach(k => delete favModalState[k]);

  if (!lista.length) {
    favFiltroNota = 'todos';
    wrap.innerHTML = `<div class="fav-empty">Nenhuma cifra salva ainda.<br>Clique na estrela de um acorde para salvar sua versão preferida.</div>`;
    return;
  }

  lista.forEach(f => { f._raiz = obterNotaRaiz(f.nomeAcorde); });
  const raizesPresentes = [...new Set(lista.map(f => f._raiz))]
    .sort((a, b) => NOTAS.indexOf(a) - NOTAS.indexOf(b));

  if (favFiltroNota !== 'todos' && !raizesPresentes.includes(favFiltroNota)) favFiltroNota = 'todos';

  let html = `<div class="fav-filtros">`;
  html += `<button class="fav-filtro-chip${favFiltroNota === 'todos' ? ' active' : ''}" onclick="setFavFiltro('todos')">Todos</button>`;
  raizesPresentes.forEach(raiz => {
    html += `<button class="fav-filtro-chip${favFiltroNota === raiz ? ' active' : ''}" onclick="setFavFiltro('${raiz}')">${raiz}</button>`;
  });
  html += `</div>`;

  const listaFiltrada = favFiltroNota === 'todos' ? lista : lista.filter(f => f._raiz === favFiltroNota);

  html += `<div class="chord-grid">`;
  listaFiltrada.forEach(f => {
    const favId = f.id;
    const r = gerarAcorde(f.notas, 3, f.nomeAcorde);
    const cands = r.cands;
    let current = cands.findIndex(c => posicoesIguais(c.posicoes, f.posicoes));
    if (current === -1) current = 0;
    favModalState[favId] = { cands, current, identificador: f.nomeAcorde, notas: f.notas };

    html += `<div class="chord-card">
      <button class="fav-btn fav-btn-left" id="fav-star-${favId}" onclick="toggleFavModalFavorito('${favId}')">${iconeFavorito(true)}</button>
      <button class="fav-remove" onclick="event.stopPropagation(); removerFavoritoEAtualizar('${favId}');"><span class="material-symbols-outlined">close</span></button>
      <div class="card-name" style="cursor:pointer" onclick="setAndRun('${f.nomeAcorde.replace(/'/g, "\\'")}')">${f.nomeAcorde}</div>
      <div id="fav-diagram-${favId}"></div>
      ${cands.length > 1 ? `<div class="card-nav">
        <button onclick="switchFavOption('${favId}',-1)"><span class="material-symbols-outlined">chevron_left</span></button>
        <span class="nav-counter" id="fav-counter-${favId}">1/${cands.length}</span>
        <button onclick="switchFavOption('${favId}',1)"><span class="material-symbols-outlined">chevron_right</span></button>
      </div>` : ''}
    </div>`;
  });
  html += `</div>`;
  wrap.innerHTML = html;
  Object.keys(favModalState).forEach(id => updateFavCard(id));
}
