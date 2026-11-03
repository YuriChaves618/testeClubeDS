import { useMemo, useState } from 'react';
import { Moldura, Dica, FaseOk, Resultado, salvarEstrelas, aleatorio, semearFase } from './comum.jsx';

const VIZ = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];

const FASES = [
  { n: 3, k: 2, txt: 'Clicar numa lâmpada inverte ela e as vizinhas (cima, baixo, esquerda e direita). Apague todas!' },
  { n: 3, k: 4, txt: 'Mesma grade, configuração um pouco mais embaralhada. Pense no efeito de cada clique antes de fazê-lo.' },
  { n: 4, k: 4, txt: 'A grade cresceu para 4x4. Cada clique agora mexe com mais coisas em cadeia.' },
  { n: 5, k: 3, txt: 'Grade 5x5! Tente planejar vários cliques à frente.' },
  { n: 5, k: 6, txt: 'Desafio final: 5x5 bem embaralhada. Uma pista: a ordem dos cliques não importa.' },
];

function apertar(luzes, n, idx) {
  const r = Math.floor(idx / n); const c = idx % n;
  const novo = [...luzes];
  VIZ.forEach(([dr, dc]) => {
    const rr = r + dr; const cc = c + dc;
    if (rr >= 0 && rr < n && cc >= 0 && cc < n) novo[rr * n + cc] = !novo[rr * n + cc];
  });
  return novo;
}

// Resolve o jogo por eliminação em GF(2) e devolve o menor conjunto de cliques (ou null)
function resolver(n, luzes) {
  const N = n * n;
  const A = Array.from({ length: N }, () => new Array(N + 1).fill(0));
  for (let j = 0; j < N; j++) {
    const r = Math.floor(j / n); const c = j % n;
    VIZ.forEach(([dr, dc]) => {
      const rr = r + dr; const cc = c + dc;
      if (rr >= 0 && rr < n && cc >= 0 && cc < n) A[rr * n + cc][j] = 1;
    });
  }
  for (let i = 0; i < N; i++) A[i][N] = luzes[i] ? 1 : 0;
  const piv = []; let lin = 0;
  for (let col = 0; col < N && lin < N; col++) {
    let p = -1;
    for (let i = lin; i < N; i++) if (A[i][col]) { p = i; break; }
    if (p < 0) continue;
    [A[lin], A[p]] = [A[p], A[lin]];
    for (let i = 0; i < N; i++) if (i !== lin && A[i][col]) for (let k = col; k <= N; k++) A[i][k] ^= A[lin][k];
    piv.push(col); lin++;
  }
  for (let i = lin; i < N; i++) if (A[i][N]) return null;
  const livres = []; for (let c = 0; c < N; c++) if (!piv.includes(c)) livres.push(c);
  const x0 = new Array(N).fill(0); piv.forEach((pc, k) => { x0[pc] = A[k][N]; });
  const nulos = livres.map((f) => { const v = new Array(N).fill(0); v[f] = 1; piv.forEach((pc, k) => { v[pc] = A[k][f]; }); return v; });
  let melhor = null;
  for (let m = 0; m < (1 << nulos.length); m++) {
    const x = [...x0];
    nulos.forEach((v, k) => { if (m & (1 << k)) for (let i = 0; i < N; i++) x[i] ^= v[i]; });
    const cl = []; x.forEach((b, i) => { if (b) cl.push(i); });
    if (!melhor || cl.length < melhor.length) melhor = cl;
  }
  return melhor;
}

function gerar(n, k, fase) {
  semearFase('luzes', fase);
  for (;;) {
    let luzes = new Array(n * n).fill(false);
    // Fisher-Yates (o sort com comparador aleatório não é igual em todos os navegadores)
    const todas = Array.from({ length: n * n }, (_, i) => i);
    for (let a = todas.length - 1; a > 0; a--) { const b = Math.floor(aleatorio() * (a + 1)); [todas[a], todas[b]] = [todas[b], todas[a]]; }
    const idx = todas.slice(0, k);
    idx.forEach((i) => { luzes = apertar(luzes, n, i); });
    if (!luzes.some(Boolean)) continue;
    const sol = resolver(n, luzes);
    if (sol && sol.length >= 2) return { luzes, par: sol.length };
  }
}

const CONCEITO = {
  nome: 'Planejamento e efeitos em cadeia',
  paragrafos: [
    'Cada clique muda o estado de várias lâmpadas ao mesmo tempo. Resolver o jogo é raciocinar sobre estados: decompor o problema, prever as consequências de cada ação e planejar vários passos antes de agir.',
    'O truque dos programadores: clicar duas vezes na mesma lâmpada desfaz tudo, então a ordem dos cliques não importa. Só importa a paridade de cada um (par = nenhum efeito, ímpar = inverte). Essa ideia vira uma operação XOR, e permite resolver o jogo com álgebra, exatamente como o programa que calcula as dicas deste jogo.',
  ],
  codigo: 'def apertar(luzes, n, r, c):\n    for dr, dc in [(0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)]:\n        rr, cc = r + dr, c + dc\n        if 0 <= rr < n and 0 <= cc < n:\n            luzes[rr][cc] ^= 1   # XOR: inverte o estado',
};

