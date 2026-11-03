import { useState } from 'react';
import { Moldura, Dica, FaseOk, Resultado, estrelasPorPenalidade, salvarEstrelas } from './comum.jsx';

const combos = (n) => Array.from({ length: 2 ** n }, (_, k) => Array.from({ length: n }, (_, b) => (k >> (n - 1 - b)) & 1));
const B = (a, b) => ({ tipo: 'bin', a, b, ops: ['AND', 'OR'] });
const U = (a) => ({ tipo: 'un', a, ops: ['NOT', 'FIO'] });

const FASES = [
  { txt: 'A entrada A está ligada (1) e a B desligada (0). A lâmpada precisa ACENDER. Toque na porta para trocar entre AND ("e") e OR ("ou").',
    ent: ['A', 'B'], nos: { g1: B('A', 'B') }, saida: 'g1', casos: [[1, 0]], alvo: [1],
    dica: 'AND só liga quando as duas entradas estão ligadas. OR liga quando pelo menos uma está ligada.' },
  { txt: 'Agora com A desligada (0) e B ligada (1), a lâmpada precisa APAGAR.',
    ent: ['A', 'B'], nos: { g1: B('A', 'B') }, saida: 'g1', casos: [[0, 1]], alvo: [0],
    dica: 'Qual porta só liga quando as duas entradas estão ligadas?' },
  { txt: 'A porta NOT inverte o sinal: 0 vira 1 e 1 vira 0. Com A desligada (0), faça a lâmpada ACENDER. "FIO" deixa o sinal passar sem mudar.',
    ent: ['A'], nos: { u1: U('A') }, saida: 'u1', casos: [[0]], alvo: [1],
    dica: 'Se o sinal chega 0 e precisa sair 1, ele precisa ser invertido.' },
  { txt: 'Agora o circuito precisa funcionar para TODAS as combinações da tabela. A lâmpada acende somente quando A está ligada E B desligada. Toque nas linhas da tabela para ver cada caso.',
    ent: ['A', 'B'], nos: { u1: U('B'), g1: B('A', 'u1') }, saida: 'g1', f: (v) => v[0] && !v[1],
    dica: 'A porta final é AND. Falta inverter o B antes de entrar nela.' },
  { txt: 'Três entradas! A lâmpada acende quando A OU B estiver ligada, mas apenas se C estiver desligada.',
    ent: ['A', 'B', 'C'], nos: { g1: B('A', 'B'), u1: U('C'), g2: B('g1', 'u1') }, saida: 'g2', f: (v) => (v[0] || v[1]) && !v[2],
    dica: 'Escreva como expressão: (A or B) and not C. Cada parte vira uma porta.' },
  { txt: 'Um clássico, o "ou exclusivo": a lâmpada acende quando A e B são diferentes. Dica: é "pelo menos uma ligada, mas não as duas".',
    ent: ['A', 'B'], nos: { g1: B('A', 'B'), g2: B('A', 'B'), u1: U('g2'), g3: B('g1', 'u1') }, saida: 'g3', f: (v) => v[0] !== v[1],
    dica: '(A OR B) AND NOT (A AND B).' },
  { txt: 'Desafio final: "maioria". A lâmpada acende quando pelo menos duas das três entradas estiverem ligadas.',
    ent: ['A', 'B', 'C'], nos: { g1: B('A', 'B'), g2: B('A', 'B'), g3: B('C', 'g2'), g4: B('g1', 'g3') }, saida: 'g4', f: (v) => (v[0] + v[1] + v[2]) >= 2,
    dica: '(A AND B) OR (C AND (A OR B)).' },
].map((f) => {
  const casos = f.casos || combos(f.ent.length);
  return { ...f, casos, alvo: f.alvo || casos.map((c) => (f.f(c) ? 1 : 0)) };
});

const PY = { AND: 'and', OR: 'or' };
const JS = { AND: '&&', OR: '||' };

function camadas(f) {
  const c = Object.fromEntries(f.ent.map((e) => [e, 0]));
  const dig = (id) => {
    if (id in c) return c[id];
    const n = f.nos[id];
    c[id] = 1 + Math.max(dig(n.a), n.b ? dig(n.b) : 0);
    return c[id];
  };
  Object.keys(f.nos).forEach(dig);
  c.__lampada = c[f.saida] + 1;
  return c;
}

function avaliar(f, esc, caso) {
  const val = {};
  f.ent.forEach((nm, k) => { val[nm] = !!caso[k]; });
  const get = (id) => {
    if (id in val) return val[id];
    const n = f.nos[id]; const op = esc[id];
    const a = get(n.a); const b = n.b ? get(n.b) : true;
    if (!op || a === null || b === null) return null;
    val[id] = n.tipo === 'bin' ? (op === 'AND' ? a && b : a || b) : (op === 'NOT' ? !a : a);
    return val[id];
  };
  const todos = {};
  Object.keys(f.nos).forEach((id) => { todos[id] = get(id); });
  f.ent.forEach((nm) => { todos[nm] = val[nm]; });
  return { saida: get(f.saida), val: todos };
}

