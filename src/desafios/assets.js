// Imagens do Buddy (frames do robô voando e expressões do mascote)
export const N_FRAMES = 23;
export const frameUrl = (i) => `/buddy/voando/f${String(i).padStart(2, '0')}.webp`;
export const EXPR = { normal: '/buddy/normal.webp', aberta: '/buddy/aberta.webp', feliz: '/buddy/feliz.webp' };

// carrega tudo antes de começar a animação; devolve o progresso de 0 a 1
export function preloadAll(onProgress) {
  const urls = [...Array.from({ length: N_FRAMES }, (_, i) => frameUrl(i + 1)), ...Object.values(EXPR)];
  let feitos = 0;
  return Promise.all(urls.map((u) => new Promise((res) => {
    const im = new Image();
    const fim = () => { feitos += 1; onProgress(feitos / urls.length); res(); };
    im.onload = fim; im.onerror = fim; im.src = u;
  })));
}

export const reduzMovimento = () =>
  typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
