// ─── Acordes fixados (pin) ────────────────────────────────────────────────────
let _pinnedAcordesAtual = [];

// ─── Modo Aprendiz ───────────────────────────────────────────────────────────────
let modoSimplificar = localStorage.getItem('modoSimplificar') === 'true';
let modoNomes       = localStorage.getItem('modoNomes')       === 'true';
let modoEsconderTab = localStorage.getItem('modoEsconderTab') === 'true';

// ─── Tamanho da fonte da cifra ────────────────────────────────────────────────
const CIFRA_FONT_SIZES = [12, 13, 14, 15, 16, 18, 20, 22, 24];
const CIFRA_FONT_DEFAULT = 14;
let cifraFontSize = parseInt(localStorage.getItem('cifraFontSize') || CIFRA_FONT_DEFAULT, 10);
let fonteMenuAberto = false;

function _aplicarFonteCifra() {
  const el = document.getElementById('musica-cifra-scroll');
  if (el) el.style.fontSize = cifraFontSize + 'px';
}

function toggleFonteMenu(e) {
  if (e) e.stopPropagation();
  fonteMenuAberto = !fonteMenuAberto;
  _renderFonteMenu();
}

function fecharFonteMenu() {
  if (!fonteMenuAberto) return;
  fonteMenuAberto = false;
  _renderFonteMenu();
}

function _setFonteSize(val) {
  const n = parseInt(val, 10);
  if (isNaN(n) || n < 8 || n > 72) return;
  cifraFontSize = n;
  localStorage.setItem('cifraFontSize', cifraFontSize);
  _aplicarFonteCifra();
  _syncFonteUI();
}

function _syncFonteUI() {
  const idx = CIFRA_FONT_SIZES.indexOf(cifraFontSize);
  const badgeVal = document.querySelector('.fonte-badge-val');
  if (badgeVal) badgeVal.textContent = cifraFontSize + 'px';
  const menu = document.getElementById('fonte-menu');
  if (menu) {
    menu.classList.toggle('hidden', !fonteMenuAberto);
    menu.querySelector('.fonte-step-btn.minus')?.toggleAttribute('disabled', idx <= 0);
    menu.querySelector('.fonte-step-btn.plus')?.toggleAttribute('disabled', idx >= CIFRA_FONT_SIZES.length - 1);
  }
  // Sincroniza também o input dentro do menu mobile "Mais opções", se estiver aberto nessa etapa
  document.querySelectorAll('.fonte-size-input, .opcoes-fonte-input').forEach(inp => {
    if (document.activeElement !== inp) inp.value = cifraFontSize;
  });
}

function _renderFonteMenu() { _syncFonteUI(); }

function aumentarFonte() {
  const idx = CIFRA_FONT_SIZES.indexOf(cifraFontSize);
  if (idx < CIFRA_FONT_SIZES.length - 1) _setFonteSize(CIFRA_FONT_SIZES[idx + 1]);
}

function diminuirFonte() {
  const idx = CIFRA_FONT_SIZES.indexOf(cifraFontSize);
  if (idx > 0) _setFonteSize(CIFRA_FONT_SIZES[idx - 1]);
}

function renderFonteControl() {
  const idx = CIFRA_FONT_SIZES.indexOf(cifraFontSize);
  return `
    <div class="fonte-wrap">
      <button class="musica-fonte-badge" onclick="toggleFonteMenu(event)">
        <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle">text_fields</span>
        <span class="fonte-badge-val toolbar-btn-label">${cifraFontSize}px</span>
        <span class="material-symbols-outlined tom-badge-caret toolbar-btn-label">expand_more</span>
      </button>
      <div id="fonte-menu" class="tom-menu ${fonteMenuAberto ? '' : 'hidden'}">
        <div class="tom-menu-secao">
          <button class="tom-step-btn fonte-step-btn minus" onclick="diminuirFonte()" ${idx <= 0 ? 'disabled' : ''}>−</button>
          <input type="number" class="fonte-size-input" value="${cifraFontSize}" min="8" max="72"
            oninput="_setFonteSize(this.value)"
            onkeydown="if(event.key==='Enter'||event.key==='Escape'){fecharFonteMenu();event.preventDefault()}"
            onclick="event.stopPropagation()">
          <button class="tom-step-btn fonte-step-btn plus" onclick="aumentarFonte()" ${idx >= CIFRA_FONT_SIZES.length - 1 ? 'disabled' : ''}>+</button>
        </div>
      </div>
    </div>
  `;
}

document.addEventListener('click', e => {
  if (fonteMenuAberto && !e.target.closest('.fonte-wrap')) fecharFonteMenu();
});

// ─── Avaliação (sheet: Instrumento / Vocal / Engajamento) ──────────────────────
let avaliarSheetMusicaId = null;
let avaliarSheetDraft = null;

function _renderAvaliacaoCategoriasBody(draft, onSelecionar, onLimpar) {
  return AVALIACAO_CATEGORIAS.map(cat => {
    const atual = draft[cat.key];
    const nivelAtual = cat.niveis.find(n => n.valor === atual);
    return `
      <div class="avaliar-categoria">
        <div class="avaliar-categoria-header">
          <span class="avaliar-categoria-nome">${cat.nome}</span>
          <button class="avaliar-categoria-limpar" onclick="${onLimpar}('${cat.key}')">Limpar</button>
        </div>
        <div class="avaliar-niveis-grid">
          ${cat.niveis.map(n => `
            <button class="avaliar-nivel-opt${atual === n.valor ? ' active' : ''}" onclick="${onSelecionar}('${cat.key}',${n.valor})">
              <span class="material-symbols-outlined avaliar-nivel-icon">${n.icon}</span>
              <span class="avaliar-nivel-label">${n.label}</span>
            </button>
          `).join('')}
        </div>
        ${nivelAtual ? `<div class="avaliar-nivel-desc"><strong>${nivelAtual.label}:</strong> ${nivelAtual.desc}</div>` : ''}
      </div>
    `;
  }).join('');
}

function _renderAvaliarSheet() {
  const body = document.getElementById('avaliar-sheet-body');
  if (body && avaliarSheetDraft) {
    body.innerHTML = _renderAvaliacaoCategoriasBody(avaliarSheetDraft, 'selecionarAvaliarNivel', 'limparAvaliarCategoria');
  }
}

