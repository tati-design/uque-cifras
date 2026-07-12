// ─── Gêneros disponíveis ────────────────────────────────────────────────────────
const GENEROS = [
  'MPB', 'Nova MPB', 'Sertanejo', 'Funk', 'Forró', 'Rock', 'Rap', 'Reggae',
  'Tradicional', 'Gospel', 'Instrumental', 'Samba', 'Pop', 'Internacional',
  'Axé', 'Black Music', 'Infantil', 'Favoritos'
];

const GENERO_ICONS = {
  'MPB': 'nature', 'Nova MPB': 'potted_plant', 'Sertanejo': 'landscape',
  'Funk': 'speaker', 'Forró': 'celebration', 'Rock': 'bolt', 'Rap': 'mic',
  'Reggae': 'self_improvement', 'Tradicional': 'hourglass_empty', 'Gospel': 'church',
  'Instrumental': 'piano', 'Samba': 'sports_bar', 'Pop': 'star',
  'Internacional': 'language', 'Axé': 'whatshot', 'Black Music': 'album',
  'Infantil': 'child_care', 'Favoritos': 'kid_star',
};

// ─── Avaliação por categorias (Instrumento / Vocal / Engajamento) ──────────────
// Cada categoria guarda um nível 0-3 em musica[key]; null/undefined = não avaliado.
const AVALIACAO_CATEGORIAS = [
  {
    key: 'ratingInstrumento', nome: 'Instrumento', icon: 'piano',
    niveis: [
      { valor: 3, label: 'Fácil',        icon: 'bolt_boost',        desc: 'Poucas notas e conhecidas' },
      { valor: 2, label: 'Desbloqueada', icon: 'lock_open',         desc: 'Todas as notas conhecidas' },
      { valor: 1, label: 'Chata',        icon: 'sentiment_neutral', desc: 'Com notas conhecidas' },
      { valor: 0, label: 'Impossível',   icon: 'do_not_disturb_on', desc: 'Ainda é inexecutável' },
    ],
  },
  {
    key: 'ratingVocal', nome: 'Vocal', icon: 'mic',
    niveis: [
      { valor: 3, label: 'Dou show',    icon: 'workspace_premium',  desc: 'Canto naturalmente bem essa' },
      { valor: 2, label: 'Confortável', icon: 'sentiment_satisfied', desc: 'Canto sem dificuldade' },
      { valor: 1, label: 'Desafino',    icon: 'hearing_disabled',   desc: 'Desafino pouco' },
      { valor: 0, label: 'Inviável',    icon: 'mic_off',            desc: 'Não sai' },
    ],
  },
  {
    key: 'ratingEngajamento', nome: 'Engajamento', icon: 'groups',
    niveis: [
      { valor: 3, label: 'Hino',  icon: 'social_leaderboard', desc: 'Todo mundo conhece' },
      { valor: 2, label: 'Nicho', icon: 'point_scan',         desc: 'Funciona bem pra quem conhece' },
      { valor: 1, label: 'Xodó',  icon: 'person_heart',       desc: 'Eu gosto muito de tocar para mim' },
      { valor: 0, label: 'Flop',  icon: 'trending_down',      desc: 'Quase ninguém sabe qual é' },
    ],
  },
];

function obterLabelNivel(categoriaKey, valor) {
  if (valor == null) return null;
  const cat = AVALIACAO_CATEGORIAS.find(c => c.key === categoriaKey);
  return cat?.niveis.find(n => n.valor === valor)?.label || null;
}

function obterIconeNivel(categoriaKey, valor) {
  if (valor == null) return null;
  const cat = AVALIACAO_CATEGORIAS.find(c => c.key === categoriaKey);
  return cat?.niveis.find(n => n.valor === valor)?.icon || null;
}

