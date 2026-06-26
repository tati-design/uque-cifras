// ─── Gêneros disponíveis ────────────────────────────────────────────────────────
const GENEROS = [
  'MPB', 'Nova MPB', 'Sertanejo', 'Funk', 'Forró', 'Rock', 'Rap', 'Reggae',
  'Tradicional', 'Gospel', 'Instrumental', 'Samba', 'Pop', 'Internacional',
  'Axé', 'Black Music', 'Infantil', 'Favoritos'
];

const GENERO_ICONS = {
  'MPB': 'nature', 'Nova MPB': 'potted_plant', 'Sertanejo': 'landscape',
  'Funk': 'speaker', 'Forró': 'celebration', 'Rock': 'bolt', 'Rap': 'mic',
  'Reggae': 'wb_sunny', 'Tradicional': 'hourglass_empty', 'Gospel': 'church',
  'Instrumental': 'piano', 'Samba': 'sports_bar', 'Pop': 'star',
  'Internacional': 'language', 'Axé': 'whatshot', 'Black Music': 'album',
  'Infantil': 'child_care', 'Favoritos': 'kid_star',
};

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

function migrarGeneros() {
  const lista = listarMusicas();
  let alterado = false;
  lista.forEach(m => {
    if (!m.genero) {
      m.genero = obterGeneroCSV(m.titulo, m.artista) || 'Outros';
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
// Token de acorde válido: precisa "casar" inteiro (^...$) para não confundir
// palavras de letra de música (ex: "Can", "Do") com acordes de verdade.
const CHORD_TOKEN_RE = /^[A-G](?:#|b)?(?:(?:maj|min|dim|aug|sus[24]?|m|M)\d{0,2}|\d{1,2}(?:maj|M)?)?(?:\+)?(?:\([^)]{1,8}\))?(?:\/(?:[A-G](?:#|b)?|\d+))?(?:\+)?$/;

// Tokens que aparecem em linhas de acordes mas não são acordes (parênteses, repetições, rótulos)
function isSectionToken(t) {
  return /^[()[\]]$/.test(t) ||       // parênteses/colchetes avulsos
         /^\(\d+x\)$/i.test(t) ||     // (2x), (3x) etc.
         /^[\w.]+:$/.test(t);          // Final:, Introd.: etc.
}

function extrairAcordes(cifraTexto) {
  const vistos = new Set();
  const ordem = [];
  cifraTexto.split('\n').forEach(linhaRaw => {
    const linha = linhaRaw.replace(/^\s*\[[^\]]*\]\s*/, '');
    const tokens = linha.trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) return;
    const chordTokens = tokens.filter(t => !isSectionToken(t));
    if (!chordTokens.length) return;
    if (!chordTokens.every(t => CHORD_TOKEN_RE.test(t))) return;
    chordTokens.forEach(t => {
      if (!vistos.has(t)) { vistos.add(t); ordem.push(t); }
    });
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
