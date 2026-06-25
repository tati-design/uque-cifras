// ─── Constants ───────────────────────────────────────────────────────────────
const CORDAS = ["G", "C", "E", "A"];
const NOTAS = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const CORDA_SOLTA = {G:7, C:0, E:4, A:9}; // index in NOTAS
const MAX_CASA = 5;
const MAX_SPAN = 4;
const ENARMONICOS = {
  Db:"C#", Eb:"D#", Fb:"E", Gb:"F#",
  Ab:"G#", Bb:"A#", Cb:"B", "E#":"F", "B#":"C"
};

function normalizar(nota) {
  nota = nota.trim();
  if (ENARMONICOS[nota]) return ENARMONICOS[nota];
  if (!NOTAS.includes(nota)) throw new Error(`Nota inválida: '${nota}'`);
  return nota;
}

function notaNaCasa(corda, casa) {
  return NOTAS[(CORDA_SOLTA[corda] + casa) % 12];
}

// ─── Transposição ────────────────────────────────────────────────────────────
// Desloca toda nota musical (raiz e baixo, ex: "Dm7/F#") em N semitons,
// preservando sufixos (m, maj7, sus4, (9) etc.) intocados.
function transporAcorde(nomeAcorde, semitons) {
  if (!semitons || !nomeAcorde) return nomeAcorde;
  return nomeAcorde.replace(/[A-G][b#]?/g, m => {
    const norm = ENARMONICOS[m] || m;
    if (!NOTAS.includes(norm)) return m;
    const idx = NOTAS.indexOf(norm);
    return NOTAS[(idx + semitons + 1200) % 12];
  });
}

function obterRaizNota(texto) {
  const m = (texto || '').match(/^([A-G][b#]?)/);
  if (!m) return null;
  return ENARMONICOS[m[1]] || m[1];
}