function expressao(f, esc, id, js) {
  if (f.ent.includes(id)) return id;
  const n = f.nos[id]; const op = esc[id];
  const a = expressao(f, esc, n.a, js);
  if (n.tipo === 'un') return op === 'NOT' ? (js ? `!${a}` : `not ${a}`) : a;
  return `(${a} ${(js ? JS : PY)[op]} ${expressao(f, esc, n.b, js)})`;
}

const TABELAS = {
  AND: { nome: 'AND ("e")', l: [[0, 0, 0], [0, 1, 0], [1, 0, 0], [1, 1, 1]], cab: ['A', 'B', 'saída'] },
  OR: { nome: 'OR ("ou")', l: [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 1]], cab: ['A', 'B', 'saída'] },
  NOT: { nome: 'NOT ("não")', l: [[0, 1], [1, 0]], cab: ['A', 'saída'] },
};
function TabelaPorta({ op }) {
  const t = TABELAS[op];
  return (
    <table className="tv mini-tv"><caption>{t.nome}</caption>
      <thead><tr>{t.cab.map((h) => <th key={h}>{h}</th>)}</tr></thead>
      <tbody>{t.l.map((r, k) => <tr key={k}>{r.map((v, j) => <td key={j} className={j === r.length - 1 ? (v ? 'um' : 'zero') : ''}>{v}</td>)}</tr>)}</tbody>
    </table>
  );
}

const CONCEITO = {
  nome: 'Lógica booleana e circuitos',
  paragrafos: [
    'Computadores só entendem verdadeiro e falso (1 e 0). Combinando portas AND, OR e NOT é possível construir qualquer decisão, e é assim que funciona o processador por dentro. A tabela-verdade mostra a saída de um circuito para todas as combinações de entrada.',
    'Os circuitos que você montou são as mesmas condições dos programas: o AND vira "&&" (ou "and"), o OR vira "||" (ou "or") e o NOT vira "!" (ou "not"). Escrever a condição certa de um if é projetar um circuito lógico.',
  ],
  codigo: '# "maioria": acende se pelo menos 2 das 3 entradas estão ligadas\ndef maioria(a, b, c):\n    return (a and b) or (c and (a or b))\n\nprint(maioria(True, False, True))   # True',
};

