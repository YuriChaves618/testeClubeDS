import { useEffect, useRef, useState } from 'react';
import { Moldura, Dica, FaseOk, Resultado, salvarEstrelas } from './comum.jsx';
import { EXPR } from './assets.js';

const DR = [-1, 0, 1, 0]; const DC = [0, 1, 0, -1]; // N, L, S, O
const CONT = { rep: ['corpo'], ate: ['corpo'], se: ['entao', 'senao'] };

const FASES = [
  { mapa: ['#####', 'S...E', '#####'], dir: 1, blocos: ['andar'], limite: 8, par: 4,
    txt: 'Monte a sequência de comandos para levar o robô até a saída. Toque num bloco para adicioná-lo ao programa e depois em Executar.',
    dica: 'A saída fica 4 casas à frente. Use 4 blocos "Andar".' },
  { mapa: ['S...#', '###.#', '###E#'], dir: 1, blocos: ['andar', 'esq', 'dir'], limite: 10, par: 6,
    txt: 'O caminho faz uma curva. Lembre-se: o robô precisa virar antes de seguir na nova direção.',
    dica: 'Ande 3 casas, vire à direita e ande mais 2.' },
  { mapa: ['S......', '######.', '######.', '######.', '######E'], dir: 1, blocos: ['andar', 'esq', 'dir', 'rep'], limite: 5, par: 5,
    txt: 'Agora há um limite de 5 blocos. Para repetir comandos sem gastar blocos, use o bloco "Repetir".',
    dica: 'Repetir 6 vezes [Andar], Virar à direita, Repetir 4 vezes [Andar]. Dentro de um "Repetir", toque na área dele antes de adicionar blocos.' },
  { mapa: ['S.###', '#..##', '##..#', '###..', '####E'], dir: 1, blocos: ['andar', 'esq', 'dir', 'rep'], limite: 6, par: 5,
    txt: 'Uma escada! Procure o trecho que se repete e coloque-o dentro de um "Repetir".',
    dica: 'O padrão é: andar, virar à direita, andar, virar à esquerda. Repita 4 vezes.' },
  { mapa: ['S....', '####.', '..E#.', '.###.', '.....'], dir: 1, blocos: ['andar', 'esq', 'dir', 'ate', 'se'], limite: 5, par: 4,
    txt: 'Um caminho em espiral, e só 5 blocos! Use "Repetir até chegar" e um "Se / senão" para o robô decidir sozinho o que fazer.',
    dica: 'Repetir até chegar: se frente livre então Andar, senão Virar à direita.' },
  { mapa: ['S.....#', '#####.#', '......#', '.######', '.....E#'], dir: 1, blocos: ['andar', 'esq', 'dir', 'ate', 'se'], limite: 7, par: 6,
    txt: 'Desafio final: o caminho tem curvas para os dois lados. Que tal um "Se" dentro de outro "Se"?',
    dica: 'Repetir até chegar: se frente livre, Andar; senão, se direita livre, Virar à direita; senão, Virar à esquerda.' },
];

// ---------- árvore de blocos ----------
const mapRamos = (b, fn) => { let nb = b; (CONT[b.t] || []).forEach((r) => { nb = { ...nb, [r]: fn(nb[r]) }; }); return nb; };
function inserir(lista, alvo, bloco) {
  if (alvo === 'main') return { lista: [...lista, bloco], ok: true };
  let ok = false;
  const rec = (l) => l.map((b) => {
    let nb = b;
    (CONT[b.t] || []).forEach((r) => {
      if (alvo === `${b.id}:${r}`) { nb = { ...nb, [r]: [...nb[r], bloco] }; ok = true; } else nb = { ...nb, [r]: rec(nb[r]) };
    });
    return nb;
  });
  const n = rec(lista);
  return { lista: n, ok };
}
const remover = (l, id) => l.filter((b) => b.id !== id).map((b) => mapRamos(b, (x) => remover(x, id)));
const alterar = (l, id, patch) => l.map((b) => (b.id === id ? { ...b, ...patch } : mapRamos(b, (x) => alterar(x, id, patch))));
function mover(l, id, d) {
  const k = l.findIndex((b) => b.id === id);
  if (k >= 0) { const j = k + d; if (j < 0 || j >= l.length) return l; const c = [...l]; [c[k], c[j]] = [c[j], c[k]]; return c; }
  return l.map((b) => mapRamos(b, (x) => mover(x, id, d)));
}
const contar = (l) => l.reduce((s, b) => s + 1 + (CONT[b.t] || []).reduce((s2, r) => s2 + contar(b[r]), 0), 0);

