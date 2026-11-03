import { useEffect, useMemo, useState } from 'react';
import { Moldura, Dica, FaseOk, Resultado, salvarEstrelas, aleatorio, semearFase } from './comum.jsx';

const FASES = [
  { n: 4, meta: false, txt: 'Poucas barras e sem limite de movimentos. Ordene da menor para a maior, trocando só barras vizinhas.' },
  { n: 5, meta: false, txt: 'Mais uma barra. Tente usar o menor número de trocas que conseguir.' },
  { n: 7, meta: true, txt: 'Agora há uma meta: o mínimo possível de trocas. Dá para chegar lá?' },
  { n: 9, meta: true, txt: 'Desafio final: nove barras e a meta do mínimo de trocas. Qual é a estratégia mais eficiente?' },
];

const inversoes = (a) => { let c = 0; for (let x = 0; x < a.length; x++) for (let y = x + 1; y < a.length; y++) if (a[x] > a[y]) c++; return c; };
const ordenado = (a) => a.every((v, k) => v === k + 1);

function embaralhar(n, fase) {
  semearFase('fila', fase);
  const minimo = Math.ceil((n * (n - 1)) / 4);
  for (;;) {
    const a = Array.from({ length: n }, (_, k) => k + 1);
    for (let k = n - 1; k > 0; k--) { const j = Math.floor(aleatorio() * (k + 1)); [a[k], a[j]] = [a[j], a[k]]; }
    if (!ordenado(a) && inversoes(a) >= minimo) return a;
  }
}

// ---- os dois algoritmos clássicos, para comparar ----
function bubble(inicial) {
  const a = [...inicial]; const passos = [{ arr: [...a], i: -1, j: -1 }]; let comp = 0; let trocas = 0;
  for (let p = 0; p < a.length - 1; p++) {
    let trocou = false;
    for (let k = 0; k < a.length - 1 - p; k++) {
      comp++;
      if (a[k] > a[k + 1]) { [a[k], a[k + 1]] = [a[k + 1], a[k]]; trocas++; trocou = true; passos.push({ arr: [...a], i: k, j: k + 1 }); }
    }
    if (!trocou) break;
  }
  return { passos, comp, trocas };
}
function selection(inicial) {
  const a = [...inicial]; const passos = [{ arr: [...a], i: -1, j: -1 }]; let comp = 0; let trocas = 0;
  for (let p = 0; p < a.length - 1; p++) {
    let m = p;
    for (let k = p + 1; k < a.length; k++) { comp++; if (a[k] < a[m]) m = k; }
    if (m !== p) { [a[p], a[m]] = [a[m], a[p]]; trocas++; passos.push({ arr: [...a], i: p, j: m }); }
  }
  return { passos, comp, trocas };
}

const corBarra = (v, n) => `hsl(${210 - ((v - 1) / Math.max(1, n - 1)) * 180} 90% 56%)`;
const altura = (v, n) => 18 + ((v - 1) / Math.max(1, n - 1)) * 82;

function Replay({ nome, res }) {
  const [k, setK] = useState(0);
  const [tocando, setTocando] = useState(false);
  const ultimo = res.passos.length - 1;
  useEffect(() => {
    if (!tocando) return undefined;
    if (k >= ultimo) { setTocando(false); return undefined; }
    const id = setTimeout(() => setK((x) => x + 1), 650);
    return () => clearTimeout(id);
  }, [tocando, k, ultimo]);
  const p = res.passos[k]; const n = p.arr.length;
  return (
    <div className="replay">
      <div className="replay-h">
        <b>{nome}</b>
        <span>{res.trocas} {res.trocas === 1 ? 'troca' : 'trocas'} · {res.comp} comparações</span>
      </div>
      <div className="minibarras" aria-hidden="true">
        {p.arr.map((v, idx) => (
          <i key={v} className={idx === p.i || idx === p.j ? 'hl' : ''} style={{ left: (idx * 100) / n + '%', width: 100 / n + '%', height: altura(v, n) + '%', '--c': corBarra(v, n) }} />
        ))}
      </div>
      <div className="replay-b">
        <button type="button" className="btn ghost sm" onClick={() => { if (k >= ultimo) setK(0); setTocando((t) => !t); }}>{tocando ? 'Pausar' : k >= ultimo ? 'Rever' : 'Ver passo a passo'}</button>
        <small>{k === 0 ? 'Posição inicial' : `Troca ${k} de ${ultimo}`}</small>
      </div>
    </div>
  );
}

const CONCEITO = {
  nome: 'Algoritmos de ordenação',
  paragrafos: [
    'Ordenar é comparar elementos e trocá-los de posição até tudo ficar no lugar. Cada troca de vizinhos que você fez corrige exatamente uma "inversão" (um par fora de ordem), então o mínimo de trocas é igual ao número de inversões.',
    'O Bubble Sort faz justamente isso: percorre a fila trocando vizinhos fora de ordem, e por isso ele nunca passa do mínimo de trocas, mas faz muitas comparações. O Selection Sort faz o contrário: procura o menor elemento e o leva direto para a posição certa, com poucas trocas, mas também muitas comparações. Para listas grandes existem algoritmos bem mais rápidos, como o Merge Sort e o Quick Sort.',
  ],
  codigo: 'def bubble_sort(v):\n    for i in range(len(v) - 1):\n        for j in range(len(v) - 1 - i):\n            if v[j] > v[j + 1]:\n                v[j], v[j + 1] = v[j + 1], v[j]',
};