export default function Portas({ onSair }) {
  const [i, setI] = useState(0);
  const [esc, setEsc] = useState({});
  const [linha, setLinha] = useState(0);
  const [erros, setErros] = useState(0);
  const [dica, setDica] = useState(false);
  const [marcas, setMarcas] = useState(null);
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(false);
  const [pts, setPts] = useState(0);
  const [tot, setTot] = useState(0);
  const [fim, setFim] = useState(false);

  const f = FASES[i];
  const unico = f.casos.length === 1;
  const caso = f.casos[Math.min(linha, f.casos.length - 1)];
  const { saida, val } = avaliar(f, esc, caso);
  const estr = estrelasPorPenalidade(erros + (dica ? 1 : 0));

  // posições do diagrama
  const cam = camadas(f); const L = cam.__lampada + 1;
  const camadasLista = Array.from({ length: L }, () => []);
  f.ent.forEach((e) => camadasLista[0].push(e));
  Object.keys(f.nos).forEach((id) => camadasLista[cam[id]].push(id));
  camadasLista[L - 1].push('__lampada');
  const pos = {};
  camadasLista.forEach((lst, c) => lst.forEach((id, k) => { pos[id] = { x: 9 + (c * 82) / (L - 1), y: ((k + 1) / (lst.length + 1)) * 100 }; }));
  const altura = Math.max(190, Math.max(...camadasLista.map((l) => l.length)) * 92);
  const fios = [];
  Object.entries(f.nos).forEach(([id, n]) => { [n.a, n.b].filter(Boolean).forEach((o) => fios.push([o, id])); });
  fios.push([f.saida, '__lampada']);

  const trocar = (id) => {
    if (ok) return;
    const ops = f.nos[id].ops; const at = esc[id];
    setEsc({ ...esc, [id]: ops[(ops.indexOf(at) + 1) % ops.length] });
    setMarcas(null); setMsg('');
  };

  function testar() {
    if (Object.keys(f.nos).some((id) => !esc[id])) { setMsg('Toque em todas as portas com "?" para escolher o tipo delas.'); return; }
    const res = f.casos.map((c, k) => (avaliar(f, esc, c).saida ? 1 : 0) === f.alvo[k]);
    setMarcas(res);
    if (res.every(Boolean)) {
      setOk(true); setMsg('');
      salvarEstrelas('portas', i, estr); setPts((p) => p + estr * 100); setTot((t) => t + estr);
    } else {
      setErros((e) => e + 1);
      const falhas = res.filter((r) => !r).length;
      setMsg(unico ? 'A lâmpada não está como o pedido. Troque a porta e teste de novo.' : `${falhas} ${falhas === 1 ? 'linha da tabela está' : 'linhas da tabela estão'} errada${falhas === 1 ? '' : 's'}. Toque nelas para investigar.`);
    }
  }
  function nova(idx) { setEsc({}); setLinha(0); setErros(0); setDica(false); setMarcas(null); setMsg(''); setOk(false); setI(idx); }
  const proxima = () => { if (i === FASES.length - 1) setFim(true); else nova(i + 1); };
  const reiniciar = () => { setPts(0); setTot(0); setFim(false); nova(0); };

  const usadas = [...new Set(Object.keys(f.nos).map((id) => esc[id]).filter((o) => o && o !== 'FIO'))];
  const lampada = saida === true;

  return (
    <Moldura titulo="Portas Lógicas" conceito="Lógica booleana e circuitos" fase={fim ? FASES.length : i} total={FASES.length} pontos={pts} onSair={onSair}>
      {fim ? (
        <Resultado pontos={pts} estrelas={tot} max={FASES.length * 3} conceito={CONCEITO} onRepetir={reiniciar} onSair={onSair} />
      ) : (
        <div className="jg-corpo">
          <p className="enun">{f.txt}</p>
          {unico && <p className="objetivo-l">A lâmpada deve <b className={f.alvo[0] ? 'um' : 'zero'}>{f.alvo[0] ? 'ACENDER' : 'APAGAR'}</b></p>}

          <div className="circuito" style={{ height: altura }} role="group" aria-label="Circuito lógico">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {fios.map(([de, para], k) => {
                const v = de === f.saida && para === '__lampada' ? saida : val[de];
                return <line key={k} x1={pos[de].x} y1={pos[de].y} x2={pos[para].x} y2={pos[para].y} className={'fio ' + (v === true ? 'lig' : v === false ? 'des' : 'nul')} vectorEffect="non-scaling-stroke" />;
              })}
            </svg>
            {f.ent.map((e) => (
              <span key={e} className={'no ent ' + (val[e] ? 'lig' : 'des')} style={{ left: pos[e].x + '%', top: pos[e].y + '%' }}>{e}<b>{val[e] ? 1 : 0}</b></span>
            ))}
            {Object.entries(f.nos).map(([id, n]) => (
              <button key={id} type="button" disabled={ok} className={'no porta ' + (esc[id] ? '' : 'vazia ') + (val[id] === true ? 'lig' : val[id] === false ? 'des' : '')} style={{ left: pos[id].x + '%', top: pos[id].y + '%' }} onClick={() => trocar(id)} aria-label={`Porta ${esc[id] || 'não escolhida'}. Toque para trocar.`}>
                <b>{esc[id] || '?'}</b><small>{n.tipo === 'bin' ? '2 entradas' : '1 entrada'}</small>
              </button>
            ))}
            <span className={'no lamp' + (lampada ? ' acesa' : '')} style={{ left: pos.__lampada.x + '%', top: pos.__lampada.y + '%' }} role="img" aria-label={lampada ? 'Lâmpada acesa' : 'Lâmpada apagada'}>{lampada ? '💡' : '○'}</span>
          </div>

          {!unico && (
            <table className="tv" aria-label="Tabela-verdade desejada">
              <thead><tr>{f.ent.map((e) => <th key={e}>{e}</th>)}<th>Esperado</th><th>Seu circuito</th><th /></tr></thead>
              <tbody>
                {f.casos.map((c, k) => {
                  const s = avaliar(f, esc, c).saida;
                  return (
                    <tr key={k} className={(k === linha ? 'sel ' : '') + (marcas ? (marcas[k] ? 'certo' : 'errado') : '')} onClick={() => setLinha(k)}>
                      {c.map((v, j) => <td key={j}>{v}</td>)}
                      <td className={f.alvo[k] ? 'um' : 'zero'}>{f.alvo[k]}</td>
                      <td>{s === null ? '?' : s ? 1 : 0}</td>
                      <td>{marcas ? (marcas[k] ? '✓' : '✗') : ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          <div className="msgs" aria-live="polite">{msg && !ok && <p className="erro">{msg}</p>}</div>
          {!ok && (
            <>
              <div className="acoes"><button type="button" className="btn" onClick={testar}>Testar circuito</button></div>
              <Dica texto={f.dica} usada={dica} onUsar={() => setDica(true)} />
            </>
          )}

          {ok && (
            <FaseOk estrelas={estr} pontos={estr * 100} ultima={i === FASES.length - 1} onProxima={proxima} titulo="Circuito correto!">
              <span className="tag2">COMO ISSO VIRA CÓDIGO</span>
              <pre className="mini-cod"><code>{`acende = ${expressao(f, esc, f.saida, false)}\n// em JavaScript: ${expressao(f, esc, f.saida, true)}`}</code></pre>
              {unico && <div className="tvs">{usadas.map((o) => <TabelaPorta key={o} op={o} />)}</div>}
            </FaseOk>
          )}
        </div>
      )}
    </Moldura>
  );
}
