// ─── Integração com Google Drive (login + upload/download do backup único) ─────
// Escopo drive.file: o app só enxerga/gerencia arquivos que ele mesmo cria.
const DRIVE_CLIENT_ID = '153476715229-5uc2gpghl9vsrcdhsinv4pg82kj23tc7.apps.googleusercontent.com';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const DRIVE_FOLDER_NOME = 'Uque backup';
const DRIVE_ARQUIVO_NOME = 'uque-backup.json';
const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';

let _driveAccessToken = null;
let _driveTokenExpiraEm = 0;

function _driveSolicitarToken(prompt, onSucesso, onErro) {
  if (typeof google === 'undefined' || !google.accounts?.oauth2) {
    alert('Não consegui carregar o login do Google. Verifique sua conexão e tente de novo.');
    onErro && onErro();
    return;
  }
  let respondido = false;
  const timeoutId = setTimeout(() => {
    if (respondido) return;
    respondido = true;
    alert('Não consegui abrir a janela de login do Google. Verifique se o navegador não bloqueou o pop-up e tente de novo.');
    onErro && onErro();
  }, 120000); // 2 min — dá tempo de ler o aviso de "app não verificado" e a tela de consentimento
  const tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: DRIVE_CLIENT_ID,
    scope: DRIVE_SCOPE,
    callback: (resp) => {
      if (respondido) return;
      respondido = true;
      clearTimeout(timeoutId);
      if (resp.error) { onErro && onErro(resp); return; }
      _driveAccessToken = resp.access_token;
      _driveTokenExpiraEm = Date.now() + (resp.expires_in * 1000);
      onSucesso();
    }
  });
  tokenClient.requestAccessToken({ prompt });
}

function driveConectar(onSucesso, onErro) {
  _driveSolicitarToken('consent', onSucesso, onErro);
}

function _driveComTokenValido(onPronto, onErro) {
  if (_driveAccessToken && Date.now() < _driveTokenExpiraEm) { onPronto(); return; }
  _driveSolicitarToken('', onPronto, onErro);
}

async function _driveFetch(url, opts = {}) {
  const resp = await fetch(url, { ...opts, headers: { Authorization: `Bearer ${_driveAccessToken}`, ...(opts.headers || {}) } });
  if (!resp.ok) throw new Error(`Drive API error: ${resp.status}`);
  return resp;
}

async function _driveObterOuCriarPasta() {
  const q = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${DRIVE_FOLDER_NOME}' and trashed=false`);
  const busca = await (await _driveFetch(`${DRIVE_API}/files?q=${q}&fields=files(id,name)`)).json();
  if (busca.files?.length) return busca.files[0].id;
  const criada = await (await _driveFetch(`${DRIVE_API}/files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: DRIVE_FOLDER_NOME, mimeType: 'application/vnd.google-apps.folder' })
  })).json();
  return criada.id;
}

async function _driveObterArquivo(pastaId) {
  const q = encodeURIComponent(`name='${DRIVE_ARQUIVO_NOME}' and '${pastaId}' in parents and trashed=false`);
  const busca = await (await _driveFetch(`${DRIVE_API}/files?q=${q}&fields=files(id,name)`)).json();
  return busca.files?.length ? busca.files[0].id : null;
}

function driveVerificarBackupExistente(onResultado, onErro) {
  _driveComTokenValido(async () => {
    try {
      const pastaId = await _driveObterOuCriarPasta();
      const arquivoId = await _driveObterArquivo(pastaId);
      onResultado(!!arquivoId);
    } catch (e) {
      onErro && onErro(e);
    }
  }, onErro);
}

function driveSubirBackup(onSucesso, onErro) {
  _driveComTokenValido(async () => {
    try {
      const pastaId = await _driveObterOuCriarPasta();
      const dados = { musicas: listarMusicas(), favoritos: listarFavoritos(), exportadoEm: new Date().toISOString() };
      const conteudo = JSON.stringify(dados, null, 2);
      const arquivoId = await _driveObterArquivo(pastaId);
      if (arquivoId) {
        await _driveFetch(`${DRIVE_UPLOAD_API}/files/${arquivoId}?uploadType=media`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: conteudo
        });
      } else {
        const boundary = 'uque_' + Date.now();
        const metadata = { name: DRIVE_ARQUIVO_NOME, parents: [pastaId] };
        const body =
          `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
          `--${boundary}\r\nContent-Type: application/json\r\n\r\n${conteudo}\r\n` +
          `--${boundary}--`;
        await _driveFetch(`${DRIVE_UPLOAD_API}/files?uploadType=multipart`, {
          method: 'POST',
          headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
          body
        });
      }
      onSucesso();
    } catch (e) {
      onErro && onErro(e);
    }
  }, onErro);
}

function driveBaixarBackup(onSucesso, onErro) {
  _driveComTokenValido(async () => {
    try {
      const pastaId = await _driveObterOuCriarPasta();
      const arquivoId = await _driveObterArquivo(pastaId);
      if (!arquivoId) { onSucesso(null); return; }
      const resp = await _driveFetch(`${DRIVE_API}/files/${arquivoId}?alt=media`);
      onSucesso(await resp.json());
    } catch (e) {
      onErro && onErro(e);
    }
  }, onErro);
}

function driveDesconectar() {
  if (_driveAccessToken && typeof google !== 'undefined' && google.accounts?.oauth2) {
    google.accounts.oauth2.revoke(_driveAccessToken, () => {});
  }
  _driveAccessToken = null;
  _driveTokenExpiraEm = 0;
}