export default function Fila({ onSair }) {
  const [i, setI] = useState(0);
  const [arr, setArr] = useState(() => embaralhar(FASES[0].n, 0));
  const [ini, setIni] = useState(arr);
  const [sel, setSel] = useState(null);
  const [moves, setMoves] = useState(0);
  const [hist, setHist] = useState([]);
  const [dica, setDica] = useState(false);
  const [ok, setOk] = useState(false);
  const [estr, setEstr] = useState(3);
  const [pts, setPts] = useState(0);
  const [tot, setTot] = useState(0);
  const [fim, setFim] = useState(false);

  const fase = FASES[i];
  const n = fase.n;
  const minimo = useMemo(() => inversoes(ini), [ini]);
  const par = arr.findIndex((v, k) => k < n - 1 && v > arr[k + 1]); // próxima troca útil

  function trocar(a, b) {
    if (ok) return;
    const novo = [...arr];
    [novo[a], novo[b]] = [novo[b], novo[a]];
    const m = moves + 1;
    setHist((h) => [...h, arr]); setArr(novo); setMoves(m); setSel(b);
    if (ordenado(novo)) {
      const base = m <= minimo ? 3 : m <= Math.ceil(minimo * 1.4) ? 2 : 1;
      const e = Math.max(1, base - (dica ? 1 : 0));
      setEstr(e); setOk(true); setSel(null);
      salvarEstrelas('fila', i, e);
      setPts((p) => p + e * 100); setTot((t) => t + e);
    }
  }
  function clicar(idx) {
    if (ok) return;
    if (sel === null) setSel(idx);
    else if (idx === sel) setSel(null);
    else if (Math.abs(idx - sel) === 1) trocar(sel, idx);
    else setSel(idx);
  }

  useEffect(() => {
    const tecla = (e) => {
      if (ok || sel === null) return;
      if (e.key === 'ArrowLeft' && sel > 0) { e.preventDefault(); trocar(sel, sel - 1); }
      else if (e.key === 'ArrowRight' && sel < n - 1) { e.preventDefault(); trocar(sel, sel + 1); }
      else if (e.key === 'Escape') setSel(null);
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  });

  function desfazer() {
    if (!hist.length || ok) return;
    setArr(hist[hist.length - 1]); setHist((h) => h.slice(0, -1)); setMoves((m) => Math.max(0, m - 1)); setSel(null);
  }
  function novaFase(idx) {
    const a = embaralhar(FASES[idx].n, idx);
    setArr(a); setIni(a); setSel(null); setMoves(0); setHist([]); setDica(false); setOk(false);
  }
  function recomecar() { setArr(ini); setSel(null); setMoves(0); setHist([]); }
  function proxima() {
    if (i === FASES.length - 1) { setFim(true); return; }
    setI(i + 1); novaFase(i + 1);
  }
  function reiniciar() { setI(0); setPts(0); setTot(0); setFim(false); novaFase(0); }

  const bolha = useMemo(() => bubble(ini), [ini]);
  const selecao = useMemo(() => selection(ini), [ini]);

  return (
    <Moldura titulo="Ordene a Fila" conceito="Algoritmos de ordenação" fase={fim ? FASES.length : i} total={FASES.length} pontos={pts} onSair={onSair}>
      {fim ? (
        <Resultado pontos={pts} estrelas={tot} max={FASES.length * 3} conceito={CONCEITO} onRepetir={reiniciar} onSair={onSair} />
      ) : (
        <div className="jg-corpo">
          <p className="enun">{fase.txt}</p>

          <div className="placar">
            <span>Trocas: <b>{moves}</b></span>
            {fase.meta ? <span>Meta (mínimo): <b>{minimo}</b></span> : <span>Sem limite de trocas</span>}
          </div>

          <div className="barras" role="group" aria-label="Barras para ordenar" style={{ '--n': n }}>
            {arr.map((v, idx) => (
              <button
                key={v} type="button"
                className={'barra' + (sel === idx ? ' sel' : '') + (dica && !ok && (idx === par || idx === par + 1) ? ' dica' : '')}
                style={{ left: (idx * 100) / n + '%', width: 100 / n + '%', height: altura(v, n) + '%', '--c': corBarra(v, n) }}
                onClick={() => clicar(idx)}
                aria-label={`Barra de valor ${v}, posição ${idx + 1}${sel === idx ? ', selecionada' : ''}`}
                aria-pressed={sel === idx}
              >
                <span>{v}</span>
              </button>
            ))}
          </div>
          <p className="ajuda">Toque numa barra e depois numa vizinha para trocá-las. No teclado: selecione e use as setas ← →.</p>

          {!ok && (
            <>
              <div className="acoes">
                <button type="button" className="btn ghost sm" onClick={desfazer} disabled={!hist.length}>Desfazer</button>
                <button type="button" className="btn ghost sm" onClick={recomecar} disabled={!moves}>Recomeçar</button>
              </div>
              <Dica texto="as barras destacadas estão fora de ordem. Trocá-las já corrige um par e nunca é desperdício." usada={dica} onUsar={() => setDica(true)} />
            </>
          )}

          {ok && (
            <FaseOk estrelas={estr} pontos={estr * 100} ultima={i === FASES.length - 1} onProxima={proxima}
              titulo={moves <= minimo ? 'Perfeito! Trocas mínimas!' : 'Fila ordenada!'}>
              <span className="tag2">COMO OS ALGORITMOS RESOLVERIAM</span>
              <p>Você usou <b>{moves}</b> {moves === 1 ? 'troca' : 'trocas'} de vizinhos. O mínimo possível era <b>{minimo}</b>.</p>
              <Replay nome="Bubble Sort" res={bolha} />
              <Replay nome="Selection Sort" res={selecao} />
              <p className="nota">O Bubble Sort só troca vizinhos, como você. O Selection Sort pode trocar barras distantes, por isso faz menos trocas, mas compara bastante.</p>
            </FaseOk>
          )}
        </div>
      )}
    </Moldura>
  );
}
