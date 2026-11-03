import { useEffect, useState } from 'react';
import { Moldura, Dica, FaseOk, Resultado, salvarEstrelas } from './comum.jsx';

const FASES = [
  { n: 3, txt: 'Mova a torre inteira do pino 1 para o pino 3. Só um disco por vez, e nunca um disco maior sobre um menor. Comece com 3 discos e aprenda por tentativa e erro.' },
  { n: 4, txt: 'Quatro discos. Será que existe um padrão que sempre funciona?' },
  { n: 5, txt: 'Cinco discos, e a meta é o número mínimo de movimentos (2ⁿ − 1).' },
  { n: 6, txt: 'Desafio final: seis discos. O mínimo é 63 movimentos. Dá para resolver sem errar nenhum?' },
];

const inicial = (n) => [Array.from({ length: n }, (_, k) => n - k), [], []];
const NOMES = ['1', '2', '3'];

// próximo movimento da solução ótima a partir de qualquer estado
function proximo(pegs, n) {
  const pos = {};
  pegs.forEach((p, i) => p.forEach((d) => { pos[d] = i; }));
  const rec = (m, alvo) => {
    for (let d = m; d >= 1; d--) {
      if (pos[d] === alvo) continue;
      const aux = 3 - pos[d] - alvo;
      let todos = true;
      for (let k = 1; k < d; k++) if (pos[k] !== aux) todos = false;
      if (todos) return { d, de: pos[d], para: alvo };
      return rec(d - 1, aux);
    }
    return null;
  };
  return rec(n, 2);
}

const CONCEITO = {
  nome: 'Recursão e decomposição de problemas',
  paragrafos: [
    'Para mover n discos, basta saber mover n − 1: leve os n − 1 discos menores para o pino auxiliar, mova o disco maior para o destino e leve os n − 1 discos de volta por cima dele. Resolver um problema grande resolvendo versões menores dele mesmo é a ideia central da recursão.',
    'Essa estrutura dá a fórmula do mínimo: T(n) = 2·T(n − 1) + 1 = 2ⁿ − 1. Cada disco a mais dobra o trabalho (3 discos: 7 movimentos; 6 discos: 63; 20 discos: mais de 1 milhão). Por isso, entender o padrão vale mais do que tentar no braço.',
  ],
  codigo: 'def hanoi(n, origem, destino, auxiliar):\n    if n == 0:\n        return\n    hanoi(n - 1, origem, auxiliar, destino)\n    print(f"mova o disco {n}: {origem} -> {destino}")\n    hanoi(n - 1, auxiliar, destino, origem)\n\nhanoi(3, "1", "3", "2")   # 7 movimentos',
};