// Mapeamento título|artista (minúsculas) → gênero, gerado a partir do CSV classificado.
const _csvGeneros = {
  'the loneliest girl|carole & tuesday': 'Internacional',
  'eu te devoro|djavan': 'MPB',
  'oceano|djavan': 'MPB',
  'nem um dia|djavan': 'MPB',
  'quero voltar pra bahia|paulo diniz': 'MPB',
  'o telefone tocou novamente|jorge ben jor': 'MPB',
  'iluminado|vander lee': 'MPB',
  'esotérico|gilberto gil': 'MPB',
  'eu e você sempre|jorge aragão': 'Samba',
  'mimar você|caetano veloso': 'MPB',
  'edith cooper|gilberto gil': 'MPB',
  'um a um|tribalistas': 'MPB',
  'e o mundo não se acabou|adriana calcanhotto': 'MPB',
  'casa grande|joão alexandre': 'MPB',
  'miçanga|baianaSystem': 'MPB',
  'miçanga|baianasystem': 'MPB',
  'terra de gigantes|engenheiros do hawaii': 'Rock',
  'rapte-me, camaleoa|caetano veloso': 'MPB',
  'de noite na cama|caetano veloso': 'MPB',
  'esperando aviões|vander lee': 'MPB',
  'onde deus possa me ouvir|vander lee': 'MPB',
  'olha só|toni ferreira': 'MPB',
  'disseram que eu voltei americanizada|carmen miranda': 'MPB',
  'o lobo|pitty': 'Rock',
  'por causa de você, menina!|jorge ben jor': 'MPB',
  'o seu tipo|filarmônica de pasárgada': 'MPB',
  'é você|tribalistas': 'MPB',
  'grão de amor|tribalistas': 'MPB',
  '8 anos|adriana calcanhotto': 'MPB',
  'um dia desses|adriana calcanhotto': 'MPB',
  'uns versos|adriana calcanhotto': 'MPB',
  'vai saber|adriana calcanhotto': 'MPB',
  'canção da falsa tartaruga|adriana calcanhotto': 'Infantil',
  'disseram que eu voltei americanizada|adriana calcanhotto': 'MPB',
  'linda rosa|maria gadú': 'MPB',
  'chuva, chuvisco, chuvarada|cocoricó': 'Infantil',
  'casa pronta|mallu magalhães': 'MPB',
  'o cheiro da carolina|luiz gonzaga': 'Outros',
  'numa sala de reboco|luiz gonzaga': 'Outros',
  'sabiá|luiz gonzaga': 'Outros',
  'vem morena|luiz gonzaga': 'Outros',
  'nem se despediu de mim|luiz gonzaga': 'Outros',
  'ainda bem|vanessa da mata': 'MPB',
  'amado|vanessa da mata': 'MPB',
  'vermelho|vanessa da mata': 'MPB',
  'o sol nascerá|cartola': 'Samba',
  'corra e olhe o céu|cartola': 'Samba',
  'foguete|mariene de castro': 'Samba',
  'falsa baiana|mariene de castro': 'Samba',
  'como nossos pais|elis regina': 'MPB',
  'refazenda|gilberto gil': 'MPB',
  'tempo rei|gilberto gil': 'MPB',
  'la vie en rose|how i met your mother': 'Internacional',
  'tudo certo|resgate': 'Gospel',
  'me usa|banda magníficos': 'Outros',
  'dia branco|geraldo azevedo': 'MPB',
  'quero ir pra bahia com você (part. rebeca)|julio secchin': 'Outros',
  'não me deixe só|vanessa da mata': 'MPB',
  'boa sorte / good luck|vanessa da mata': 'MPB',
  'nossa canção|vanessa da mata': 'MPB',
  'ilegais|vanessa da mata': 'MPB',
  'as palavras|vanessa da mata': 'MPB',
  'encontro|maria gadú': 'MPB',
  'petrolina juazeiro|alceu valença': 'MPB',
  'anunciação|alceu valença': 'MPB',
  'quase sem querer|maria gadú': 'MPB',
  'carnavália|tribalistas': 'MPB',
  'passe em casa|tribalistas': 'MPB',
  'semana que vem|pitty': 'Rock',
  'eu quero sempre mais|pitty': 'Rock',
  'a massa|raimundo sodré': 'Samba',
  'hey jude|the beatles': 'Internacional',
  'let it be|the beatles': 'Internacional',
  'guarda-chuva|pirigulino babilake': 'Outros',
  'samba de lá|pirigulino babilake': 'Samba',
  'com a ponta dos dedos|wado': 'MPB',
  'verdade|zeca pagodinho': 'Samba',
  'meu querido paiól|cocoricó': 'Infantil',
  'baião balaio|cocoricó': 'Infantil',
  'nos dias quentes de verão|cocoricó': 'Infantil',
  'tudo no mesmo lugar|crombie': 'MPB',
  'sabiá|alceu valença': 'MPB',
  'ai que saudade d\'ocê|alceu valença': 'MPB',
  'idiota raiz (part. joão gomes)|joyce alane': 'Outros',
  'shimbalaiê|maria gadú': 'MPB',
  'bela flor|maria gadú': 'MPB',
  'oração ao tempo|maria gadú': 'MPB',
  'altar particular|maria gadú': 'MPB',
  'tudo diferente|maria gadú': 'MPB',
  'mortal loucura|caetano veloso': 'MPB',
};

