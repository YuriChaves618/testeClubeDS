// Trilha sonora dos desafios: som de abertura (tela de carregamento) e tema em loop.
// Os navegadores bloqueiam som automático em páginas recém-abertas; se isso acontecer,
// o som começa no primeiro toque, clique ou tecla do usuário.
const FAIXAS = {
  abertura: { src: '/audio/carregamento.mp3', loop: false, vol: 0.7 },
  tema: { src: '/audio/tema.mp3', loop: true, vol: 0.45 },
};
const CHAVE_MUDO = 'clubeds:desafios:mudo';

const els = {};
let atual = null; // 'abertura' | 'tema' | null
let mudo = false;
try { mudo = localStorage.getItem(CHAVE_MUDO) === '1'; } catch { /* ignora */ }
const ouvintes = new Set();
let bloqueado = false;
const avisos = new Set();
const setBloqueado = (v) => { bloqueado = v; avisos.forEach((f) => f(v)); };
export const somBloqueado = () => bloqueado;
export function aoMudarBloqueio(f) { avisos.add(f); return () => avisos.delete(f); }

function el(nome) {
  if (!els[nome]) {
    const a = new Audio(FAIXAS[nome].src);
    a.loop = FAIXAS[nome].loop;
    a.preload = 'auto';
    els[nome] = a;
  }
  return els[nome];
}

function tentar(nome) {
  const a = el(nome);
  a.muted = mudo;
  a.volume = FAIXAS[nome].vol;
  const p = a.play();
  if (p && p.then) p.then(() => setBloqueado(false));
  if (p && p.catch) {
    p.catch(() => {
      setBloqueado(true);
      // bloqueado pelo navegador: tenta de novo no primeiro gesto do usuário
      const retomar = () => {
        ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => window.removeEventListener(ev, retomar, true));
        if (atual === nome) { a.play().then(() => setBloqueado(false)).catch(() => {}); }
      };
      ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => window.addEventListener(ev, retomar, true));
    });
  }
}

function sumir(a, ms = 500) {
  const v0 = a.volume; const passos = 10; let k = 0;
  const id = setInterval(() => {
    k += 1; a.volume = Math.max(0, v0 * (1 - k / passos));
    if (k >= passos) { clearInterval(id); a.pause(); a.currentTime = 0; }
  }, ms / passos);
}

export function tocarAbertura() {
  if (atual === 'abertura') return;
  atual = 'abertura';
  const a = el('abertura'); a.currentTime = 0; tentar('abertura');
}

export function tocarTema() {
  if (atual === 'tema') return;
  if (els.abertura && !els.abertura.paused) sumir(els.abertura);
  atual = 'tema';
  tentar('tema');
}

export function pararTudo() {
  atual = null; bloqueado = false;
  Object.values(els).forEach((a) => { a.pause(); a.currentTime = 0; });
}

export const estaMudo = () => mudo;
export function alternarMudo() {
  mudo = !mudo;
  try { localStorage.setItem(CHAVE_MUDO, mudo ? '1' : '0'); } catch { /* ignora */ }
  Object.values(els).forEach((a) => { a.muted = mudo; });
  ouvintes.forEach((f) => f(mudo));
  return mudo;
}
export function aoMudarMudo(f) { ouvintes.add(f); return () => ouvintes.delete(f); }