export default function Hanoi({ onSair }) {
  const [i, setI] = useState(0);
  const [pegs, setPegs] = useState(() => inicial(FASES[0].n));
  const [sel, setSel] = useState(null);
  const [moves, setMoves] = useState(0);
  const [hist, setHist] = useState([]);
  const [msg, setMsg] = useState('');
  const [dica, setDica] = useState(false);
  const [ok, setOk] = useState(false);
  const [estr, setEstr] = useState(3);
  const [pts, setPts] = useState(0);
  const [tot, setTot] = useState(0);
  const [fim, setFim] = useState(false);

  const n = FASES[i].n; const minimo = 2 ** n - 1;

  function clicar(p) {
    if (ok) return;
    if (sel === null) {
      if (!pegs[p].length) { setMsg('Esse pino está vazio. Escolha um pino com discos.'); return; }
      setSel(p); setMsg(''); return;
    }
    if (p === sel) { setSel(null); return; }
    const disco = pegs[sel][pegs[sel].length - 1];
    const topo = pegs[p][pegs[p].length - 1];
    if (topo !== undefined && topo < disco) { setMsg('Não pode! Um disco maior nunca fica sobre um menor.'); setSel(null); return; }
    const novo = pegs.map((x) => [...x]);
    novo[sel].pop(); novo[p].push(disco);
    const m = moves + 1;
    setHist((h) => [...h, pegs]); setPegs(novo); setMoves(m); setSel(null); setMsg('');
    if (novo[2].length === n) {
      const base = m <= minimo ? 3 : m <= Math.ceil(minimo * 1.5) ? 2 : 1;
      const e = Math.max(1, base - (dica ? 1 : 0));
      setEstr(e); setOk(true); salvarEstrelas('hanoi', i, e);
      setPts((x) => x + e * 100); setTot((t) => t + e);
    }
  }

  useEffect(() => {
    const tecla = (e) => { if (['1', '2', '3'].includes(e.key) && !['INPUT', 'SELECT'].includes(e.target.tagName)) clicar(Number(e.key) - 1); };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  });

  function nova(idx) { setPegs(inicial(FASES[idx].n)); setSel(null); setMoves(0); setHist([]); setMsg(''); setDica(false); setOk(false); }
  const desfazer = () => { if (!hist.length || ok) return; setPegs(hist[hist.length - 1]); setHist((h) => h.slice(0, -1)); setMoves((m) => Math.max(0, m - 1)); setSel(null); setMsg(''); };
  const proxima = () => { if (i === FASES.length - 1) setFim(true); else { setI(i + 1); nova(i + 1); } };
  const reiniciar = () => { setI(0); setPts(0); setTot(0); setFim(false); nova(0); };

  const mv = !ok && dica ? proximo(pegs, n) : null;
  const cor = (d) => `hsl(${210 - ((d - 1) / Math.max(1, n - 1)) * 180} 90% 56%)`;

  return (
    <Moldura titulo="Torre de Hanói" conceito="Recursão e decomposição de problemas" fase={fim ? FASES.length : i} total={FASES.length} pontos={pts} onSair={onSair}>
      {fim ? (
        <Resultado pontos={pts} estrelas={tot} max={FASES.length * 3} conceito={CONCEITO} onRepetir={reiniciar} onSair={onSair} />
      ) : (
        <div className="jg-corpo">
          <p className="enun">{FASES[i].txt}</p>
          <div className="placar">
            <span>Movimentos: <b>{moves}</b></span>
            <span>Mínimo possível: <b>{minimo}</b> <small>(2^{n} − 1)</small></span>
          </div>

          <div className="torre" role="group" aria-label="Três pinos">
            {pegs.map((p, k) => (
              <button
                key={k} type="button"
                className={'pino' + (sel === k ? ' sel' : '') + (mv && (mv.de === k || mv.para === k) ? ' dica' : '')}
                onClick={() => clicar(k)}
                aria-label={`Pino ${NOMES[k]}, ${p.length} ${p.length === 1 ? 'disco' : 'discos'}${k === 2 ? ', destino' : ''}${sel === k ? ', selecionado' : ''}`}
              >
                <div className="haste" />
                <div className="discos">
                  {p.map((d, idx) => (
                    <i key={d} className={sel === k && idx === p.length - 1 ? 'topo' : ''} style={{ width: 26 + (d / n) * 70 + '%', '--c': cor(d) }}>{d}</i>
                  ))}
                </div>
                <span className="rot">{NOMES[k]}{k === 2 ? ' · destino' : ''}</span>
              </button>
            ))}
          </div>
          <p className="ajuda">Toque num pino para pegar o disco do topo e depois no pino de destino. No teclado, use as teclas 1, 2 e 3.</p>
          <div className="msgs" aria-live="polite">{msg && <p className="erro">{msg}</p>}</div>

          {!ok && (
            <>
              <div className="acoes">
                <button type="button" className="btn ghost sm" onClick={desfazer} disabled={!hist.length}>Desfazer</button>
                <button type="button" className="btn ghost sm" onClick={() => nova(i)} disabled={!moves}>Recomeçar</button>
              </div>
              <Dica texto={mv ? `mova o disco ${mv.d} do pino ${NOMES[mv.de]} para o pino ${NOMES[mv.para]}. (A dica se atualiza a cada jogada.)` : 'a torre já está montada.'} usada={dica} onUsar={() => setDica(true)} />
            </>
          )}

          {ok && (
            <FaseOk estrelas={estr} pontos={estr * 100} ultima={i === FASES.length - 1} onProxima={proxima} titulo={moves <= minimo ? 'Perfeito! Movimentos mínimos!' : 'Torre transferida!'}>
              <span className="tag2">A RECURSÃO ESCONDIDA</span>
              <p>Você usou <b>{moves}</b> movimentos. O mínimo para {n} discos é 2^{n} − 1 = <b>{minimo}</b>.</p>
              <p>O segredo: para mover {n} discos, mova os {n - 1} menores para o pino auxiliar, mova o disco {n} para o destino e traga os {n - 1} menores para cima dele. Cada um desses passos é o mesmo problema, só que menor.</p>
            </FaseOk>
          )}
        </div>
      )}
    </Moldura>
  );
}