function obterGeneroCSV(titulo, artista) {
  const key = `${(titulo || '').toLowerCase()}|${(artista || '').toLowerCase()}`;
  return _csvGeneros[key] || null;
}

function migrarIdsUnicos() {
  const lista = listarMusicas();
  const vistos = new Set();
  let alterado = false;
  lista.forEach(m => {
    if (vistos.has(m.id)) {
      m.id = `musica_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      alterado = true;
    }
    vistos.add(m.id);
  });
  if (alterado) salvarListaMusicas(lista);
}

// Corrige erros de digitação históricos nos nomes de gênero
const _GENERO_ALIASES = { 'Reagge': 'Reggae', 'reagge': 'Reggae', 'Outros': 'MPB' };

function migrarGeneros() {
  const lista = listarMusicas();
  let alterado = false;
  lista.forEach(m => {
    if (!m.genero) {
      m.genero = obterGeneroCSV(m.titulo, m.artista) || 'MPB';
      alterado = true;
    } else if (_GENERO_ALIASES[m.genero]) {
      m.genero = _GENERO_ALIASES[m.genero];
      alterado = true;
    }
  });
  if (alterado) salvarListaMusicas(lista);
}

// ─── Músicas salvas (localStorage) ─────────────────────────────────────────────
const MUSICAS_KEY = "ukulele_musicas";

function listarMusicas() {
  try {
    return JSON.parse(localStorage.getItem(MUSICAS_KEY)) || [];
  } catch {
    return [];
  }
}

function salvarListaMusicas(lista) {
  localStorage.setItem(MUSICAS_KEY, JSON.stringify(lista));
  marcarDriveSujo();
}

// ─── Sincronização com Google Drive (estado local) ─────────────────────────────
const DRIVE_KEY = "ukulele_drive_estado";

function obterEstadoDrive() {
  try {
    return { conectado: false, ultimaSincronizacao: null, sujo: false, ...JSON.parse(localStorage.getItem(DRIVE_KEY)) };
  } catch {
    return { conectado: false, ultimaSincronizacao: null, sujo: false };
  }
}

function salvarEstadoDrive(estado) {
  localStorage.setItem(DRIVE_KEY, JSON.stringify(estado));
}

function marcarDriveSujo() {
  const estado = obterEstadoDrive();
  if (estado.conectado && !estado.sujo) {
    salvarEstadoDrive({ ...estado, sujo: true });
  }
}

// Mescla um backup (do arquivo .json ou baixado do Drive) na biblioteca local por id.
// Retorna as contagens do que foi adicionado/atualizado, sem mexer na UI.
function mesclarBackup(dados) {
  const resultado = { musicasAdicionadas: 0, musicasAtualizadas: 0, favoritosAdicionados: 0 };

  if (Array.isArray(dados.musicas)) {
    const lista = listarMusicas();
    const idxPorId = Object.fromEntries(lista.map((m, i) => [m.id, i]));
    dados.musicas.forEach(m => {
      if (!(m.id in idxPorId)) {
        lista.push(m);
        resultado.musicasAdicionadas++;
      } else {
        lista[idxPorId[m.id]] = { ...lista[idxPorId[m.id]], ...m };
        resultado.musicasAtualizadas++;
      }
    });
    salvarListaMusicas(lista);
  }
  if (Array.isArray(dados.favoritos)) {
    const lista = listarFavoritos();
    const existentes = new Set(lista.map(f => f.id));
    dados.favoritos.forEach(f => { if (!existentes.has(f.id)) { lista.push(f); resultado.favoritosAdicionados++; } });
    salvarListaFavoritos(lista);
  }

  return resultado;
}

function buscarMusica(id) {
  return listarMusicas().find(m => m.id === id) || null;
}

function salvarMusica(musica) {
  const lista = listarMusicas();
  const nova = {
    id: `musica_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    titulo: musica.titulo,
    artista: musica.artista,
    tom: musica.tom,
    cifraTexto: musica.cifraTexto,
    acordes: musica.acordes,
    genero: musica.genero || 'Outros',
    transposicao: 0,
    criadaEm: new Date().toISOString()
  };
  lista.push(nova);
  salvarListaMusicas(lista);
  return nova;
}

function atualizarMusica(id, dados) {
  const lista = listarMusicas();
  const idx = lista.findIndex(m => m.id === id);
  if (idx === -1) return null;
  lista[idx] = { ...lista[idx], ...dados };
  salvarListaMusicas(lista);
  return lista[idx];
}

function removerMusica(id) {
  salvarListaMusicas(listarMusicas().filter(m => m.id !== id));
}

// ─── Parser do texto colado ─────────────────────────────────────────────────────
// Tokens que aparecem em linhas de acordes mas não são acordes (parênteses, repetições, rótulos)
function isSectionToken(t) {
  return /^[()[\]]$/.test(t) ||       // parênteses/colchetes avulsos
         /^\(\d+x\)$/i.test(t) ||     // (2x), (3x) etc.
         /^[\w.]+:$/.test(t) ||       // Final:, Introd.: etc.
         /^\/+$/.test(t);             // / ou // marcador de compasso
}

// Marcador explícito de acorde promovido dentro de uma linha de letra (ex: "{Em}").
// Usado quando uma palavra é promovida a acorde numa linha que não é 100% de acordes,
// evitando depender de heurística de forma (que gera falsos positivos como "E" em "E eu sou...").
function _isMarkedChordToken(t) {
  return /^\{.+\}$/.test(t);
}
function _unwrapMarkedChord(t) {
  return t.slice(1, -1);
}

// Normaliza caracteres parecidos antes de validar (ex: º U+00BA → ° U+00B0)
function _normToken(t) {
  return t.replace(/º/g, '°');
}

// Filtro rígido de forma: garante que o token inteiro ($) é notação de acorde,
// evitando falsos positivos como "Everyone's" (E + lixo) ou "Between" (B + lixo).
// Só passa se o string completo for compatível com padrão de acorde.
const _CHORD_SHAPE_RE = /^[A-G](?:#|b)?(?:[°º]|(?:(?:maj|min|dim|aug|sus[24]?|m|M)\d{0,2}|\d{1,2}(?:maj|M)?))?(?:\+)?(?:\([^)]{1,12}\))?(?:\/(?:[A-G](?:#|b)?|\d+[-+]?))?(?:\([^)]{1,12}\))?(?:\+)?$/;

// Cache para evitar chamar calcularNotasAcorde repetidamente com o mesmo token
const _chordValidCache = new Map();

// Valida em dois passos: forma (regex) + teoria musical (calcularNotasAcorde).
// Preferível não identificar a identificar palavra normal como acorde.
function isValidChordToken(t) {
  const norm = _normToken(t);
  if (_chordValidCache.has(norm)) return _chordValidCache.get(norm);
  // 1. Forma estrita: token inteiro deve ser notação de acorde
  if (!_CHORD_SHAPE_RE.test(norm)) { _chordValidCache.set(norm, false); return false; }
  // 2. Teoria musical: parser valida se as notas fazem sentido
  try {
    calcularNotasAcorde(norm.replace(/\/.*$/, ''));
    _chordValidCache.set(norm, true);
    return true;
  } catch {
    _chordValidCache.set(norm, false);
    return false;
  }
}

function extrairAcordes(cifraTexto) {
  const vistos = new Set();
  const ordem = [];
  const adicionar = t => { if (!vistos.has(t)) { vistos.add(t); ordem.push(t); } };
  cifraTexto.split('\n').forEach(linhaRaw => {
    const linha = linhaRaw.replace(/^\s*\[[^\]]*\]\s*/, '');
    const tokens = linha.trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) return;

    // Tokens marcados ({Em}) são sempre acordes, independente do tipo de linha
    tokens.forEach(t => {
      if (_isMarkedChordToken(t)) {
        const inner = _unwrapMarkedChord(t);
        if (isValidChordToken(inner)) adicionar(inner);
      }
    });

    const chordTokens = tokens.filter(t => !isSectionToken(t) && !_isMarkedChordToken(t));
    if (!chordTokens.length) return;
    // Só considera acordes "soltos" quando a linha inteira é de acordes,
    // evitando falsos positivos como "E" em "E eu sou uma árvore bonita"
    const isLinhaDeAcordes = chordTokens.every(t => isValidChordToken(t));
    if (!isLinhaDeAcordes) return;
    chordTokens.forEach(adicionar);
  });
  return ordem;
}

function parseMusicaTexto(texto) {
  const linhas = texto.replace(/\r\n/g, '\n').split('\n');

  let i = 0;
  while (i < linhas.length && linhas[i].trim() === '') i++;
  const titulo = (linhas[i] || '').trim();
  i++;
  while (i < linhas.length && linhas[i].trim() === '') i++;
  const artistaLinha = (linhas[i] || '').trim();
  const artistaMatch = artistaLinha.match(/^\[([^\]]+)\]/);
  const artista = artistaMatch ? artistaMatch[1] : artistaLinha.replace(/^\[|\]$/g, '');

  let tom = '';
  const tomLinha = linhas.find(l => /Tom:/i.test(l));
  if (tomLinha) {
    const tm = tomLinha.match(/Tom:\s*\[([^\]]+)\]/i) || tomLinha.match(/Tom:\s*([^\s(]+)/i);
    if (tm) tom = tm[1];
  }

  let cifraTexto;
  const blockMatch = texto.match(/```([\s\S]*?)```/);
  if (blockMatch) {
    cifraTexto = blockMatch[1];
  } else {
    const tomIdx = linhas.findIndex(l => /Tom:/i.test(l));
    cifraTexto = tomIdx !== -1 ? linhas.slice(tomIdx + 1).join('\n') : linhas.slice(2).join('\n');
  }
  cifraTexto = cifraTexto.replace(/^\n+/, '').replace(/\n+$/, '');

  const acordes = extrairAcordes(cifraTexto);

  return { titulo, artista, tom, cifraTexto, acordes };
}