function codigo(l, ind = 0) {
  const p = '    '.repeat(ind);
  const corpo = (x) => (x.length ? codigo(x, ind + 1) : [`${p}    pass`]);
  return l.flatMap((b) => {
    if (b.t === 'andar') return [`${p}andar()`];
    if (b.t === 'esq') return [`${p}virar_esquerda()`];
    if (b.t === 'dir') return [`${p}virar_direita()`];
    if (b.t === 'rep') return [`${p}for _ in range(${b.n}):`, ...corpo(b.corpo)];
    if (b.t === 'ate') return [`${p}while not na_saida():`, ...corpo(b.corpo)];
    const c = { frente: 'frente_livre()', dir: 'direita_livre()', esq: 'esquerda_livre()' }[b.cond];
    return [`${p}if ${c}:`, ...corpo(b.entao), `${p}else:`, ...corpo(b.senao)];
  });
}

// ---------- interpretador ----------
const livre = (m, r, c) => r >= 0 && r < m.length && c >= 0 && c < m[0].length && m[r][c] !== '#';
function inicio(mapa) { for (let r = 0; r < mapa.length; r++) { const c = mapa[r].indexOf('S'); if (c >= 0) return { r, c }; } return { r: 0, c: 0 }; }

function executar(mapa, ini, prog) {
  const passos = []; let { r, c, d } = ini; let orc = 600;
  const reg = (tipo) => passos.push({ r, c, d, tipo });
  const fim = (m) => { const e = new Error(m); e.parar = m; return e; };
  const noFim = () => mapa[r][c] === 'E';
  const aval = (cond) => { const dd = cond === 'frente' ? d : cond === 'dir' ? (d + 1) % 4 : (d + 3) % 4; return livre(mapa, r + DR[dd], c + DC[dd]); };
  function rodar(lista) {
    lista.forEach((b) => {
      orc -= 1; if (orc < 0) throw fim('tempo');
      if (b.t === 'andar') {
        const nr = r + DR[d]; const nc = c + DC[d];
        if (!livre(mapa, nr, nc)) { reg('bate'); throw fim('parede'); }
        r = nr; c = nc; reg('andar'); if (noFim()) throw fim('chegou');
      } else if (b.t === 'esq') { d = (d + 3) % 4; reg('vira'); } else if (b.t === 'dir') { d = (d + 1) % 4; reg('vira'); } else if (b.t === 'rep') { for (let k = 0; k < b.n; k++) rodar(b.corpo); } else if (b.t === 'ate') {
        while (!noFim()) { orc -= 1; if (orc < 0) throw fim('tempo'); rodar(b.corpo); }
        throw fim('chegou');
      } else if (b.t === 'se') rodar(aval(b.cond) ? b.entao : b.senao);
    });
  }
  let res;
  try { rodar(prog); res = noFim() ? 'chegou' : 'parou'; } catch (e) { if (e.parar) res = e.parar; else throw e; }
  return { passos, fim: res };
}

const MSG = {
  parede: 'O robô bateu na parede! Confira os comandos de virar e quantas casas ele anda.',
  parou: 'O programa terminou, mas o robô não chegou à saída. Falta algum comando?',
  tempo: 'O programa não terminou. Pode haver um loop infinito: o robô precisa ter um jeito de parar.',
};
const NOME = { andar: 'Andar', esq: 'Virar à esquerda ↺', dir: 'Virar à direita ↻' };
const COND = { frente: 'frente livre', dir: 'direita livre', esq: 'esquerda livre' };

function Lista({ lista, chave, ctx }) {
  const { alvo, setAlvo, travado } = ctx;
  return (
    <ol className={'prog' + (alvo === chave ? ' alvo' : '')} onClick={(e) => { e.stopPropagation(); if (!travado) setAlvo(chave); }}>
      {lista.length === 0 && <li className="vazio">{alvo === chave ? 'Os próximos blocos entram aqui' : 'Toque aqui para adicionar blocos nesta área'}</li>}
      {lista.map((b) => <Bloco key={b.id} b={b} ctx={ctx} />)}
    </ol>
  );
}