function Grade({ n, luzes, marcas = [], onClick, dica = -1, mini = false }) {
  return (
    <div className={'lampadas' + (mini ? ' mini2' : '')} style={{ '--n': n }} role="group" aria-label="Grade de lâmpadas">
      {luzes.map((on, i) => (
        <button
          key={i} type="button" disabled={!onClick}
          className={'lampada' + (on ? ' on' : '') + (dica === i ? ' dica' : '') + (marcas.includes(i) ? ' marca' : '')}
          onClick={onClick ? () => onClick(i) : undefined}
          aria-label={`Lâmpada linha ${Math.floor(i / n) + 1}, coluna ${(i % n) + 1}, ${on ? 'acesa' : 'apagada'}`}
        />
      ))}
    </div>
  );
}

export default function Luzes({ onSair }) {
  const [i, setI] = useState(0);
  const [jogo, setJogo] = useState(() => gerar(FASES[0].n, FASES[0].k, 0));
  const [luzes, setLuzes] = useState(jogo.luzes);
  const [moves, setMoves] = useState(0);
  const [dica, setDica] = useState(false);
  const [ok, setOk] = useState(false);
  const [estr, setEstr] = useState(3);
  const [pts, setPts] = useState(0);
  const [tot, setTot] = useState(0);
  const [fim, setFim] = useState(false);

  const fase = FASES[i]; const n = fase.n;
  const celulaDica = useMemo(() => {
    if (!dica || ok) return -1;
    const s = resolver(n, luzes);
    return s && s.length ? s[0] : -1;
  }, [dica, ok, luzes, n]);
  const solucao = useMemo(() => (ok ? resolver(n, jogo.luzes) || [] : []), [ok, n, jogo]);

  function clicar(idx) {
    if (ok) return;
    const novo = apertar(luzes, n, idx); const m = moves + 1;
    setLuzes(novo); setMoves(m);
    if (!novo.some(Boolean)) {
      const base = m <= jogo.par ? 3 : m <= jogo.par + 2 ? 2 : 1;
      const e = Math.max(1, base - (dica ? 1 : 0));
      setEstr(e); setOk(true); salvarEstrelas('luzes', i, e);
      setPts((p) => p + e * 100); setTot((t) => t + e);
    }
  }
  function nova(idx) {
    const j = gerar(FASES[idx].n, FASES[idx].k, idx);
    setJogo(j); setLuzes(j.luzes); setMoves(0); setDica(false); setOk(false);
  }
  const proxima = () => { if (i === FASES.length - 1) setFim(true); else { setI(i + 1); nova(i + 1); } };
  const reiniciar = () => { setI(0); setPts(0); setTot(0); setFim(false); nova(0); };
  const acesas = luzes.filter(Boolean).length;

  return (
    <Moldura titulo="Lâmpadas Apagadas" conceito="Planejamento e efeitos em cadeia" fase={fim ? FASES.length : i} total={FASES.length} pontos={pts} onSair={onSair}>
      {fim ? (
        <Resultado pontos={pts} estrelas={tot} max={FASES.length * 3} conceito={CONCEITO} onRepetir={reiniciar} onSair={onSair} />
      ) : (
        <div className="jg-corpo">
          <p className="enun">{fase.txt}</p>
          <div className="placar">
            <span>Cliques: <b>{moves}</b></span>
            <span>Acesas: <b>{acesas}</b></span>
            <span>Meta (mínimo): <b>{jogo.par}</b></span>
          </div>
          <Grade n={n} luzes={luzes} onClick={ok ? null : clicar} dica={celulaDica} />
          {!ok && (
            <>
              <div className="acoes"><button type="button" className="btn ghost sm" onClick={() => { setLuzes(jogo.luzes); setMoves(0); }} disabled={!moves}>Recomeçar</button></div>
              <Dica texto="a lâmpada destacada faz parte de uma das melhores sequências de cliques para o estado atual." usada={dica} onUsar={() => setDica(true)} />
            </>
          )}
          {ok && (
            <FaseOk estrelas={estr} pontos={estr * 100} ultima={i === FASES.length - 1} onProxima={proxima} titulo={moves <= jogo.par ? 'Perfeito! Menor caminho!' : 'Tudo apagado!'}>
              <span className="tag2">A SOLUÇÃO MAIS CURTA</span>
              <p>Você usou <b>{moves}</b> {moves === 1 ? 'clique' : 'cliques'}. O mínimo era <b>{jogo.par}</b>. Veja, no estado inicial, as lâmpadas que bastava clicar (marcadas com ponto):</p>
              <Grade n={n} luzes={jogo.luzes} marcas={solucao} mini />
              <p className="nota">Clicar duas vezes na mesma lâmpada se anula. Por isso a ordem dos cliques não importa: só importa se cada lâmpada foi clicada um número par ou ímpar de vezes.</p>
            </FaseOk>
          )}
        </div>
      )}
    </Moldura>
  );
}