// ─── Divide um texto colado com VÁRIAS músicas em segmentos individuais ────────
// O CifraClub nem sempre vem com blocos ``` ``` (isso é só formatação de chat).
// O ponto fixo e confiável em todo cabeçalho de música é a linha "Tom: X" —
// usamos ela pra achar onde cada música começa (subindo até achar o título,
// pulando a linha "Cifra: ..." quando existir).
function linhaNaoVaziaAnterior(linhas, idx) {
  let i = idx - 1;
  while (i >= 0 && linhas[i].trim() === '') i--;
  return i;
}

function acharInicioCabecalho(linhas, tomIdx) {
  let i = linhaNaoVaziaAnterior(linhas, tomIdx);
  if (i >= 0 && /^\s*\[?Cifra:/i.test(linhas[i])) {
    i = linhaNaoVaziaAnterior(linhas, i);
  }
  if (i < 0) return 0;
  const tituloIdx = linhaNaoVaziaAnterior(linhas, i);
  return tituloIdx >= 0 ? tituloIdx : i;
}

function dividirMusicasTexto(textoCompleto) {
  const linhas = textoCompleto.replace(/\r\n/g, '\n').split('\n');
  const tomIdxs = [];
  linhas.forEach((l, i) => { if (/^\s*Tom:/i.test(l)) tomIdxs.push(i); });
  if (tomIdxs.length <= 1) return [textoCompleto];

  const inicios = [...new Set(tomIdxs.map(idx => acharInicioCabecalho(linhas, idx)))].sort((a, b) => a - b);

  const segmentos = [];
  for (let k = 0; k < inicios.length; k++) {
    const fim = k + 1 < inicios.length ? inicios[k + 1] : linhas.length;
    segmentos.push(linhas.slice(inicios[k], fim).join('\n'));
  }
  return segmentos;
}