function Bloco({ b, ctx }) {
  const { rem, mov, alt, travado } = ctx;
  const parar = (e) => e.stopPropagation();
  const ctl = (
    <span className="ctl">
      <button type="button" disabled={travado} aria-label="Subir bloco" onClick={(e) => { parar(e); mov(b.id, -1); }}>↑</button>
      <button type="button" disabled={travado} aria-label="Descer bloco" onClick={(e) => { parar(e); mov(b.id, 1); }}>↓</button>
      <button type="button" disabled={travado} aria-label="Remover bloco" onClick={(e) => { parar(e); rem(b.id); }}>✕</button>
    </span>
  );
  if (!CONT[b.t]) return <li className={'blk ' + b.t}><span>{NOME[b.t]}</span>{ctl}</li>;
  return (
    <li className={'blk cont ' + b.t}>
      <div className="bh">
        {b.t === 'rep' && (
          <span>Repetir <select value={b.n} disabled={travado} onClick={parar} onChange={(e) => alt(b.id, { n: Number(e.target.value) })} aria-label="Quantas vezes">
            {[2, 3, 4, 5, 6, 7, 8, 9].map((k) => <option key={k} value={k}>{k}</option>)}</select> vezes</span>
        )}
        {b.t === 'ate' && <span>Repetir até chegar na saída</span>}
        {b.t === 'se' && (
          <span>Se <select value={b.cond} disabled={travado} onClick={parar} onChange={(e) => alt(b.id, { cond: e.target.value })} aria-label="Condição">
            {Object.entries(COND).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></span>
        )}
        {ctl}
      </div>
      {b.t === 'se' ? (
        <>
          <div className="ramo"><b>então</b><Lista lista={b.entao} chave={`${b.id}:entao`} ctx={ctx} /></div>
          <div className="ramo"><b>senão</b><Lista lista={b.senao} chave={`${b.id}:senao`} ctx={ctx} /></div>
        </>
      ) : <Lista lista={b.corpo} chave={`${b.id}:corpo`} ctx={ctx} />}
    </li>
  );
}

const CONCEITO = {
  nome: 'Sequências, loops e condicionais',
  paragrafos: [
    'Programar é dar instruções em ordem (sequência), repetir o que se repete (loop) e deixar o programa decidir sozinho (condicional). Foi exatamente isso que você fez com os blocos.',
    'Repare como o limite de blocos empurrou você para soluções elegantes: um "Repetir" substitui dezenas de comandos iguais, e "Repetir até chegar" com um "Se / senão" resolve um labirinto inteiro sem você saber o formato dele de antemão. Isso é um algoritmo de verdade: segue a regra e funciona em mais de um mapa.',
  ],
  codigo: 'while not na_saida():\n    if frente_livre():\n        andar()\n    else:\n        virar_direita()',
};

export default function Robo({ onSair }) {
  const [i, setI] = useState(0);
  const [prog, setProg] = useState([]);
  const [alvo, setAlvo] = useState('main');
  const [exec, setExec] = useState(null);
  const [dica, setDica] = useState(false);
  const [ok, setOk] = useState(false);
  const [estr, setEstr] = useState(3);
  const [pts, setPts] = useState(0);
  const [tot, setTot] = useState(0);
  const [fim, setFim] = useState(false);
  const [aviso, setAviso] = useState('');
  const idRef = useRef(1);

  const fase = FASES[i];
  const ini = { ...inicio(fase.mapa), d: fase.dir };
  const usados = contar(prog);
  const rodando = !!exec && !exec.done;
  const travado = rodando || ok;
  const pos = exec && exec.i >= 0 ? exec.passos[exec.i] : ini;
  const linhas = fase.mapa.length; const cols = fase.mapa[0].length;

  // animação passo a passo
  useEffect(() => {
    if (!exec || exec.done) return undefined;
    const id = setTimeout(() => setExec((e) => (e.i + 1 >= e.passos.length ? { ...e, done: true } : { ...e, i: e.i + 1 })), 360);
    return () => clearTimeout(id);
  }, [exec]);

  // fim da execução: sucesso ou mensagem de erro
  useEffect(() => {
    if (!exec || !exec.done) return;
    if (exec.fim === 'chegou') {
      const base = usados <= fase.par ? 3 : usados <= fase.par + 2 ? 2 : 1;
      const e = Math.max(1, base - (dica ? 1 : 0));
      setEstr(e); setOk(true); salvarEstrelas('robo', i, e);
      setPts((p) => p + e * 100); setTot((t) => t + e);
    } else setAviso(MSG[exec.fim]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exec && exec.done]);

  function adicionar(t) {
    if (travado || usados >= fase.limite) return;
    const id = idRef.current++;
    const bloco = { id, t };
    if (t === 'rep') Object.assign(bloco, { n: 2, corpo: [] });
    if (t === 'ate') Object.assign(bloco, { corpo: [] });
    if (t === 'se') Object.assign(bloco, { cond: 'frente', entao: [], senao: [] });
    let r = inserir(prog, alvo, bloco);
    if (!r.ok) r = inserir(prog, 'main', bloco);
    setProg(r.lista); setAviso(''); setExec(null);
    if (t === 'rep' || t === 'ate') setAlvo(`${id}:corpo`);
    else if (t === 'se') setAlvo(`${id}:entao`);
    else if (!r.ok) setAlvo('main');
  }
  const rem = (id) => { setProg((p) => remover(p, id)); setAlvo('main'); setExec(null); setAviso(''); };
  const mov = (id, d) => { setProg((p) => mover(p, id, d)); setExec(null); };
  const alt = (id, patch) => { setProg((p) => alterar(p, id, patch)); setExec(null); };

  function executarProg() {
    if (!prog.length) { setAviso('Adicione alguns blocos antes de executar.'); return; }
    setAviso('');
    const r = executar(fase.mapa, ini, prog);
    setExec({ ...r, i: -1, done: r.passos.length === 0 });
  }
  function nova(idx) { setProg([]); setAlvo('main'); setExec(null); setDica(false); setOk(false); setAviso(''); setI(idx); }
  const proxima = () => { if (i === FASES.length - 1) setFim(true); else nova(i + 1); };
  const reiniciar = () => { setPts(0); setTot(0); setFim(false); nova(0); };

  const ctx = { alvo, setAlvo, travado, rem, mov, alt };
  const passo = exec && exec.i >= 0 ? exec.passos[exec.i] : null;

  return (
    <Moldura titulo="Robô no Labirinto" conceito="Sequências, loops e condicionais" fase={fim ? FASES.length : i} total={FASES.length} pontos={pts} onSair={onSair}>
      {fim ? (
        <Resultado pontos={pts} estrelas={tot} max={FASES.length * 3} conceito={CONCEITO} onRepetir={reiniciar} onSair={onSair} />
      ) : (
        <div className="jg-corpo robo">
          <p className="enun">{fase.txt}</p>

          <div className="labirinto" style={{ '--cols': cols, '--lin': linhas }} role="img" aria-label="Labirinto">
            {fase.mapa.flatMap((row, r) => row.split('').map((ch, c) => (
              <div key={`${r}-${c}`} className={'cl ' + (ch === '#' ? 'parede' : ch === 'E' ? 'saida' : 'chao')}>{ch === 'E' ? '★' : ''}</div>
            )))}
            <div className={'tk' + (passo && passo.tipo === 'bate' ? ' bate' : '')} style={{ left: (pos.c * 100) / cols + '%', top: (pos.r * 100) / linhas + '%', width: 100 / cols + '%', height: 100 / linhas + '%' }}>
              <img src={EXPR.normal} alt="" draggable="false" />
              <i className="seta" style={{ transform: `rotate(${pos.d * 90}deg)` }}><b>▲</b></i>
            </div>
          </div>

          <div className="placar">
            <span>Blocos: <b className={usados >= fase.limite ? 'cheio' : ''}>{usados}</b> / {fase.limite}</span>
            <span>Meta: <b>{fase.par}</b></span>
          </div>

          <div className="paleta" role="group" aria-label="Blocos disponíveis">
            {fase.blocos.map((t) => (
              <button key={t} type="button" className={'pb ' + t} disabled={travado || usados >= fase.limite} onClick={() => adicionar(t)}>
                {{ andar: 'Andar', esq: '↺ Esquerda', dir: '↻ Direita', rep: 'Repetir', ate: 'Repetir até chegar', se: 'Se / senão' }[t]}
              </button>
            ))}
          </div>

          <div className={'area-prog' + (alvo === 'main' ? ' alvo' : '')} onClick={() => { if (!travado) setAlvo('main'); }}>
            <small>Seu programa</small>
            <Lista lista={prog} chave="main" ctx={{ ...ctx, alvo: alvo === 'main' ? 'main' : alvo }} />
          </div>

          <div className="msgs" aria-live="polite">{aviso && <p className="erro">{aviso}</p>}</div>

          {!ok && (
            <div className="acoes">
              <button type="button" className="btn" onClick={executarProg} disabled={rodando}>▶ Executar</button>
              <button type="button" className="btn ghost sm" onClick={() => { setExec(null); setAviso(''); }} disabled={!exec}>Voltar ao início</button>
              <button type="button" className="btn ghost sm" onClick={() => { setProg([]); setAlvo('main'); setExec(null); setAviso(''); }} disabled={!prog.length || rodando}>Limpar</button>
            </div>
          )}
          {!ok && <Dica texto={fase.dica} usada={dica} onUsar={() => setDica(true)} />}

          {ok && (
            <FaseOk estrelas={estr} pontos={estr * 100} ultima={i === FASES.length - 1} onProxima={proxima} titulo="O robô chegou à saída!">
              <span className="tag2">SEU PROGRAMA EM CÓDIGO</span>
              <p>Você usou <b>{usados}</b> {usados === 1 ? 'bloco' : 'blocos'} (meta: {fase.par}). Este é o mesmo programa escrito em Python:</p>
              <pre className="mini-cod"><code>{codigo(prog).join('\n')}</code></pre>
            </FaseOk>
          )}
        </div>
      )}
    </Moldura>
  );
}