function abrirAvaliarSheet(id) {
  const musica = buscarMusica(id);
  if (!musica) return;
  avaliarSheetMusicaId = id;
  avaliarSheetDraft = {
    ratingInstrumento: musica.ratingInstrumento ?? null,
    ratingVocal: musica.ratingVocal ?? null,
    ratingEngajamento: musica.ratingEngajamento ?? null,
  };
  _renderAvaliarSheet();
  document.getElementById('avaliar-sheet-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function fecharAvaliarSheet() {
  document.getElementById('avaliar-sheet-overlay').classList.add('hidden');
  document.body.style.overflow = '';
  avaliarSheetMusicaId = null;
  avaliarSheetDraft = null;
}

function selecionarAvaliarNivel(categoriaKey, valor) {
  if (!avaliarSheetDraft) return;
  avaliarSheetDraft[categoriaKey] = avaliarSheetDraft[categoriaKey] === valor ? null : valor;
  _persistirAvaliacao();
  _renderAvaliarSheet();
}

function limparAvaliarCategoria(categoriaKey) {
  if (!avaliarSheetDraft) return;
  avaliarSheetDraft[categoriaKey] = null;
  _persistirAvaliacao();
  _renderAvaliarSheet();
}

function limparAvaliarTudo() {
  if (!avaliarSheetDraft) return;
  AVALIACAO_CATEGORIAS.forEach(cat => { avaliarSheetDraft[cat.key] = null; });
  _persistirAvaliacao();
  _renderAvaliarSheet();
}

function _persistirAvaliacao() {
  if (!avaliarSheetMusicaId || !avaliarSheetDraft) return;
  atualizarMusica(avaliarSheetMusicaId, { ...avaliarSheetDraft });
}

function salvarAvaliacao() {
  _persistirAvaliacao();
  fecharAvaliarSheet();
  renderMusicaView();
}

const modoNovato = () => modoSimplificar && modoNomes; // legado: ambos ativos

function _salvarModos() {
  localStorage.setItem('modoSimplificar', modoSimplificar);
  localStorage.setItem('modoNomes', modoNomes);
  localStorage.setItem('modoEsconderTab', modoEsconderTab);
}

function toggleModoNovato() {
  // Botão principal: se todos ativos → desliga tudo; caso contrário → liga tudo
  const ligar = !(modoSimplificar && modoNomes && modoEsconderTab);
  modoSimplificar = ligar;
  modoNomes = ligar;
  modoEsconderTab = ligar;
  _salvarModos();
  renderMusicaView();
  atualizarMenuModoNovato();
}

function toggleModoSimplificar() {
  modoSimplificar = !modoSimplificar;
  _salvarModos();
  renderMusicaView();
  atualizarMenuModoNovato();
}

function toggleModoNomes() {
  modoNomes = !modoNomes;
  _salvarModos();
  renderMusicaView();
  atualizarMenuModoNovato();
}

function toggleModoEsconderTab() {
  modoEsconderTab = !modoEsconderTab;
  _salvarModos();
  renderMusicaView();
  atualizarMenuModoNovato();
}

let aprendizMenuAberto = false;
function toggleAprendizMenu(e) {
  if (e) e.stopPropagation();
  aprendizMenuAberto = !aprendizMenuAberto;
  document.getElementById('aprendiz-dropdown')?.classList.toggle('hidden', !aprendizMenuAberto);
}
document.addEventListener('click', e => {
  if (aprendizMenuAberto && !e.target.closest('.aprendiz-split-btn')) {
    aprendizMenuAberto = false;
    document.getElementById('aprendiz-dropdown')?.classList.add('hidden');
  }
});

function atualizarMenuModoNovato() {
  const btn = document.getElementById('btn-modo-novato');
  if (!btn) return;
  const ativo = modoSimplificar || modoNomes;
  btn.innerHTML = `<span class="material-symbols-outlined">${ativo ? 'toggle_on' : 'toggle_off'}</span> Modo Aprendiz`;
  btn.style.color = ativo ? '#5b7cf6' : '';
}

// Remove /baixo, /número, (adição) e + para simplificar para modo aprendiz
function simplificarAcorde(nome) {
  if (!modoSimplificar) return nome;
  return nome
    .replace(/\/(?:[A-G][b#]?|\d+)/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\+/g, '');
}

// ─── Lista de músicas (aba "Minhas Músicas") ────────────────────────────────────
let musicaFiltroGenero = 'todos';
let musicaFiltroArtista = 'todos';
let musicaFiltroAvaliacao = { ratingInstrumento: null, ratingVocal: null, ratingEngajamento: null };
let musicaOrdem = 'titulo'; // 'titulo' | 'artista' | 'tom'
let musicaBusca = '';
let musicasSelecionadas = new Set();
let filtroDropdownAberto = null; // 'genero' | 'artista' | null

function toggleFiltroDropdown(tipo, e) {
  if (e) e.stopPropagation();
  filtroDropdownAberto = filtroDropdownAberto === tipo ? null : tipo;
  renderMusicasLista();
}

document.addEventListener('click', e => {
  if (filtroDropdownAberto && !e.target.closest('.filtro-row-outer') && !e.target.closest('.az-sort-btn')) {
    filtroDropdownAberto = null;
    renderMusicasLista();
  }
});
let editandoCategoria = false;
let _idsFiltradosAtual = [];
const MAX_ARTISTAS_VISIVEIS = 20;

function setMusicaOrdem(ordem) {
  musicaOrdem = ordem;
  renderMusicasLista();
}

function setMusicaBusca(v) {
  musicaBusca = v;
  renderMusicasLista();
}

function setMusicaFiltroGenero(g) {
  musicaFiltroGenero = g;
  musicaFiltroArtista = 'todos';
  artistasFiltroExpandido = false;
  musicasSelecionadas.clear();
  editandoCategoria = false;
  filtroDropdownAberto = null;
  renderMusicasLista();
}

function setMusicaFiltroArtista(artista) {
  musicaFiltroArtista = artista;
  musicasSelecionadas.clear();
  editandoCategoria = false;
  filtroDropdownAberto = null;
  renderMusicasLista();
}

function toggleArtistasFiltroExpandido() {
  artistasFiltroExpandido = !artistasFiltroExpandido;
  renderMusicasLista();
}

function toggleSelecaoMusica(id) {
  if (musicasSelecionadas.has(id)) musicasSelecionadas.delete(id);
  else musicasSelecionadas.add(id);
  editandoCategoria = false;
  renderMusicasLista();
}

function toggleSelecionarTodos(ids, marcar) {
  ids.forEach(id => marcar ? musicasSelecionadas.add(id) : musicasSelecionadas.delete(id));
  editandoCategoria = false;
  renderMusicasLista();
}

function limparSelecao() {
  musicasSelecionadas.clear();
  editandoCategoria = false;
  renderMusicasLista();
}

function iniciarEditarCategoria() {
  if (window.innerWidth <= 860) { abrirModalGenero(); return; }
  editandoCategoria = true;
  renderMusicasLista();
}

function cancelarEditarCategoria() {
  editandoCategoria = false;
  renderMusicasLista();
}

function abrirModalGenero() {
  const n = musicasSelecionadas.size;
  document.getElementById('genero-modal-body').innerHTML = `
    <p class="genero-modal-subtitulo">${n} música(s) selecionada(s)</p>
    <div class="genero-modal-lista">
      ${GENEROS.map(g => `<button class="genero-modal-opt" onclick="salvarCategoriaSelecionadas('${g.replace(/'/g,"\\'")}'); fecharModalGenero()">
        <span class="material-symbols-outlined">${GENERO_ICONS[g] || 'music_note'}</span>${g}
      </button>`).join('')}
    </div>
  `;
  document.getElementById('genero-modal').classList.remove('hidden');
}

function fecharModalGenero() {
  document.getElementById('genero-modal').classList.add('hidden');
}

function excluirSelecionadas() {
  const n = musicasSelecionadas.size;
  if (!n) return;
  if (!confirm(`Excluir ${n} música(s) selecionada(s)? Essa ação não pode ser desfeita.`)) return;
  musicasSelecionadas.forEach(id => removerMusica(id));
  musicasSelecionadas.clear();
  editandoCategoria = false;
  renderMusicasLista();
}

function salvarCategoriaSelecionadas(genero) {
  musicasSelecionadas.forEach(id => atualizarMusica(id, { genero }));
  musicasSelecionadas.clear();
  editandoCategoria = false;
  renderMusicasLista();
}

function renderSelecaoBar() {
  const n = musicasSelecionadas.size;
  if (!n) return '';
  const isMobile = window.innerWidth <= 860;
  if (editandoCategoria && !isMobile) {
    return `<div class="selecao-bar">
      <span class="selecao-bar-label">Gênero para ${n} selecionada(s):</span>
      <div class="selecao-bar-generos">
        ${GENEROS.map(g => `<button class="selecao-genero-btn" onclick="salvarCategoriaSelecionadas('${g.replace(/'/g,"\\'")}')"><span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle">${GENERO_ICONS[g] || 'music_note'}</span> ${g}</button>`).join('')}
      </div>
      <button class="selecao-bar-cancel" onclick="cancelarEditarCategoria()"><span class="material-symbols-outlined">close</span></button>
    </div>`;
  }
  return `<div class="selecao-bar">
    <span class="selecao-bar-label">${n} selecionada(s)</span>
    <button class="selecao-bar-action" onclick="iniciarEditarCategoria()"><span class="material-symbols-outlined">label</span> Editar gênero</button>
    <button class="selecao-bar-action selecao-bar-danger" onclick="excluirSelecionadas()"><span class="material-symbols-outlined">delete</span> Apagar</button>
    <button class="selecao-bar-cancel" onclick="limparSelecao()"><span class="material-symbols-outlined">close</span></button>
  </div>`;
}

function _legadoCriarCategoria() {
  // mantido para não quebrar chamadas antigas no DOM já renderizado
  const input = document.getElementById('selecao-novo-genero');
  const nome = input?.value.trim();
  if (!nome) { input?.focus(); return; }
  salvarCategoriaSelecionadas(nome);
}

function toggleAzSort(e) {
  if (window.innerWidth <= 700) { abrirOrdenacaoSheet(); return; }
  if (e) e.stopPropagation();
  filtroDropdownAberto = filtroDropdownAberto === 'ordem' ? null : 'ordem';
  renderMusicasLista();
}

function toggleArtistaFiltro(e) {
  if (window.innerWidth <= 700) { abrirArtistaSheet(); return; }
  toggleFiltroDropdown('artista', e);
}

function _avaliacaoFiltroAtiva() {
  return AVALIACAO_CATEGORIAS.some(cat => musicaFiltroAvaliacao[cat.key] != null);
}

let avaliacaoFiltroDraft = null;

function toggleAvaliacaoFiltro(e) {
  if (e) e.stopPropagation();
  abrirAvaliacaoFiltroSheet();
}

function _renderAvaliacaoFiltroSheet() {
  const body = document.getElementById('avaliacao-filtro-sheet-body');
  if (body && avaliacaoFiltroDraft) {
    body.innerHTML = _renderAvaliacaoCategoriasBody(avaliacaoFiltroDraft, 'selecionarAvaliacaoFiltroNivel', 'limparAvaliacaoFiltroCategoria');
  }
}

function abrirAvaliacaoFiltroSheet() {
  avaliacaoFiltroDraft = { ...musicaFiltroAvaliacao };
  _renderAvaliacaoFiltroSheet();
  document.getElementById('avaliacao-filtro-sheet-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function fecharAvaliacaoFiltroSheet() {
  document.getElementById('avaliacao-filtro-sheet-overlay').classList.add('hidden');
  document.body.style.overflow = '';
  avaliacaoFiltroDraft = null;
}

function selecionarAvaliacaoFiltroNivel(categoriaKey, valor) {
  if (!avaliacaoFiltroDraft) return;
  avaliacaoFiltroDraft[categoriaKey] = avaliacaoFiltroDraft[categoriaKey] === valor ? null : valor;
  _renderAvaliacaoFiltroSheet();
}

function limparAvaliacaoFiltroCategoria(categoriaKey) {
  if (!avaliacaoFiltroDraft) return;
  avaliacaoFiltroDraft[categoriaKey] = null;
  _renderAvaliacaoFiltroSheet();
}

function limparAvaliacaoFiltroTudo() {
  if (!avaliacaoFiltroDraft) return;
  AVALIACAO_CATEGORIAS.forEach(cat => { avaliacaoFiltroDraft[cat.key] = null; });
  _renderAvaliacaoFiltroSheet();
}

function aplicarAvaliacaoFiltro() {
  musicaFiltroAvaliacao = { ...avaliacaoFiltroDraft };
  fecharAvaliacaoFiltroSheet();
  renderMusicasLista();
}

function selecionarOrdemDesktop(val) {
  musicaOrdem = val;
  filtroDropdownAberto = null;
  renderMusicasLista();
}

// ── Bottom sheets mobile ──────────────────────────────────────────────────────

const ORDEM_OPTS = [
  { val: 'titulo',  icon: 'music_note',    label: 'Música'    },
  { val: 'artista', icon: 'person',        label: 'Artista'   },
];

function abrirOrdenacaoSheet() {
  const body = document.getElementById('ordenacao-sheet-body');
  body.innerHTML = ORDEM_OPTS.map(o => `
    <button class="sheet-opt${musicaOrdem === o.val ? ' active' : ''}" onclick="selecionarOrdemSheet('${o.val}')">
      <span class="material-symbols-outlined sheet-opt-icon">${o.icon}</span>
      <span class="sheet-opt-label">${o.label}</span>
      ${musicaOrdem === o.val ? '<span class="material-symbols-outlined sheet-opt-check">check</span>' : ''}
    </button>
  `).join('');
  document.getElementById('ordenacao-sheet-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function fecharOrdenacaoSheet() {
  document.getElementById('ordenacao-sheet-overlay').classList.add('hidden');
  document.body.style.overflow = '';
}

function selecionarOrdemSheet(val) {
  musicaOrdem = val;
  fecharOrdenacaoSheet();
  renderMusicasLista();
}

function abrirArtistaSheet() {
  const lista = listarMusicas();
  const listaPorGenero = musicaFiltroGenero === 'todos' ? lista : lista.filter(m => (m.genero || 'Outros') === musicaFiltroGenero);
  const contPorArtista = {};
  listaPorGenero.forEach(m => { contPorArtista[m.artista] = (contPorArtista[m.artista] || 0) + 1; });
  const artistas = [...new Set(listaPorGenero.map(m => m.artista))].sort((a, b) => (contPorArtista[b] || 0) - (contPorArtista[a] || 0));

  const body = document.getElementById('artista-sheet-body');
  const todosCls = musicaFiltroArtista === 'todos' ? ' active' : '';
  body.innerHTML = `
    <div class="sheet-artista-grid">
      <button class="sheet-artista-opt todos${todosCls}" onclick="selecionarArtistaSheet('todos')">
        Todos <span class="sheet-opt-count">${listaPorGenero.length}</span>
      </button>
      ${artistas.map(a => `
        <button class="sheet-artista-opt${musicaFiltroArtista === a ? ' active' : ''}" onclick="selecionarArtistaSheet('${a.replace(/'/g, "\\'")}')">
          ${a} <span class="sheet-opt-count">${contPorArtista[a]}</span>
        </button>
      `).join('')}
    </div>
  `;
  document.getElementById('artista-sheet-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function fecharArtistaSheet() {
  document.getElementById('artista-sheet-overlay').classList.add('hidden');
  document.body.style.overflow = '';
}

function selecionarArtistaSheet(artista) {
  setMusicaFiltroArtista(artista);
  fecharArtistaSheet();
}

function abrirGeneroSheet() {
  const lista = listarMusicas();
  const contPorGenero = {};
  lista.forEach(m => { const g = m.genero || 'Outros'; contPorGenero[g] = (contPorGenero[g] || 0) + 1; });
  const generosExistentes = [...new Set(lista.map(m => m.genero || 'Outros'))].sort();

  const body = document.getElementById('genero-sheet-body');
  body.innerHTML = `
    <div class="sheet-genero-list">
      <button class="sheet-genero-opt${musicaFiltroGenero === 'todos' ? ' active' : ''}" onclick="selecionarGeneroSheet('todos')">
        <span class="material-symbols-outlined sheet-genero-icon">apps</span>
        <span class="sheet-genero-nome">Todos</span>
        <span class="sheet-opt-count">${lista.length}</span>
      </button>
      ${generosExistentes.map(g => `
        <button class="sheet-genero-opt${musicaFiltroGenero === g ? ' active' : ''}" onclick="selecionarGeneroSheet('${g.replace(/'/g, "\\'")}')">
          <span class="material-symbols-outlined sheet-genero-icon">${GENERO_ICONS[g] || 'music_note'}</span>
          <span class="sheet-genero-nome">${g}</span>
          <span class="sheet-opt-count">${contPorGenero[g] || 0}</span>
        </button>
      `).join('')}
    </div>
  `;
  document.getElementById('genero-sheet-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function fecharGeneroSheet() {
  document.getElementById('genero-sheet-overlay').classList.add('hidden');
  document.body.style.overflow = '';
}

function selecionarGeneroSheet(genero) {
  setMusicaFiltroGenero(genero);
  fecharGeneroSheet();
}

function renderMusicasLista() {
  const wrap = document.getElementById('musicas-lista');
  const buscaTinhaFoco = document.activeElement?.id === 'musica-busca-input';
  const lista = listarMusicas().sort((a, b) =>
    musicaOrdem === 'artista'
      ? a.artista.localeCompare(b.artista) || a.titulo.localeCompare(b.titulo)
      : a.titulo.localeCompare(b.titulo)
  );

  if (!lista.length) {
    musicaFiltroGenero = 'todos';
    musicaFiltroArtista = 'todos';
    wrap.innerHTML = `<div class="fav-empty">Nenhuma música salva ainda.<br>Clique em "Adicionar" para colar a cifra de uma música.</div>`;
    return;
  }

  // Contagem por gênero
  const contPorGenero = {};
  lista.forEach(m => { const g = m.genero || 'Outros'; contPorGenero[g] = (contPorGenero[g] || 0) + 1; });
  const generosExistentes = [...new Set(lista.map(m => m.genero || 'Outros'))].sort((a, b) => (contPorGenero[b] || 0) - (contPorGenero[a] || 0));
  if (musicaFiltroGenero !== 'todos' && !generosExistentes.includes(musicaFiltroGenero)) musicaFiltroGenero = 'todos';

  // ── Gênero: mobile = pill+sheet, desktop = tabs com contador (sem TODOS) ──
  // tabs de gênero: desktop com contador, mobile sem contador mas com TODOS fixo à direita
  const todosTabMobile = `<button class="genero-tab${musicaFiltroGenero === 'todos' ? ' active' : ''}" onclick="setMusicaFiltroGenero('todos')">
    <span class="material-symbols-outlined">apps</span>
    <span class="genero-tab-label">TODOS</span>
  </button>`;
  const generoTabsMobile = todosTabMobile + generosExistentes.map(g =>
    `<button class="genero-tab${musicaFiltroGenero === g ? ' active' : ''}" onclick="setMusicaFiltroGenero('${g.replace(/'/g, "\\'")}')">
      <span class="material-symbols-outlined">${GENERO_ICONS[g] || 'music_note'}</span>
      <span class="genero-tab-label">${g.toUpperCase()}</span>
    </button>`
  ).join('');

  const generoTabsDesktop = generosExistentes.map(g =>
    `<button class="genero-tab${musicaFiltroGenero === g ? ' active' : ''}" onclick="setMusicaFiltroGenero('${g.replace(/'/g, "\\'")}')">
      <span class="material-symbols-outlined">${GENERO_ICONS[g] || 'music_note'}</span>
      <span class="genero-tab-label">${g.toUpperCase()}</span>
      <span class="genero-tab-count">${contPorGenero[g] || 0}</span>
    </button>`
  ).join('');

  let html = `
  <!-- Mobile: tabs sem contador + TODOS fixo na direita -->
  <div class="genero-tabs-row genero-tabs-mobile-wrap">
    <div class="genero-tabs-scroll">${generoTabsMobile}</div>
    <button class="genero-todos-fixo" onclick="abrirGeneroSheet()">VER GÊNEROS</button>
  </div>
  <!-- Desktop: tabs com contador, sem TODOS -->
  <div class="genero-tabs-row genero-tabs-desktop">
    ${generoTabsDesktop}
  </div>`;

  const listaPorGenero = musicaFiltroGenero === 'todos' ? lista : lista.filter(m => (m.genero || 'Outros') === musicaFiltroGenero);

  // Contagem por artista
  const contPorArtista = {};
  listaPorGenero.forEach(m => { contPorArtista[m.artista] = (contPorArtista[m.artista] || 0) + 1; });
  const artistas = [...new Set(listaPorGenero.map(m => m.artista))].sort((a, b) => (contPorArtista[b] || 0) - (contPorArtista[a] || 0));
  if (musicaFiltroArtista !== 'todos' && !artistas.includes(musicaFiltroArtista)) musicaFiltroArtista = 'todos';

  const artistaDropdownHtml =
    `<button class="artista-chip artista-chip-todos${musicaFiltroArtista === 'todos' ? ' active' : ''}" onclick="setMusicaFiltroArtista('todos')">Todos <span class="filtro-count">${listaPorGenero.length}</span></button>` +
    `<div class="artista-dropdown-grid">` +
    artistas.map(a =>
      `<button class="artista-chip${musicaFiltroArtista === a ? ' active' : ''}" onclick="setMusicaFiltroArtista('${a.replace(/'/g, "\\'")}')">${a} <span class="filtro-count">${contPorArtista[a] || 0}</span></button>`
    ).join('') +
    `</div>`;

  const artistaBtnLabel = musicaFiltroArtista !== 'todos' ? musicaFiltroArtista : 'Artistas';

  // ── Linha de controles: busca + artista + AZ ──
  html += `<div class="lista-controles-row">
    <div class="busca-input-wrap">
      <input id="musica-busca-input" class="musica-busca-input-novo" type="text" placeholder="Pesquisar" value="${musicaBusca.replace(/"/g, '&quot;')}" oninput="setMusicaBusca(this.value)">
      ${musicaBusca
        ? `<button class="busca-clear-btn" onclick="setMusicaBusca('')" tabindex="-1"><span class="material-symbols-outlined">cancel</span></button>`
        : `<span class="material-symbols-outlined busca-icon-novo">search</span>`
      }
    </div>
    <div class="filtro-row-outer artista-filtro-wrap">
      <button class="artista-filtro-btn${musicaFiltroArtista !== 'todos' ? ' ativo' : ''}" onclick="toggleArtistaFiltro(event)">
        <span class="material-symbols-outlined filtro-btn-icon">diversity_1</span>
        <span class="filtro-btn-label">${artistaBtnLabel}</span>
        <span class="material-symbols-outlined filtro-btn-caret">expand_more</span>
      </button>
      ${filtroDropdownAberto === 'artista' ? `<div class="filtro-dropdown artista-filtro-dropdown">${artistaDropdownHtml}</div>` : ''}
    </div>
    <div class="filtro-row-outer avaliacao-filtro-wrap">
      <button class="avaliacao-filtro-btn${_avaliacaoFiltroAtiva() ? ' ativo' : ''}" onclick="toggleAvaliacaoFiltro(event)">
        <span class="material-symbols-outlined filtro-btn-icon">reviews</span>
        <span class="filtro-btn-label">Avaliação</span>
      </button>
    </div>
    <div class="filtro-row-outer az-sort-wrap">
      <button class="az-sort-btn${musicaOrdem !== 'titulo' ? ' ativo' : ''}" onclick="toggleAzSort(event)" title="Ordenar">
        <span class="material-symbols-outlined">sort_by_alpha</span>
      </button>
      ${filtroDropdownAberto === 'ordem' ? `<div class="filtro-dropdown ordem-dropdown">
        ${ORDEM_OPTS.map(o => `<button class="ordem-opt${musicaOrdem === o.val ? ' active' : ''}" onclick="selecionarOrdemDesktop('${o.val}')">
          <span class="material-symbols-outlined ordem-opt-icon">${o.icon}</span>
          <span>${o.label}</span>
        </button>`).join('')}
      </div>` : ''}
    </div>
  </div>`;

  html += renderSelecaoBar();

  const listaPorArtista = musicaFiltroArtista === 'todos' ? listaPorGenero : listaPorGenero.filter(m => m.artista === musicaFiltroArtista);
  const listaFiltradaBase = listaPorArtista.filter(m =>
    AVALIACAO_CATEGORIAS.every(cat => musicaFiltroAvaliacao[cat.key] == null || m[cat.key] === musicaFiltroAvaliacao[cat.key])
  );
  const buscaTermo = musicaBusca.trim().toLowerCase();
  const listaFiltrada = buscaTermo
    ? listaFiltradaBase.filter(m =>
        m.titulo.toLowerCase().includes(buscaTermo) ||
        m.artista.toLowerCase().includes(buscaTermo))
    : listaFiltradaBase;
  _idsFiltradosAtual = listaFiltrada.map(m => m.id);
  const todosSelecionados = listaFiltrada.length > 0 && listaFiltrada.every(m => musicasSelecionadas.has(m.id));

  html += `<div class="musicas-tabela-wrap"><table class="musicas-tabela">
    <thead>
      <tr>
        <th class="musica-row-check-th">
          <input type="checkbox" class="musica-check" title="Selecionar todos" ${todosSelecionados ? 'checked' : ''} onclick="toggleSelecionarTodos(_idsFiltradosAtual, this.checked)">
        </th>
        <th>MÚSICA</th><th>ARTISTA</th><th class="col-genero">GÊNERO</th><th class="col-tom">TOM</th><th class="col-avaliacao">AVALIAÇÃO</th>
      </tr>
    </thead>
    <tbody>
      ${listaFiltrada.map(renderMusicaRow).join('')}
    </tbody>
  </table></div>`;

  if (musicasSelecionadas.size > 0) html += `<div class="selecao-bar-spacer"></div>`;
  wrap.innerHTML = html;
  const addBtn = document.querySelector('.musicas-add-bottom');
  if (addBtn) addBtn.style.display = musicasSelecionadas.size > 0 ? 'none' : '';
  if (buscaTinhaFoco) {
    const input = document.getElementById('musica-busca-input');
    if (input) { input.focus(); input.setSelectionRange(musicaBusca.length, musicaBusca.length); }
  }
}

function renderMusicaRow(m) {
  const selecionado = musicasSelecionadas.has(m.id);
  const semitons = m.transposicao || 0;
  const tomAtual = m.tom ? transporAcorde(m.tom, semitons) : '';
  const transposto = semitons !== 0;
  // Mobile: rating as subtitle under title
  const avaliacaoTextoMobile = AVALIACAO_CATEGORIAS
    .map(cat => obterLabelNivel(cat.key, m[cat.key]))
    .filter(Boolean)
    .join(' • ');
  // Desktop: each category in its own chip
  const avaliacaoCelula = AVALIACAO_CATEGORIAS.map(cat => {
    const label = obterLabelNivel(cat.key, m[cat.key]);
    const icone = obterIconeNivel(cat.key, m[cat.key]);
    if (!label) return `<span class="avaliacao-chip avaliacao-chip-vazio" title="${cat.nome}"><span class="material-symbols-outlined avaliacao-chip-icon">${cat.icon}</span></span>`;
    return `<span class="avaliacao-chip" title="${cat.nome}: ${label}"><span class="material-symbols-outlined avaliacao-chip-icon">${icone}</span>${label}</span>`;
  }).join('');
  return `
    <tr class="musica-row${selecionado ? ' musica-row-selecionada' : ''}" onclick="abrirMusicaView('${m.id}')">
      <td class="musica-row-check" onclick="event.stopPropagation(); toggleSelecaoMusica('${m.id}')">
        <input type="checkbox" class="musica-check" ${selecionado ? 'checked' : ''} onclick="event.stopPropagation(); toggleSelecaoMusica('${m.id}')">
      </td>
      <td class="musica-row-titulo">
        ${m.titulo}${avaliacaoTextoMobile ? `<span class="musica-row-avaliacao musica-row-avaliacao-mobile">${avaliacaoTextoMobile}</span>` : ''}
      </td>
      <td class="musica-row-artista">${m.artista}</td>
      <td class="musica-row-genero col-genero">${m.genero || 'Outros'}</td>
      <td class="musica-row-tom col-tom">
        ${m.tom ? `<span class="tom-cell" title="${transposto ? 'Tom alterado' : 'Tom original'}">
          <span class="material-symbols-outlined tom-cell-icon">${transposto ? 'sync_alt' : 'music_note'}</span>${tomAtual}
        </span>` : ''}
      </td>
      <td class="col-avaliacao musica-row-avaliacao-desk">${avaliacaoCelula}</td>
    </tr>
  `;
}

let musicaRowMenuAberto = null;

function toggleMusicaRowMenu(e, id) {
  e.stopPropagation();
  const abrir = musicaRowMenuAberto !== id;
  fecharMusicaRowMenu();
  if (abrir) {
    musicaRowMenuAberto = id;
    document.getElementById(`musica-row-menu-${id}`)?.classList.remove('hidden');
  }
}

function fecharMusicaRowMenu() {
  if (musicaRowMenuAberto) {
    document.getElementById(`musica-row-menu-${musicaRowMenuAberto}`)?.classList.add('hidden');
  }
  musicaRowMenuAberto = null;
}

document.addEventListener('click', e => {
  if (musicaRowMenuAberto && !e.target.closest('.menu-wrap')) fecharMusicaRowMenu();
});

function editarMusicaDaLista(id) {
  fecharMusicaRowMenu();
  abrirMusicaView(id);
  abrirEdicaoMusica();
}

function excluirMusicaDaLista(id) {
  fecharMusicaRowMenu();
  const m = buscarMusica(id);
  if (!m) return;
  if (!confirm(`Excluir "${m.titulo}"?`)) return;
  removerMusica(id);
  renderMusicasLista();
}

// ─── Modal: adicionar música ────────────────────────────────────────────────────
function abrirAdicionarMusicaModal() {
  document.getElementById('musica-add-texto').value = '';
  document.getElementById('musica-add-modal').classList.remove('hidden');
}

function fecharAdicionarMusicaModal() {
  document.getElementById('musica-add-modal').classList.add('hidden');
}

function salvarNovaMusica() {
  const texto = document.getElementById('musica-add-texto').value.trim();
  if (!texto) return;

  const segmentos = dividirMusicasTexto(texto);
  const salvas = [];
  segmentos.forEach(seg => {
    const dados = parseMusicaTexto(seg);
    if (dados.titulo) salvas.push(salvarMusica(dados));
  });

  if (!salvas.length) {
    alert('Não consegui identificar nenhuma música nesse texto. Confira o formato colado.');
    return;
  }

  fecharAdicionarMusicaModal();
  renderMusicasLista();
  if (salvas.length === 1) {
    abrirMusicaView(salvas[0].id);
  } else {
    alert(`${salvas.length} músicas salvas com sucesso!`);
  }
}

// ─── VIEW: Música ──────────────────────────────────────────────────────────────
// Gerenciamento de views: a tela de música SUBSTITUI a lista (não é overlay).
// Isso elimina o problema de scroll do body "vazando" por baixo de uma overlay.

let musicaAtualId = null;
let _musicaViewEmpurrouHistorico = false;
let acordesMobileAbertos = false;

function abrirMusicaView(id, semHistorico) {
  musicaAtualId = id;
  tomMenuAberto = false;
  acordesMobileAbertos = false;

  document.getElementById('view-lista').classList.add('hidden');
  document.getElementById('view-musica').classList.remove('hidden');

  if (!semHistorico) {
    history.pushState({ musicaId: id }, '', '#m/' + id);
    _musicaViewEmpurrouHistorico = true;
  }

  renderMusicaView();
}

function fecharMusicaView() {
  pararLoopAutoScroll();
  autoScrollState = { ativo: false, rodando: false, velocidade: autoScrollState.velocidade, rafId: null, ultimoTs: null, acumulado: 0 };
  acordesMobileAbertos = false;
  modoFullscreen = false;
  opcoesMenuAberto = false;
  opcoesMenuView = 'menu';
  fonteMenuAberto = false;
  avaliarMenuAberto = false;

  document.getElementById('view-musica').classList.add('hidden');
  document.getElementById('view-lista').classList.remove('hidden');

  if (_musicaViewEmpurrouHistorico) {
    _musicaViewEmpurrouHistorico = false;
    history.back();
  } else {
    history.replaceState({}, '', location.pathname);
  }

  musicaAtualId = null;
  renderMusicasLista();
}

window.addEventListener('popstate', (e) => {
  const hash = location.hash;
  const match = hash.match(/^#m\/(.+)$/);
  if (match && buscarMusica(match[1])) {
    _musicaViewEmpurrouHistorico = false;
    abrirMusicaView(match[1], true);
    return;
  }
  // Sem hash = fechando a música
  if (musicaAtualId) {
    _musicaViewEmpurrouHistorico = false;
    pararLoopAutoScroll();
    autoScrollState = { ativo: false, rodando: false, velocidade: autoScrollState.velocidade, rafId: null, ultimoTs: null, acumulado: 0 };
    acordesMobileAbertos = false;
    document.getElementById('view-musica').classList.add('hidden');
    document.getElementById('view-lista').classList.remove('hidden');
    musicaAtualId = null;
    renderMusicasLista();
  }
});

window.addEventListener('DOMContentLoaded', () => {
  const match = location.hash.match(/^#m\/(.+)$/);
  if (match && buscarMusica(match[1])) {
    abrirMusicaView(match[1], true);
  }
});

function navegarMusica(direcao) {
  const ids = _idsFiltradosAtual.length > 0 ? _idsFiltradosAtual : listarMusicas().sort((a, b) => a.titulo.localeCompare(b.titulo)).map(m => m.id);
  if (ids.length < 2) return;
  const idx = ids.indexOf(musicaAtualId);
  if (idx === -1) return;
  const novoIdx = (idx + direcao + ids.length) % ids.length;
  musicaAtualId = ids[novoIdx];
  tomMenuAberto = false;
  // acordesMobileAbertos preservado intencionalmente: persiste ao navegar entre músicas
  pararLoopAutoScroll();
  autoScrollState = { ativo: false, rodando: false, velocidade: autoScrollState.velocidade, rafId: null, ultimoTs: null, acumulado: 0 };
  history.replaceState({ musicaId: musicaAtualId }, '', '#m/' + musicaAtualId);
  renderMusicaView();
}

// ─── Renderização da view de música (única função, CSS lida com mobile/desktop) ─

function renderMusicaView() {
  const musica = buscarMusica(musicaAtualId);
  if (!musica) return;

  const semitons = musica.transposicao || 0;
  const tomAtual = musica.tom ? transporAcorde(musica.tom, semitons) : '';
  const pinned = musica.pinnedAcordes || [];
  _pinnedAcordesAtual = pinned;
  const acordesAtuaisRaw = [...new Set(extrairAcordes(musica.cifraTexto).map(a => simplificarAcorde(transporAcorde(a, semitons))))];
  acordesAtuaisRaw.sort((a, b) => {
    const ai = pinned.indexOf(a), bi = pinned.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return 0;
  });
  const acordesAtuais = acordesAtuaisRaw;
  const s = autoScrollState;

  // Header: voltar | [‹] título [›] | editar/excluir/menu
  document.getElementById('musica-page-header').innerHTML = `
    <button class="nav-btn" onclick="fecharMusicaView()">
      <span class="material-symbols-outlined">arrow_back</span>
    </button>
    <div class="musica-view-nav">
      <button class="icon-btn musica-nav-chevron" onclick="navegarMusica(-1)" title="Música anterior">
        <span class="material-symbols-outlined">chevron_left</span>
      </button>
      <div class="musica-view-titulo-wrap">
        <h1 class="musica-titulo">${musica.titulo}</h1>
        <div class="musica-artista">${musica.artista}</div>
      </div>
      <button class="icon-btn musica-nav-chevron" onclick="navegarMusica(1)" title="Próxima música">
        <span class="material-symbols-outlined">chevron_right</span>
      </button>
    </div>
    <div class="musica-page-header-actions">
      <div class="menu-wrap">
        <button class="icon-btn" onclick="toggleMusicaMenuMobile(event)">
          <span class="material-symbols-outlined">more_vert</span>
        </button>
        <div id="musica-mobile-menu" class="dropdown-menu hidden">
          <button onclick="abrirEdicaoMusica()"><span class="material-symbols-outlined">edit</span> Editar</button>
          <button onclick="abrirCorrecaoAcordes()"><span class="material-symbols-outlined">tune</span> Corrigir acordes</button>
          <button class="dropdown-menu-btn-danger" onclick="removerMusicaAtualEVoltar()"><span class="material-symbols-outlined">delete</span> Excluir</button>
        </div>
      </div>
    </div>
  `;

  // Body: toolbar + conteúdo + barra de autorrolagem (se ativa) + painel de acordes mobile (se aberto)
  document.getElementById('musica-page-body').innerHTML = `
    <div class="musica-toolbar">
      <div class="musica-toolbar-left">
        ${musica.tom ? renderTomControl(tomAtual, musica.tom, semitons) : ''}
      </div>
      <div class="musica-toolbar-right">
        <button class="icon-btn fullscreen-btn${modoFullscreen ? ' active' : ''}" onclick="toggleFullscreenMusica()" title="Tela cheia">
          <span class="material-symbols-outlined">${modoFullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>
        </button>
        <button class="nav-btn musica-acordes-toggle${acordesMobileAbertos ? ' active' : ''}" onclick="toggleAcordesMobile()">
          <span class="material-symbols-outlined">library_music</span><span class="toolbar-btn-label"> Acordes</span>
        </button>
        <div class="aprendiz-split-btn${(modoSimplificar || modoNomes || modoEsconderTab) ? ' active' : ''}">
          <button class="aprendiz-main" onclick="toggleModoNovato()" title="Modo Aprendiz">
            <span class="material-symbols-outlined">school</span>
          </button>
          <button class="aprendiz-arrow" onclick="toggleAprendizMenu(event)" title="Opções do modo aprendiz">
            <span class="material-symbols-outlined">expand_more</span>
          </button>
          <div id="aprendiz-dropdown" class="aprendiz-dropdown ${aprendizMenuAberto ? '' : 'hidden'}">
            <button class="aprendiz-opt" onclick="toggleModoSimplificar()">
              <span class="material-symbols-outlined">${modoSimplificar ? 'check_box' : 'check_box_outline_blank'}</span>
              Simplificar acordes
            </button>
            <button class="aprendiz-opt" onclick="toggleModoNomes()">
              <span class="material-symbols-outlined">${modoNomes ? 'check_box' : 'check_box_outline_blank'}</span>
              Mostrar nomes
            </button>
            <button class="aprendiz-opt" onclick="toggleModoEsconderTab()">
              <span class="material-symbols-outlined">${modoEsconderTab ? 'check_box' : 'check_box_outline_blank'}</span>
              Esconder tablatura
            </button>
          </div>
        </div>
        <div class="autoscroll-wrap">
          <button class="nav-btn autoscroll-start-btn${s.ativo ? ' active' : ''}" onclick="${s.ativo ? 'alternarAutoScrollPlay()' : 'iniciarAutoScroll()'}" title="Autorrolagem">
            <span class="material-symbols-outlined">${s.ativo ? (s.rodando ? 'pause' : 'play_arrow') : 'arrow_cool_down'}</span><span class="autoscroll-start-label"> Autorrolagem</span>
          </button>
          ${s.ativo ? `<div class="autoscroll-controls">
            <button class="icon-btn" onclick="reiniciarAutoScroll()" title="Reiniciar"><span class="material-symbols-outlined">replay</span></button>
            <span class="material-symbols-outlined autoscroll-speed-icon">speed</span>
            <input type="range" class="autoscroll-speed" min="1" max="20" value="${s.velocidade}" oninput="ajustarVelocidadeAutoScroll(this.value)">
            <button class="icon-btn" onclick="fecharAutoScroll()" title="Fechar"><span class="material-symbols-outlined">close</span></button>
          </div>` : ''}
        </div>
        <!-- Desktop: botões com popup próprio (mesmo padrão do Tom) -->
        <div class="toolbar-desktop-extras">
          ${renderFonteControl()}
          <button class="musica-fonte-badge" onclick="abrirAvaliarSheet('${musica.id}')">
            <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle">reviews</span>
            <span class="toolbar-btn-label">Avaliar</span>
          </button>
        </div>
        <!-- Mobile: botão apps com menu de duas etapas (lista → edição) -->
        <div class="opcoes-wrap opcoes-wrap-mobile">
          <button class="icon-btn" onclick="toggleOpcoesMenu(event)" title="Opções">
            <span class="material-symbols-outlined">apps</span>
          </button>
          <div id="opcoes-menu" class="opcoes-menu ${opcoesMenuAberto ? '' : 'hidden'}">
            ${_renderOpcoesMenuConteudo()}
          </div>
        </div>
      </div>
    </div>
    ${s.ativo ? `<div class="autoscroll-bar-top">
      <button class="icon-btn" onclick="alternarAutoScrollPlay()"><span class="material-symbols-outlined">${s.rodando ? 'pause' : 'play_arrow'}</span></button>
      <button class="icon-btn" onclick="reiniciarAutoScroll()"><span class="material-symbols-outlined">replay</span></button>
      <span class="material-symbols-outlined autoscroll-speed-icon">speed</span>
      <input type="range" class="autoscroll-speed" min="1" max="20" value="${s.velocidade}" oninput="ajustarVelocidadeAutoScroll(this.value)">
      <button class="icon-btn" onclick="fecharAutoScroll()"><span class="material-symbols-outlined">close</span></button>
    </div>` : ''}
    ${acordesMobileAbertos ? `<div class="musica-acordes-mobile">
      <div class="musica-acordes-mobile-scroll">
        ${acordesAtuais.length ? acordesAtuais.map(renderChordChipMobile).join('') : '<span class="musica-acordes-mobile-vazio">Nenhum acorde identificado</span>'}
      </div>
      <button class="musica-acordes-mobile-close" onclick="toggleAcordesMobile()"><span class="material-symbols-outlined">close</span></button>
    </div>` : ''}
    <div class="musica-conteudo">
      <pre class="musica-cifra" id="musica-cifra-scroll">${renderCifraHtml(musica.cifraTexto, semitons)}</pre>
      <div class="musica-acordes">
        <div class="resize-handle" onmousedown="iniciarResizeAcordes(event)"></div>
        <div class="musica-acordes-titulo">Acordes</div>
        <div class="musica-acordes-grid">
          ${acordesAtuais.length ? acordesAtuais.map(renderChordChip).join('') : '<div class="fav-empty">Nenhum acorde identificado.</div>'}
        </div>
      </div>
    </div>
  `;

  const cifraEl = document.getElementById('musica-cifra-scroll');
  if (cifraEl) {
    iniciarSwipeCifra(cifraEl);
    _aplicarFonteCifra();
  }
}

function renderChordChip(nomeAcorde) {
  let diagramaHtml = '';
  let ehFavoritado = false;
  try {
    const r = obterAcordeInfo(nomeAcorde);
    let candidato = r.cands[0];
    const favorito = buscarFavorito(nomeAcorde);
    if (favorito) {
      const idx = r.cands.findIndex(c => posicoesIguais(c.posicoes, favorito.posicoes));
      if (idx !== -1) { candidato = r.cands[idx]; ehFavoritado = true; }
    }
    if (candidato) diagramaHtml = renderDiagram(candidato);
  } catch {
    diagramaHtml = `<div class="chord-chip-erro">?</div>`;
  }
  const descChip = modoNomes ? `<div class="chord-chip-desc">${escapeHtml(descreverAcorde(nomeAcorde))}</div>` : '';
  const isPinned = _pinnedAcordesAtual.includes(nomeAcorde);
  return `<div class="chord-chip${isPinned ? ' chord-chip-pinned' : ''}" onclick="abrirNotaSheetPorNome('${nomeAcorde.replace(/'/g, "\\'")}')">
    <span class="material-symbols-outlined chord-chip-fav-badge" style="${ehFavoritado ? "font-variation-settings:'FILL' 1;" : ''}">kid_star</span>
    ${isPinned ? '<span class="material-symbols-outlined chord-chip-pin-badge">push_pin</span>' : ''}
    <div class="chord-chip-nome">${nomeAcorde}</div>
    ${descChip}
    ${diagramaHtml}
  </div>`;
}

function renderChordChipMobile(nomeAcorde) {
  let diagramaHtml = '';
  try {
    const r = obterAcordeInfo(nomeAcorde);
    let candidato = r.cands[0];
    const favorito = buscarFavorito(nomeAcorde);
    if (favorito) {
      const idx = r.cands.findIndex(c => posicoesIguais(c.posicoes, favorito.posicoes));
      if (idx !== -1) candidato = r.cands[idx];
    }
    if (candidato) diagramaHtml = renderDiagram(candidato, { showNoteLabels: false, padB: 10 });
  } catch { diagramaHtml = `<div class="chord-chip-erro">?</div>`; }
  const descMobile = modoNomes ? `<div class="chord-chip-desc">${escapeHtml(descreverAcorde(nomeAcorde))}</div>` : '';
  const isPinnedMobile = _pinnedAcordesAtual.includes(nomeAcorde);
  return `<div class="chord-chip-mobile${isPinnedMobile ? ' chord-chip-mobile-pinned' : ''}" onclick="abrirNotaSheetPorNome('${nomeAcorde.replace(/'/g,"\\'")}')">
    ${isPinnedMobile ? '<span class="material-symbols-outlined chord-chip-pin-badge-mobile">push_pin</span>' : ''}
    <div class="chord-chip-nome">${nomeAcorde}</div>
    ${descMobile}
    ${diagramaHtml}
  </div>`;
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function renderCifraHtml(cifraTexto, semitons = 0) {
  const linhas = modoEsconderTab
    ? cifraTexto.split('\n').filter(l => !/^\s*[EBGDAe]\|/.test(l))
    : cifraTexto.split('\n');
  const _occCount = {}; // original → count so far
  return linhas.map(linhaRaw => {

    // Prefixo [seção] → negrito
    const bracketMatch = linhaRaw.match(/^(\s*\[[^\]]*\]\s*)/);
    const prefixo = bracketMatch ? bracketMatch[1] : '';
    const prefixoHtml = prefixo
      ? prefixo.replace(/\[([^\]]*)\]/g, (_, t) => `<strong class="cifra-secao">[${escapeHtml(t)}]</strong>`)
      : '';

    const resto = linhaRaw.slice(prefixo.length);
    // Destaca qualquer token que seja acorde válido, mesmo em linha mista com letra
    // (ex: palavra promovida a acorde na correção, que fica na mesma linha da letra)
    const partes = resto.split(/(\s+)/);
    const restoHtml = partes.map(p => {
      if (p === '' || /^\s+$/.test(p)) return p;
      if (isSectionToken(p)) return escapeHtml(p);
      if (!isValidChordToken(p)) return escapeHtml(p);
      const transposto = simplificarAcorde(transporAcorde(p, semitons));
      _occCount[p] = (_occCount[p] || 0) + 1;
      return `<span class="chord-token" data-acorde="${escapeHtml(transposto).replace(/"/g, '&quot;')}" data-acorde-original="${escapeHtml(p).replace(/"/g, '&quot;')}" data-acorde-occ="${_occCount[p] - 1}">${escapeHtml(transposto)}</span>`;
    }).join('');
    return prefixoHtml + restoHtml;
  }).join('\n');
}

// ─── Editor de Correção de Acordes ────────────────────────────────────────────
let _correcaoLinhas = [];   // [{type:'chord'|'text', tokens:[...], raw}]
let _correcaoSel = null;    // {lIdx, tIdx}
let _correcaoSelTexto = ''; // texto original do token ao abrir o sheet (para "aplicar em todos")

function _looksLikeChordAttempt(t) {
  return /^[A-G][#b]?/.test(t) && t.length <= 14;
}

function _tokenizarLinhaCorrecao(linhaRaw) {
  // Linhas de tablatura: mostrar mas não editar
  if (/^\s*[EBGDAe]\|/.test(linhaRaw)) return { type: 'tab', tokens: [{ text: linhaRaw, kind: 'tab' }], raw: linhaRaw };
  // Linha vazia
  if (!linhaRaw.trim()) return { type: 'empty', tokens: [], raw: linhaRaw };

  const bracketMatch = linhaRaw.match(/^(\s*\[[^\]]*\]\s*)/);
  const prefixo = bracketMatch ? bracketMatch[1] : '';
  const resto = linhaRaw.slice(prefixo.length);

  const rawTokens = resto.trim().split(/\s+/).filter(Boolean);
  const chordTokens = rawTokens.filter(t => !isSectionToken(t));
  const isChordLine = chordTokens.length > 0 && chordTokens.every(t => isValidChordToken(t));
  const isCandidate = chordTokens.length > 0 && chordTokens.every(t => _looksLikeChordAttempt(t));
  const lineKind = (isChordLine || isCandidate) ? 'chord' : 'lyric';

  const tokens = [];
  if (prefixo) tokens.push({ text: prefixo, kind: 'prefix' });
  resto.split(/(\s+)/).forEach(s => {
    if (/^\s+$/.test(s) || s === '') { if (s) tokens.push({ text: s, kind: 'space' }); return; }
    if (lineKind === 'chord' && isSectionToken(s)) { tokens.push({ text: s, kind: 'section' }); return; }
    if (lineKind === 'chord') {
      tokens.push({ text: s, kind: isValidChordToken(s) ? 'ok' : 'bad' });
    } else {
      // palavra de letra: sempre 'word' (cinza), mesmo que seja acorde válido
      // o usuário promove explicitamente ao substituir no painel
      tokens.push({ text: s, kind: 'word' });
    }
  });
  return { type: lineKind, tokens, raw: linhaRaw };
}

function abrirCorrecaoAcordes() {
  document.getElementById('musica-mobile-menu')?.classList.add('hidden');
  const musica = buscarMusica(musicaAtualId);
  if (!musica) return;
  _correcaoLinhas = musica.cifraTexto.split('\n').map(_tokenizarLinhaCorrecao);
  _correcaoSel = null;
  _renderCorrecao();
}

function _renderCorrecao() {
  const musica = buscarMusica(musicaAtualId);
  const badCount = _correcaoLinhas.reduce((n, l) =>
    n + (l.tokens ? l.tokens.filter(t => t.kind === 'bad').length : 0), 0);
  const scrollTop = document.querySelector('.correcao-cifra')?.scrollTop || 0;

  document.getElementById('musica-page-header').innerHTML = `
    <button class="nav-btn" onclick="cancelarCorrecao()">
      <span class="material-symbols-outlined">close</span>
    </button>
    <div class="musica-view-titulo-wrap" style="flex:1;padding:0 12px">
      <h1 class="musica-titulo" style="font-size:1rem">Corrigir acordes</h1>
      <div class="musica-artista">${musica.titulo}</div>
    </div>
    <div style="display:flex;gap:8px;align-items:center">
      ${badCount ? `<button class="correcao-fix-all-btn" onclick="abrirCorrecaoTodos()">Corrigir todos</button>` : ''}
      <button class="nav-btn" style="font-weight:600;color:var(--accent)" onclick="salvarCorrecao()">Salvar</button>
    </div>
  `;

  document.getElementById('musica-page-body').innerHTML = `
    <div class="correcao-legenda-bar">
      <span class="correcao-badge ok">Am</span> reconhecido
      <span class="correcao-badge bad" style="margin-left:10px">G#º</span> não reconhecido
      <span class="correcao-badge word" style="margin-left:10px">texto</span> letra (clique para promover a acorde)
      ${badCount ? `<span class="correcao-count">${badCount} não reconhecido${badCount>1?'s':''}</span>` : `<span class="correcao-count ok">Tudo ok!</span>`}
    </div>
    ${_correcaoTodosAberto ? _renderCorrecaoTodosPanel() : ''}
    <div class="correcao-cifra">
      ${_correcaoLinhas.map((l, lIdx) => _renderCorrecaoLinha(l, lIdx)).join('')}
    </div>
  `;

  const cifraEl = document.querySelector('.correcao-cifra');
  if (cifraEl) cifraEl.scrollTop = scrollTop;
}

function _renderCorrecaoLinha(linha, lIdx) {
  if (linha.type === 'empty') return `<div class="correcao-linha"> </div>`;
  if (linha.type === 'tab')   return `<div class="correcao-linha tab">${escapeHtml(linha.tokens[0]?.text || '')}</div>`;

  const tokensHtml = linha.tokens.map((t, tIdx) => {
    if (t.kind === 'space')   return t.text.replace(/ /g, ' ');
    if (t.kind === 'prefix')  return `<span class="correcao-prefix">${escapeHtml(t.text)}</span>`;
    if (t.kind === 'section') return `<span class="correcao-token section">${escapeHtml(t.text)}</span>`;
    const sel = _correcaoSel?.lIdx === lIdx && _correcaoSel?.tIdx === tIdx;
    return `<button class="correcao-token ${t.kind}${sel?' sel':''}" onclick="selecionarCorrecaoToken(${lIdx},${tIdx})">${escapeHtml(t.text)}</button>`;
  }).join('');

  return `<div class="correcao-linha">${tokensHtml}</div>`;
}

function selecionarCorrecaoToken(lIdx, tIdx) {
  if (_correcaoSel?.lIdx === lIdx && _correcaoSel?.tIdx === tIdx) {
    fecharCorrecaoPainel();
    return;
  }
  _abrirCorrecaoSheet(lIdx, tIdx);
  _renderCorrecao();
}

function _abrirCorrecaoSheet(lIdx, tIdx) {
  _correcaoSel = { lIdx, tIdx };
  const token = _correcaoLinhas[lIdx].tokens[tIdx];
  _correcaoSelTexto = token.text;
  const isChordToken = token.kind === 'ok' || token.kind === 'bad';

  const input = document.getElementById('correcao-sheet-input');
  input.value = token.text;

  const confirmarBtn = document.getElementById('correcao-sheet-confirmar');
  confirmarBtn.textContent = token.kind === 'ok' ? 'Substituir acorde' : 'Adicionar acorde';
  confirmarBtn.disabled = !isValidChordToken(token.text);

  document.getElementById('correcao-sheet-todos-cb').checked = true;
  document.getElementById('correcao-sheet-todos-label').textContent = `Buscar e aplicar em todos "${token.text}" da música`;
  document.getElementById('correcao-sheet-nao-acorde-btn').style.display = isChordToken ? '' : 'none';

  document.getElementById('correcao-sheet-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  setTimeout(() => { input.focus(); input.select(); }, 200);
}

function _validarCorrecaoSheetInput(inp) {
  const btn = document.getElementById('correcao-sheet-confirmar');
  if (btn) btn.disabled = !isValidChordToken(inp.value.trim());
}

function substituirCorrecaoToken() {
  if (!_correcaoSel) return;
  const val = document.getElementById('correcao-sheet-input')?.value.trim();
  if (!val || !isValidChordToken(val)) return;
  const { lIdx, tIdx } = _correcaoSel;
  const aplicarTodos = document.getElementById('correcao-sheet-todos-cb')?.checked;
  if (aplicarTodos) {
    const textoOriginal = _correcaoSelTexto;
    _correcaoLinhas.forEach(l => {
      if (!l.tokens) return;
      l.tokens.forEach(t => {
        if (t.text === textoOriginal && (t.kind === 'ok' || t.kind === 'bad' || t.kind === 'word')) {
          t.text = val; t.kind = 'ok';
        }
      });
    });
  } else {
    _correcaoLinhas[lIdx].tokens[tIdx] = { text: val, kind: 'ok' };
  }
  fecharCorrecaoPainel();
}

function excluirCorrecaoToken(lIdx, tIdx) {
  const tokens = _correcaoLinhas[lIdx].tokens;
  const prevIsSpace = tIdx > 0 && tokens[tIdx - 1].kind === 'space';
  tokens.splice(prevIsSpace ? tIdx - 1 : tIdx, prevIsSpace ? 2 : 1);
  fecharCorrecaoPainel();
}

function naoEAcordeToken() {
  if (!_correcaoSel) return;
  const { lIdx, tIdx } = _correcaoSel;
  const aplicarTodos = document.getElementById('correcao-sheet-todos-cb')?.checked;
  if (aplicarTodos) {
    const textoOriginal = _correcaoSelTexto;
    _correcaoLinhas.forEach(l => {
      if (!l.tokens) return;
      l.tokens.forEach(t => {
        if ((t.kind === 'ok' || t.kind === 'bad') && t.text === textoOriginal) t.kind = 'word';
      });
    });
  } else {
    _correcaoLinhas[lIdx].tokens[tIdx].kind = 'word';
  }
  fecharCorrecaoPainel();
}

function fecharCorrecaoPainel() {
  _correcaoSel = null;
  document.getElementById('correcao-sheet-overlay')?.classList.add('hidden');
  document.body.style.overflow = '';
  _renderCorrecao();
}

function salvarCorrecao() {
  const novaCifra = _correcaoLinhas.map(l =>
    l.tokens ? l.tokens.map(t => t.text).join('') : (l.raw ?? '')
  ).join('\n');
  const novosAcordes = extrairAcordes(novaCifra);
  atualizarMusica(musicaAtualId, { cifraTexto: novaCifra, acordes: novosAcordes });
  _correcaoLinhas = [];
  renderMusicaView();
}

// ─── Corrigir todos ───────────────────────────────────────────────────────────
let _correcaoTodosAberto = false;

function abrirCorrecaoTodos() {
  _correcaoTodosAberto = true;
  _renderCorrecao();
  setTimeout(() => document.querySelector('.correcao-todos-input')?.focus(), 40);
}

function fecharCorrecaoTodos() {
  _correcaoTodosAberto = false;
  _renderCorrecao();
}

function _getBadTokensUnicos() {
  const map = new Map(); // texto → [{ lIdx, tIdx }]
  _correcaoLinhas.forEach((l, lIdx) => {
    if (!l.tokens) return;
    l.tokens.forEach((t, tIdx) => {
      if (t.kind !== 'bad') return;
      if (!map.has(t.text)) map.set(t.text, []);
      map.get(t.text).push({ lIdx, tIdx });
    });
  });
  return map;
}

function aplicarCorrecaoTodos() {
  const badMap = _getBadTokensUnicos();
  let aplicados = 0;
  badMap.forEach((ocorrencias, textoOriginal) => {
    const inp = document.getElementById(`correcao-todos-inp-${CSS.escape(textoOriginal)}`);
    const val = inp?.value.trim();
    if (!val || !isValidChordToken(val)) return;
    ocorrencias.forEach(({ lIdx, tIdx }) => {
      _correcaoLinhas[lIdx].tokens[tIdx] = { text: val, kind: 'ok' };
    });
    aplicados++;
  });
  _correcaoTodosAberto = false;
  _renderCorrecao();
}

function _renderCorrecaoTodosPanel() {
  const badMap = _getBadTokensUnicos();
  if (!badMap.size) return `<div class="correcao-todos-panel"><p style="color:#27ae60;font-weight:600">Nenhum token não reconhecido.</p></div>`;
  const rows = [...badMap.entries()].map(([text, occs]) => `
    <div class="correcao-todos-row">
      <span class="correcao-badge bad" style="min-width:80px;text-align:center">${escapeHtml(text)}</span>
      <span class="correcao-todos-count">${occs.length}×</span>
      <input class="correcao-input correcao-todos-input" id="correcao-todos-inp-${escapeHtml(CSS.escape(text))}"
             placeholder="Acorde correto…" oninput="validarCorrecaoTodosInput(this)">
    </div>
  `).join('');
  return `
    <div class="correcao-todos-panel">
      <div class="correcao-todos-titulo">Corrigir todos os não reconhecidos</div>
      <div class="correcao-todos-lista">${rows}</div>
      <div class="correcao-todos-actions">
        <button class="nav-btn" style="font-weight:600;color:var(--accent)" onclick="aplicarCorrecaoTodos()">Aplicar todos</button>
        <button class="nav-btn" onclick="fecharCorrecaoTodos()">Cancelar</button>
      </div>
    </div>
  `;
}

function validarCorrecaoTodosInput(inp) {
  const ok = isValidChordToken(inp.value.trim());
  inp.style.borderColor = inp.value.trim() ? (ok ? '#a5d6a7' : '#ef9a9a') : '';
}

function cancelarCorrecao() {
  _correcaoLinhas = [];
  _correcaoSel = null;
  renderMusicaView();
}

function toggleAcordesMobile() {
  acordesMobileAbertos = !acordesMobileAbertos;
  const scrollTop = document.getElementById('musica-cifra-scroll')?.scrollTop || 0;
  renderMusicaView();
  const cifra = document.getElementById('musica-cifra-scroll');
  if (cifra) cifra.scrollTop = scrollTop;
}

function toggleMusicaMenuMobile(e) {
  if (e) e.stopPropagation();
  document.getElementById('musica-mobile-menu')?.classList.toggle('hidden');
}

document.addEventListener('click', e => {
  const menu = document.getElementById('musica-mobile-menu');
  if (menu && !menu.classList.contains('hidden') && !e.target.closest('.musica-mobile-menu-wrap')) {
    menu.classList.add('hidden');
  }
});

// ─── Swipe para navegar entre músicas ──────────────────────────────────────────
let _swipeTX = 0, _swipeTY = 0;
function iniciarSwipeCifra(el) {
  el.addEventListener('touchstart', e => {
    _swipeTX = e.touches[0].clientX;
    _swipeTY = e.touches[0].clientY;
  }, { passive: true });
  el.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - _swipeTX;
    const dy = e.changedTouches[0].clientY - _swipeTY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 2) navegarMusica(dx < 0 ? 1 : -1);
  }, { passive: true });
}

// ─── Controle de tom ───────────────────────────────────────────────────────────
let tomMenuAberto = false;
let opcoesMenuAberto = false;
let opcoesMenuView = 'menu'; // 'menu' | 'fonte'
let modoFullscreen = false;

function toggleFullscreenMusica() {
  modoFullscreen = !modoFullscreen;
  document.getElementById('musica-page-header')?.classList.toggle('musica-header-hidden', modoFullscreen);
  const btnEl = document.querySelector('.fullscreen-btn');
  if (btnEl) {
    btnEl.classList.toggle('active', modoFullscreen);
    btnEl.querySelector('.material-symbols-outlined').textContent = modoFullscreen ? 'fullscreen_exit' : 'fullscreen';
  }
}

function toggleOpcoesMenu(e) {
  if (e) e.stopPropagation();
  opcoesMenuAberto = !opcoesMenuAberto;
  if (opcoesMenuAberto) opcoesMenuView = 'menu';
  _renderOpcoesMenu();
}

function fecharOpcoesMenu() {
  opcoesMenuAberto = false;
  _renderOpcoesMenu();
}

function _irOpcoesMenu(view) {
  opcoesMenuView = view;
  _renderOpcoesMenu();
}

function _renderOpcoesMenu() {
  const el = document.getElementById('opcoes-menu');
  if (!el) return;
  el.classList.toggle('hidden', !opcoesMenuAberto);
  el.innerHTML = _renderOpcoesMenuConteudo();
}

function _renderOpcoesMenuConteudo() {
  if (opcoesMenuView === 'fonte') {
    const idx = CIFRA_FONT_SIZES.indexOf(cifraFontSize);
    return `
      <button class="opcoes-menu-back" onclick="_irOpcoesMenu('menu');event.stopPropagation()">
        <span class="material-symbols-outlined">chevron_left</span> Tamanho
      </button>
      <div class="opcoes-row">
        <button class="icon-btn" onclick="diminuirFonte();event.stopPropagation()" ${idx <= 0 ? 'disabled' : ''}><span class="material-symbols-outlined">text_decrease</span></button>
        <input type="number" class="opcoes-fonte-input" value="${cifraFontSize}" min="8" max="72"
          oninput="_setFonteSize(this.value)"
          onkeydown="if(event.key==='Enter'||event.key==='Escape'){fecharOpcoesMenu();event.preventDefault()}"
          onclick="event.stopPropagation()">
        <button class="icon-btn" onclick="aumentarFonte();event.stopPropagation()" ${idx >= CIFRA_FONT_SIZES.length - 1 ? 'disabled' : ''}><span class="material-symbols-outlined">text_increase</span></button>
      </div>
    `;
  }
  return `
    <div class="opcoes-menu-titulo">Mais opções</div>
    <button class="opcoes-menu-row" onclick="_irOpcoesMenu('fonte');event.stopPropagation()">
      <span class="material-symbols-outlined">text_fields</span>
      <span class="opcoes-menu-row-label">Tamanho: ${cifraFontSize}</span>
      <span class="material-symbols-outlined opcoes-menu-row-chevron">chevron_right</span>
    </button>
    <button class="opcoes-menu-row" onclick="fecharOpcoesMenu();abrirAvaliarSheet('${musicaAtualId}');event.stopPropagation()">
      <span class="material-symbols-outlined">reviews</span>
      <span class="opcoes-menu-row-label">Avaliar</span>
      <span class="material-symbols-outlined opcoes-menu-row-chevron">chevron_right</span>
    </button>
  `;
}

document.addEventListener('click', e => {
  if (opcoesMenuAberto && !e.target.closest('.opcoes-wrap')) fecharOpcoesMenu();
});

function renderTomControl(tomAtual, tomOriginal, semitons) {
  const raizAtual = obterRaizNota(tomAtual);
  const semitonsSinal = semitons > 6 ? semitons - 12 : semitons;
  return `
    <div class="tom-wrap">
      <button class="musica-tom-badge" onclick="toggleTomMenu(event)">
        <span class="tom-badge-prefix">Tom: </span>${tomAtual}${semitons ? ` <span class="tom-badge-offset">(${semitonsSinal > 0 ? '+' : ''}${semitonsSinal}st)</span>` : ''}
        <span class="material-symbols-outlined tom-badge-caret">expand_more</span>
      </button>
      <div id="tom-menu" class="tom-menu ${tomMenuAberto ? '' : 'hidden'}">
        <div class="tom-menu-secao">
          <button class="tom-step-btn" onclick="transporMusica(-1)" title="Meio tom abaixo">−½</button>
          <div class="tom-menu-atual">${tomAtual}</div>
          <button class="tom-step-btn" onclick="transporMusica(1)" title="Meio tom acima">+½</button>
        </div>
        <div class="tom-menu-grid">
          ${NOTAS.map(n => `<button class="tom-opt${n === raizAtual ? ' active' : ''}" onclick="selecionarTom('${n}')">${n}</button>`).join('')}
        </div>
        <button class="tom-menu-reset" onclick="resetarTom()" ${semitons ? '' : 'disabled'}>
          <span class="material-symbols-outlined">restart_alt</span> Voltar ao tom original (${tomOriginal})
        </button>
      </div>
    </div>
  `;
}

function toggleTomMenu(e) {
  if (e) e.stopPropagation();
  tomMenuAberto = !tomMenuAberto;
  document.getElementById('tom-menu')?.classList.toggle('hidden', !tomMenuAberto);
}

function fecharTomMenu() {
  if (!tomMenuAberto) return;
  tomMenuAberto = false;
  document.getElementById('tom-menu')?.classList.add('hidden');
}

document.addEventListener('click', e => {
  const menu = document.getElementById('tom-menu');
  if (menu && !menu.classList.contains('hidden') && !e.target.closest('.tom-wrap')) {
    fecharTomMenu();
  }
});

function salvarTransposicao(novoValor) {
  if (!musicaAtualId) return;
  const normalizado = ((novoValor % 12) + 12) % 12;
  atualizarMusica(musicaAtualId, { transposicao: normalizado });
  tomMenuAberto = true;
  renderMusicaView();
}

function transporMusica(delta) {
  const musica = buscarMusica(musicaAtualId);
  if (!musica) return;
  salvarTransposicao((musica.transposicao || 0) + delta);
}

function selecionarTom(notaAlvo) {
  const musica = buscarMusica(musicaAtualId);
  if (!musica || !musica.tom) return;
  const raizOriginal = obterRaizNota(musica.tom);
  if (!raizOriginal) return;
  const diff = (NOTAS.indexOf(notaAlvo) - NOTAS.indexOf(raizOriginal) + 12) % 12;
  salvarTransposicao(diff);
}

function resetarTom() { salvarTransposicao(0); }

// ─── Autorrolagem ──────────────────────────────────────────────────────────────
let autoScrollState = { ativo: false, rodando: false, velocidade: 3, rafId: null, ultimoTs: null, acumulado: 0 };

function obterCifraScrollEl() {
  return document.getElementById('musica-cifra-scroll');
}

function iniciarAutoScroll() {
  autoScrollState.ativo = true;
  autoScrollState.rodando = true;
  renderToolbarAutoScroll();
  iniciarLoopAutoScroll();
}

function fecharAutoScroll() {
  pararLoopAutoScroll();
  autoScrollState = { ativo: false, rodando: false, velocidade: autoScrollState.velocidade, rafId: null, ultimoTs: null, acumulado: 0 };
  renderToolbarAutoScroll();
}

function alternarAutoScrollPlay() {
  autoScrollState.rodando = !autoScrollState.rodando;
  if (autoScrollState.rodando) iniciarLoopAutoScroll();
  else pararLoopAutoScroll();
  renderToolbarAutoScroll();
}

document.addEventListener('keydown', e => {
  if (e.code === 'Space' && autoScrollState.ativo) {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    e.preventDefault();
    alternarAutoScrollPlay();
  }
});

function reiniciarAutoScroll() {
  const el = obterCifraScrollEl();
  if (el) el.scrollTop = 0;
  autoScrollState.acumulado = 0;
}

function ajustarVelocidadeAutoScroll(v) {
  autoScrollState.velocidade = parseInt(v, 10);
}

function renderToolbarAutoScroll() {
  const scrollTop = obterCifraScrollEl()?.scrollTop || 0;
  renderMusicaView();
  const cifra = obterCifraScrollEl();
  if (cifra) cifra.scrollTop = scrollTop;
}

function iniciarLoopAutoScroll() {
  pararLoopAutoScroll();
  autoScrollState.ultimoTs = null;
  const passo = ts => {
    const el = obterCifraScrollEl();
    if (!el || !autoScrollState.ativo || !autoScrollState.rodando) { autoScrollState.rafId = null; return; }
    if (autoScrollState.ultimoTs !== null) {
      const dt = ts - autoScrollState.ultimoTs;
      const pxPorMs = (autoScrollState.velocidade * 2) / 1000;
      autoScrollState.acumulado += dt * pxPorMs;
      const inteiro = Math.floor(autoScrollState.acumulado);
      if (inteiro > 0) {
        el.scrollTop += inteiro;
        autoScrollState.acumulado -= inteiro;
      }
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
        autoScrollState.rodando = false;
        autoScrollState.rafId = null;
        renderToolbarAutoScroll();
        return;
      }
    }
    autoScrollState.ultimoTs = ts;
    autoScrollState.rafId = requestAnimationFrame(passo);
  };
  autoScrollState.rafId = requestAnimationFrame(passo);
}

function pararLoopAutoScroll() {
  if (autoScrollState.rafId) cancelAnimationFrame(autoScrollState.rafId);
  autoScrollState.rafId = null;
}

// ─── Edição de música ──────────────────────────────────────────────────────────
function abrirEdicaoMusica() {
  const musica = buscarMusica(musicaAtualId);
  if (!musica) return;

  // Header: cancelar + salvar
  document.getElementById('musica-page-header').innerHTML = `
    <button class="nav-btn" onclick="renderMusicaView()">
      <span class="material-symbols-outlined">arrow_back</span>
    </button>
    <div class="musica-view-nav">
      <div class="musica-view-titulo-wrap">
        <h1 class="musica-titulo">Editar música</h1>
      </div>
    </div>
    <button class="nav-btn" style="font-weight:600;color:var(--accent)" onclick="salvarEdicaoMusica()">Salvar</button>
  `;

  // Body: formulário
  document.getElementById('musica-page-body').innerHTML = `
    <div class="musica-edit-scroll">
      <div class="musica-edit-form">
        <label>Título</label>
        <input type="text" id="edit-titulo" value="${musica.titulo.replace(/"/g,'&quot;')}">
        <label>Artista</label>
        <input type="text" id="edit-artista" value="${musica.artista.replace(/"/g,'&quot;')}">
        <label>Tom</label>
        <input type="text" id="edit-tom" value="${(musica.tom || '').replace(/"/g,'&quot;')}">
        <label>Gênero</label>
        <div class="musica-edit-genero-wrap">
          <select id="edit-genero" class="musica-edit-select">
            ${[...new Set([...GENEROS, musica.genero || ''])].filter(Boolean).map(g => `<option value="${g}"${(musica.genero || 'MPB') === g ? ' selected' : ''}>${g}</option>`).join('')}
          </select>
        </div>
        <label>Cifra</label>
        <textarea id="edit-cifra" rows="20">${musica.cifraTexto.replace(/</g,'&lt;')}</textarea>
        <div class="musica-edit-actions">
          <button class="nav-btn" onclick="renderMusicaView()">Cancelar</button>
        </div>
      </div>
    </div>
  `;
}

function toggleNovoGeneroInput(valor) {
  const input = document.getElementById('edit-genero-novo');
  if (!input) return;
  if (valor === '__novo__') { input.classList.remove('hidden'); input.focus(); }
  else { input.classList.add('hidden'); input.value = ''; }
}

function salvarEdicaoMusica() {
  const titulo = document.getElementById('edit-titulo').value.trim();
  const artista = document.getElementById('edit-artista').value.trim();
  const tom = document.getElementById('edit-tom').value.trim();
  const cifraTexto = document.getElementById('edit-cifra').value;
  const acordes = extrairAcordes(cifraTexto);
  const selectGenero = document.getElementById('edit-genero');
  const genero = selectGenero?.value === '__novo__'
    ? (document.getElementById('edit-genero-novo')?.value.trim() || 'Outros')
    : (selectGenero?.value || 'Outros');
  atualizarMusica(musicaAtualId, { titulo, artista, tom, cifraTexto, acordes, genero });
  renderMusicaView();
}

function removerMusicaAtualEVoltar() {
  if (!musicaAtualId) return;
  removerMusica(musicaAtualId);
  fecharMusicaView();
}

// ─── Modal de acorde ───────────────────────────────────────────────────────────
let acordeModalState = null;

function abrirAcordeModal(nomeAcorde) {
  try {
    const r = obterAcordeInfo(nomeAcorde);
    acordeModalState = { identificador: nomeAcorde, notas: [...r.notasNorm], cands: r.cands };
  } catch (e) {
    acordeModalState = { identificador: nomeAcorde, notas: [], cands: [], erro: e.message };
  }
  document.getElementById('acorde-modal-titulo').textContent = nomeAcorde;
  document.getElementById('acorde-modal').classList.remove('hidden');
  renderAcordeModalBody();
}

function fecharAcordeModal() {
  document.getElementById('acorde-modal').classList.add('hidden');
  acordeModalState = null;
}

function toggleAcordeModalFavorito(idx) {
  if (!acordeModalState) return;
  const c = acordeModalState.cands[idx];
  toggleFavorito(acordeModalState.identificador, acordeModalState.notas, c.posicoes);
  renderAcordeModalBody();
  if (musicaAtualId) renderMusicaView();
}

function renderAcordeModalOption(c, idx, identificador) {
  const pestana = detectarPestana(c.posicoes);
  const apoio = detectarPestanaApoio(c.posicoes);
  const soltas = CORDAS.filter(co => c.posicoes[co] === 0);
  const tags = [];
  if (pestana) tags.push(`👇 Pestana ${pestana}`);
  else if (apoio) tags.push(`💡 Apoio ${apoio}`);
  if (soltas.length) tags.push(`🫳 Solta${soltas.length>1?'s':''}: ${soltas.map(co=>c.notasTocadas[co]).join(',')}`);

  return `<div class="chord-option">
    <button class="fav-btn" onclick="toggleAcordeModalFavorito(${idx})">${iconeFavorito(ehFavorito(identificador, c.posicoes))}</button>
    <div class="option-label">Opção ${idx+1}</div>
    <div class="option-tags">${tags.join(' · ')}</div>
    ${renderDiagram(c)}
  </div>`;
}

function renderAcordeModalBody() {
  const wrap = document.getElementById('acorde-modal-body');
  const s = acordeModalState;
  if (!s || s.erro) { wrap.innerHTML = `<div class="error-msg">${s?.erro || 'Acorde inválido'}</div>`; return; }
  if (!s.cands.length) { wrap.innerHTML = `<div class="error-msg">Nenhuma posição encontrada para esse acorde.</div>`; return; }
  wrap.innerHTML = `<div class="options-row">` +
    s.cands.map((c, idx) => renderAcordeModalOption(c, idx, s.identificador)).join('') +
    `</div>`;
}

// ─── Menu da lista de músicas (exportar / importar) ────────────────────────────
function toggleMusicasMenu(e) {
  if (e) e.stopPropagation();
  document.getElementById('musicas-menu').classList.toggle('hidden');
  atualizarMenuModoNovato();
}

function fecharMusicasMenu() {
  document.getElementById('musicas-menu').classList.add('hidden');
}

document.addEventListener('click', e => {
  const menu = document.getElementById('musicas-menu');
  if (menu && !menu.classList.contains('hidden') && !e.target.closest('.menu-wrap')) {
    fecharMusicasMenu();
  }
});

function exportarBackup() {
  fecharMusicasMenu();
  const dados = { musicas: listarMusicas(), favoritos: listarFavoritos(), exportadoEm: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const d = new Date();
  const data = `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
  a.download = `uque-backup-${data}-${dados.musicas.length}mus-${dados.favoritos.length}aco.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function abrirSeletorImportacao() {
  fecharMusicasMenu();
  document.getElementById('backup-file-input').click();
}

function importarBackupArquivo(input) {
  const arquivo = input.files[0];
  if (!arquivo) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const dados = JSON.parse(e.target.result);
      let musicasAdicionadas = 0;
      let musicasAtualizadas = 0;
      let favoritosAdicionados = 0;

      if (Array.isArray(dados.musicas)) {
        const lista = listarMusicas();
        const idxPorId = Object.fromEntries(lista.map((m, i) => [m.id, i]));
        dados.musicas.forEach(m => {
          if (!(m.id in idxPorId)) {
            lista.push(m);
            musicasAdicionadas++;
          } else {
            // Mescla dados do backup na música existente (restaura avaliações, pins, etc.)
            lista[idxPorId[m.id]] = { ...lista[idxPorId[m.id]], ...m };
            musicasAtualizadas++;
          }
        });
        salvarListaMusicas(lista);
      }
      if (Array.isArray(dados.favoritos)) {
        const lista = listarFavoritos();
        const existentes = new Set(lista.map(f => f.id));
        dados.favoritos.forEach(f => { if (!existentes.has(f.id)) { lista.push(f); favoritosAdicionados++; } });
        salvarListaFavoritos(lista);
      }

      renderMusicasLista();
      if (musicaAtualId) renderMusicaView();
      renderFavoritos();
      const partes = [];
      if (musicasAdicionadas) partes.push(`${musicasAdicionadas} música(s) adicionada(s)`);
      if (musicasAtualizadas) partes.push(`${musicasAtualizadas} música(s) atualizada(s)`);
      if (favoritosAdicionados) partes.push(`${favoritosAdicionados} formato(s) de acorde adicionado(s)`);
      alert(`Backup importado: ${partes.join(', ') || 'nenhuma novidade'}.`);
    } catch {
      alert('Não consegui ler esse arquivo. Confira se é um backup válido (.json exportado por aqui).');
    }
    input.value = '';
  };
  reader.readAsText(arquivo);
}

function limparTudo() {
  fecharMusicasMenu();
  const total = listarMusicas().length + listarFavoritos().length;
  if (!total) { alert('Não há nada salvo para limpar.'); return; }
  if (!confirm(`Isso vai apagar TODAS as ${listarMusicas().length} música(s) e ${listarFavoritos().length} formato(s) de acorde favoritado(s) salvos neste navegador. Essa ação não pode ser desfeita.\n\nRecomendamos exportar um backup antes. Quer continuar mesmo assim?`)) return;
  salvarListaMusicas([]);
  salvarListaFavoritos([]);
  fecharMusicaView();
  renderFavoritos();
  alert('Tudo foi apagado.');
}

// ─── Redimensionar coluna de acordes (desktop) ─────────────────────────────────
function iniciarResizeAcordes(e) {
  e.preventDefault();
  const coluna = document.querySelector('.musica-acordes');
  if (!coluna) return;
  const xInicial = e.clientX;
  const larguraInicial = coluna.getBoundingClientRect().width;
  function onMove(ev) {
    const delta = xInicial - ev.clientX;
    const novaLargura = Math.max(180, Math.min(larguraInicial + delta, window.innerWidth * 0.7));
    coluna.style.flex = `0 0 ${novaLargura}px`;
  }
  function onUp() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  }
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

// ─── Descrição legível do acorde em português ─────────────────────────────────
function descreverAcorde(nome) {
  const NOTAS = { C:'Dó', D:'Ré', E:'Mi', F:'Fá', G:'Sol', A:'Lá', B:'Si' };
  const EXTS  = { '2':'dois', '4':'quatro', '5':'quinta', '6':'sexta',
                  '7':'sétima', '9':'nona', '11':'décima primeira', '13':'décima terceira' };

  let s = nome;

  // Raiz
  const rm = s.match(/^([A-G])([#b]?)/);
  if (!rm) return nome;
  s = s.slice(rm[0].length);
  const nota = NOTAS[rm[1]] + (rm[2] === '#' ? ' sustenido' : rm[2] === 'b' ? ' bemol' : '');

  // Qualidade + número
  let qualidade = '', numero = '';
  let m;
  if      (m = s.match(/^maj(\d{0,2})/))          { qualidade = 'maior';     numero = m[1]; s = s.slice(m[0].length); }
  else if (m = s.match(/^M(\d{0,2})/))           { qualidade = 'maior';     numero = m[1]; s = s.slice(m[0].length); }
  else if (m = s.match(/^min(\d{0,2})/))         { qualidade = 'menor';     numero = m[1]; s = s.slice(m[0].length); }
  else if (m = s.match(/^m(\d{0,2})/))           { qualidade = 'menor';     numero = m[1]; s = s.slice(m[0].length); }
  else if (m = s.match(/^dim(\d?)/))             { qualidade = 'diminuto';  numero = m[1]; s = s.slice(m[0].length); }
  else if (m = s.match(/^[°º]/))                { qualidade = 'diminuto';  s = s.slice(1); }
  else if (m = s.match(/^aug(\d?)/))             { qualidade = 'aumentado'; numero = m[1]; s = s.slice(m[0].length); }
  else if (m = s.match(/^sus([24]?)/))           { qualidade = 'suspenso' + (m[1] === '2' ? ' dois' : ''); s = s.slice(m[0].length); }
  else if (m = s.match(/^(\d{1,2})(maj|M)?/))   { numero = m[1]; if (m[2]) qualidade = 'maior'; s = s.slice(m[0].length); }

  // + após número
  let plusApos = false;
  if (s[0] === '+') { plusApos = true; s = s.slice(1); }

  // Adições entre parênteses
  const adics = [];
  if (m = s.match(/^\(([^)]{1,8})\)/)) {
    const inn = m[1]; s = s.slice(m[0].length);
    if      (/^-5|b5$/.test(inn))          adics.push('quinta bemol');
    else if (/^\+5|#5$/.test(inn))         adics.push('quinta aumentada');
    else if (/^7\+|M7|maj7$/i.test(inn))   adics.push('sétima maior');
    else if (m = inn.match(/^add(\d+)$/))  adics.push((EXTS[m[1]] || m[1] + 'ª') + ' adicionada');
    else if (m = inn.match(/^(\d+)$/))     adics.push(EXTS[m[1]] || m[1] + 'ª');
    else adics.push(inn);
  }

  // Baixo: /Letra ou /número
  let baixo = '';
  if (m = s.match(/^\/([A-G][#b]?)/)) {
    const bn = m[1][0], ba = m[1][1] || '';
    baixo = 'baixo em ' + NOTAS[bn] + (ba === '#' ? ' sustenido' : ba === 'b' ? ' bemol' : '');
    s = s.slice(m[0].length);
  } else if (m = s.match(/^\/(\d+)/)) {
    adics.unshift(EXTS[m[1]] || m[1] + 'ª');
    s = s.slice(m[0].length);
  }

  // + no final
  if (s[0] === '+') { plusApos = true; }

  // Montar descrição
  let desc = nota;

  if      (qualidade === 'menor')    desc += ' menor';
  else if (qualidade === 'diminuto') desc += ' diminuto';
  else if (qualidade === 'aumentado')desc += ' aumentado';
  else if (qualidade.startsWith('suspenso')) desc += ' ' + qualidade;
  // 'maior' explícito (Cmaj / CM) sem número
  else if (qualidade === 'maior' && !numero) desc += ' maior';

  if (numero) {
    const extNome = EXTS[numero] || numero + 'ª';
    // Se qualidade é maior COM número → "sétima maior" (CM7)
    if (qualidade === 'maior') desc += ' com ' + extNome + ' maior';
    else                        desc += ' com ' + extNome;

    // 7+ → "sétima e quinta aumentada"
    if (plusApos && numero === '7') { adics.unshift('quinta aumentada'); plusApos = false; }
  }

  if (plusApos) desc += ' aumentado';
  if (adics.length) desc += ' e ' + adics.join(' e ');
  if (baixo) desc += ' com ' + baixo;

  return desc;
}

// ─── Tooltip flutuante com diagrama (hover nos acordes da cifra) ───────────────
let chordTooltipEl = null;

function obterDiagramaAcorde(nomeAcorde) {
  const r = obterAcordeInfo(nomeAcorde);
  let candidato = r.cands[0];
  const favorito = buscarFavorito(nomeAcorde);
  if (favorito) {
    const idx = r.cands.findIndex(c => posicoesIguais(c.posicoes, favorito.posicoes));
    if (idx !== -1) candidato = r.cands[idx];
  }
  return candidato ? renderDiagram(candidato) : null;
}

function mostrarChordTooltip(nomeAcorde, x, y) {
  let diagramaHtml;
  try { diagramaHtml = obterDiagramaAcorde(nomeAcorde); } catch { diagramaHtml = null; }
  if (!diagramaHtml) return;
  if (!chordTooltipEl) {
    chordTooltipEl = document.createElement('div');
    chordTooltipEl.className = 'chord-tooltip';
    document.body.appendChild(chordTooltipEl);
  }
  const descHtml = modoNomes ? `<div class="chord-tooltip-desc">${escapeHtml(descreverAcorde(nomeAcorde))}</div>` : '';
  chordTooltipEl.innerHTML = `<div class="chord-tooltip-nome">${escapeHtml(nomeAcorde)}</div>${descHtml}${diagramaHtml}`;
  chordTooltipEl.style.display = 'block';
  posicionarChordTooltip(x, y);
}

function posicionarChordTooltip(x, y) {
  if (!chordTooltipEl) return;
  const margem = 14;
  const rect = chordTooltipEl.getBoundingClientRect();
  let left = x + margem;
  let top = y + margem;
  if (left + rect.width > window.innerWidth) left = x - rect.width - margem;
  if (top + rect.height > window.innerHeight) top = y - rect.height - margem;
  chordTooltipEl.style.left = `${Math.max(4, left)}px`;
  chordTooltipEl.style.top = `${Math.max(4, top)}px`;
}

function esconderChordTooltip() {
  if (chordTooltipEl) chordTooltipEl.style.display = 'none';
}

document.addEventListener('mouseover', e => {
  const token = e.target.closest('.chord-token');
  if (token) mostrarChordTooltip(token.dataset.acorde, e.clientX, e.clientY);
});
document.addEventListener('mousemove', e => {
  if (chordTooltipEl && chordTooltipEl.style.display === 'block' && e.target.closest('.chord-token')) {
    posicionarChordTooltip(e.clientX, e.clientY);
  }
});
document.addEventListener('mouseout', e => {
  if (e.target.closest('.chord-token') && !e.relatedTarget?.closest('.chord-token')) {
    esconderChordTooltip();
  }
});

// ─── Modal Modo Aprendiz ──────────────────────────────────────────────────────
function abrirAprendizModal() {
  fecharMusicasMenu();
  _renderAprendizModal();
  document.getElementById('aprendiz-modal').classList.remove('hidden');
}

function fecharAprendizModal() {
  document.getElementById('aprendiz-modal').classList.add('hidden');
}

function _renderAprendizModal() {
  const opts = [
    {
      flag: 'modoSimplificar',
      icon: 'tune',
      titulo: 'Simplificar acordes',
      desc: 'Substitui acordes complexos por versões mais fáceis (ex: F → Fmaj7, Bb → A#).',
      toggle: 'toggleModoSimplificar()',
    },
    {
      flag: 'modoNomes',
      icon: 'info',
      titulo: 'Mostrar nomes',
      desc: 'Exibe o nome do acorde (ex: "Lá menor") ao passar o mouse sobre ele.',
      toggle: 'toggleModoNomes()',
    },
    {
      flag: 'modoEsconderTab',
      icon: 'hide_source',
      titulo: 'Esconder tablatura',
      desc: 'Remove as linhas de tablatura da cifra, deixando só acordes e letra.',
      toggle: 'toggleModoEsconderTab()',
    },
  ];

  const ativo = modoSimplificar || modoNomes || modoEsconderTab;

  document.getElementById('aprendiz-modal-body').innerHTML = `
    <p class="aprendiz-modal-desc">Ferramentas para facilitar o aprendizado. Ative cada modo individualmente ou todos de uma vez.</p>
    <div class="aprendiz-modal-opts">
      ${opts.map(o => {
        const ligado = window[o.flag];
        return `
          <button class="aprendiz-modal-opt${ligado ? ' active' : ''}" onclick="${o.toggle}; _renderAprendizModal()">
            <span class="material-symbols-outlined aprendiz-modal-opt-icon">${ligado ? 'check_circle' : 'radio_button_unchecked'}</span>
            <div class="aprendiz-modal-opt-texto">
              <strong>${o.titulo}</strong>
              <span>${o.desc}</span>
            </div>
          </button>`;
      }).join('')}
    </div>
    <button class="aprendiz-modal-all-btn" onclick="toggleModoNovato(); _renderAprendizModal()">
      <span class="material-symbols-outlined">${ativo ? 'toggle_on' : 'toggle_off'}</span>
      ${ativo ? 'Desativar todos' : 'Ativar todos'}
    </button>
  `;
}

// ─── Sheet "Editar Acorde" ────────────────────────────────────────────────────
let _notaSheetState = null; // { original, display, semitons }

function abrirNotaSheet(token) {
  const display = token.dataset.acorde;
  const original = token.dataset.acordeOriginal || display;
  const occ = parseInt(token.dataset.acordeOcc ?? '0', 10);
  const musica = buscarMusica(musicaAtualId);
  const semitons = musica?.transposicao || 0;
  _notaSheetState = { original, display, semitons, occ };

  document.getElementById('nota-sheet-title').textContent = display;
  const input = document.getElementById('nota-sheet-input');
  input.value = display;
  input.style.borderColor = '';
  document.getElementById('nota-sheet-confirmar').disabled = true;
  const cb = document.getElementById('nota-sheet-todos-cb');
  if (cb) cb.checked = true;
  const cbLabel = document.getElementById('nota-sheet-todos-label');
  if (cbLabel) cbLabel.textContent = `Substituir todos "${display}" da música`;
  _renderNotaSheetVoicings(display);
  _atualizarNotaSheetPinBtn();

  document.getElementById('nota-sheet-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  setTimeout(() => input.focus(), 200);
}

function abrirNotaSheetPorNome(nomeAcorde) {
  const fakeToken = { dataset: { acorde: nomeAcorde, acordeOriginal: nomeAcorde, acordeOcc: '0' } };
  abrirNotaSheet(fakeToken);
}

function _atualizarNotaSheetPinBtn() {
  const btn = document.getElementById('nota-sheet-pin-btn');
  if (!btn || !_notaSheetState) return;
  const nome = _notaSheetState.display;
  const musica = buscarMusica(musicaAtualId);
  const pinned = musica?.pinnedAcordes || [];
  const isPinned = pinned.includes(nome);
  const icon = btn.querySelector('.material-symbols-outlined');
  if (icon) icon.style.fontVariationSettings = isPinned ? "'FILL' 1" : "'FILL' 0";
  btn.classList.toggle('active', isPinned);
  btn.disabled = !isPinned && pinned.length >= 3;
  btn.title = isPinned ? 'Desafixar' : (pinned.length >= 3 ? 'Limite de 3 fixados atingido' : 'Fixar na lista');
}

function toggleNotaSheetPin() {
  if (!_notaSheetState || !musicaAtualId) return;
  const nome = _notaSheetState.display;
  const musica = buscarMusica(musicaAtualId);
  const pinned = [...(musica?.pinnedAcordes || [])];
  const idx = pinned.indexOf(nome);
  let fixou = false;
  if (idx !== -1) pinned.splice(idx, 1);
  else if (pinned.length < 3) { pinned.push(nome); fixou = true; }
  atualizarMusica(musicaAtualId, { pinnedAcordes: pinned });
  _pinnedAcordesAtual = pinned;
  _atualizarNotaSheetPinBtn();
  if (fixou && window.innerWidth <= 860) acordesMobileAbertos = true;
  renderMusicaView();
}

function fecharNotaSheet() {
  document.getElementById('nota-sheet-overlay').classList.add('hidden');
  document.body.style.overflow = '';
  _notaSheetState = null;
}

function _normalizarAcordeInput(raw) {
  // Accepts lowercase input: "am" → "Am", "f#m" → "F#m", "c" → "C"
  if (!raw) return raw;
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function notaSheetInputChange() {
  const input = document.getElementById('nota-sheet-input');
  const raw = input.value.trim();
  const val = _normalizarAcordeInput(raw);
  const valido = val.length > 0 && isValidChordToken(val);
  const mudou = val !== (_notaSheetState?.display || '');
  input.style.borderColor = raw && !valido ? '#e53e3e' : '';
  document.getElementById('nota-sheet-confirmar').disabled = !(valido && mudou);
  if (valido) _renderNotaSheetVoicings(val);
}

function _renderNotaSheetVoicings(nomeAcorde) {
  const container = document.getElementById('nota-sheet-voicings');
  try {
    const r = obterAcordeInfo(nomeAcorde);
    if (!r.cands.length) { container.innerHTML = '<p class="nota-sheet-vazio">Nenhum diagrama encontrado</p>'; return; }
    container.innerHTML = r.cands.map((c, i) => {
      const fav = ehFavorito(nomeAcorde, c.posicoes);
      const svg = renderDiagram(c, { showNoteLabels: false, padB: 10 });
      return `<button class="nota-sheet-voicing${fav ? ' fav' : ''}" onclick="notaSheetSelecionarVoicing(${i})" title="${fav ? '★ Favorito' : 'Posição ' + (i+1)}">
        ${svg}
        ${fav ? `<span class="nota-sheet-fav-badge material-symbols-outlined" style="font-variation-settings:'FILL' 1;">star</span>` : ''}
      </button>`;
    }).join('');
  } catch(e) {
    container.innerHTML = '<p class="nota-sheet-vazio">Acorde não reconhecido</p>';
  }
}

function notaSheetSelecionarVoicing(idx) {
  if (!_notaSheetState) return;
  const raw = document.getElementById('nota-sheet-input').value.trim();
  const nomeAcorde = (raw ? _normalizarAcordeInput(raw) : '') || _notaSheetState.display;
  try {
    const r = obterAcordeInfo(nomeAcorde);
    const c = r.cands[idx];
    toggleFavorito(nomeAcorde, r.notasNorm, c.posicoes);
    _renderNotaSheetVoicings(nomeAcorde);
    if (musicaAtualId) renderMusicaView();
  } catch(e) {}
}

function confirmarTrocaAcorde() {
  if (!_notaSheetState) return;
  const input = document.getElementById('nota-sheet-input');
  const novoDisplay = _normalizarAcordeInput(input.value.trim());
  if (!isValidChordToken(novoDisplay)) return;

  const { original, semitons, occ } = _notaSheetState;
  const musica = buscarMusica(musicaAtualId);
  if (!musica) return;

  const novoOriginal = semitons !== 0 ? simplificarAcorde(transporAcorde(novoDisplay, -semitons)) : novoDisplay;
  const todos = document.getElementById('nota-sheet-todos-cb')?.checked !== false;
  const novaCifra = todos
    ? _substituirAcordeCifra(musica.cifraTexto, original, novoOriginal, -1)
    : _substituirAcordeCifra(musica.cifraTexto, original, novoOriginal, occ);

  atualizarMusica(musicaAtualId, { cifraTexto: novaCifra, acordes: extrairAcordes(novaCifra) });
  fecharNotaSheet();
  renderMusicaView();
}

function _substituirAcordeCifra(cifra, original, novo, occAlvo = -1) {
  let count = 0;
  return cifra.split('\n').map(linha => {
    const tokens = linha.trim().split(/\s+/).filter(Boolean);
    if (!tokens.some(t => isValidChordToken(t))) return linha;
    return linha.split(/(\s+)/).map(part => {
      if (part !== original) return part;
      const idx = count++;
      return (occAlvo === -1 || idx === occAlvo) ? novo : part;
    }).join('');
  }).join('\n');
}

// Clique no chord-token abre o nota-sheet (bottom sheet)
document.addEventListener('click', e => {
  const token = e.target.closest('.chord-token');
  if (!token) return;
  e.preventDefault();
  e.stopPropagation();
  esconderChordTooltip();
  abrirNotaSheet(token);
});
