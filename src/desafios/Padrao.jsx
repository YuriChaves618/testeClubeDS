import { useState } from 'react';
import { Moldura, Dica, FaseOk, Resultado, estrelasPorPenalidade, salvarEstrelas } from './comum.jsx';

const COR = { bl: '#0a6cff', or: '#ff6a00', ve: '#2ecc71', am: '#ffd23f' };
const NOME_COR = { bl: 'azul', or: 'laranja', ve: 'verde', am: 'amarelo' };
const NOME_F = { circ: 'círculo', quad: 'quadrado', tri: 'triângulo' };

function Forma({ f, c }) {
  const cor = COR[c];
  return (
    <svg viewBox="0 0 40 40" className="forma" role="img" aria-label={`${NOME_F[f]} ${NOME_COR[c]}`}>
      {f === 'circ' && <circle cx="20" cy="20" r="15" fill={cor} />}
      {f === 'quad' && <rect x="5" y="5" width="30" height="30" rx="4" fill={cor} />}
      {f === 'tri' && <polygon points="20,4 36,35 4,35" fill={cor} />}
    </svg>
  );
}

const F = (f, c) => ({ f, c });
const igual = (a, b) => a.f === b.f && a.c === b.c;

// formas em ciclo de 2 e cores em ciclo de 3: o padrão só se repete a cada 6
const combo = (i) => F(['circ', 'quad'][i % 2], ['bl', 'or', 've'][i % 3]);

const FASES = [
  { tipo: 'num', seq: [5, 10, 15, 20], resp: 25,
    regra: 'A sequência soma 5 a cada passo: 5, 10, 15, 20, 25…',
    dica: 'Olhe a diferença entre cada número e o seguinte.' },
  { tipo: 'vis', seq: [F('circ', 'bl'), F('circ', 'or'), F('circ', 'bl'), F('circ', 'or'), F('circ', 'bl')], resp: F('circ', 'or'),
    opcoes: [F('circ', 'bl'), F('circ', 'or'), F('quad', 'or'), F('tri', 'bl')],
    regra: 'As cores se alternam: azul, laranja, azul, laranja… Depois do azul vem o laranja.',
    dica: 'A forma nunca muda. Repare só na cor.' },
  { tipo: 'num', seq: [2, 4, 8, 16], resp: 32,
    regra: 'Cada número é o dobro do anterior (multiplicar por 2).',
    dica: 'Não é somar um valor fixo. Tente multiplicar.' },
  { tipo: 'vis', seq: [0, 1, 2, 3, 4, 5].map(combo), resp: combo(6),
    opcoes: [F('quad', 'bl'), F('circ', 'or'), F('circ', 'bl'), F('quad', 've')],
    regra: 'Duas regras ao mesmo tempo: as formas alternam a cada 2 (círculo, quadrado) e as cores se repetem a cada 3 (azul, laranja, verde).',
    dica: 'Separe o problema: descubra o ciclo das formas e, depois, o ciclo das cores.' },
  { tipo: 'num', seq: [1, 4, 9, 16, 25], resp: 36,
    regra: 'São os quadrados perfeitos: 1², 2², 3², 4², 5², 6²… A diferença entre vizinhos cresce 3, 5, 7, 9, 11.',
    dica: 'Compare a diferença entre os números: ela também muda de forma regular.' },
  { tipo: 'num', seq: [1, 1, 2, 3, 5, 8], resp: 13,
    regra: 'É a sequência de Fibonacci: cada número é a soma dos dois anteriores (5 + 8 = 13).',
    dica: 'Experimente somar dois números seguidos e compare com o próximo.' },
  { tipo: 'num', seq: [2, 100, 4, 90, 6, 80], resp: 8,
    regra: 'São duas sequências intercaladas: nas posições ímpares, 2, 4, 6, 8 (soma 2); nas pares, 100, 90, 80 (subtrai 10). A próxima posição é ímpar, então vem 8.',
    dica: 'Leia só os números das posições 1, 3 e 5. Depois, só os das posições 2, 4 e 6.' },
  { tipo: 'num', seq: [1, 3, 7, 15, 31], resp: 63,
    regra: 'Regra composta: multiplique o número anterior por 2 e some 1 (31 × 2 + 1 = 63).',
    dica: 'A diferença entre vizinhos dobra a cada passo. Que operação faz isso?' },
];

const CONCEITO = {
  nome: 'Reconhecimento de padrões',
  paragrafos: [
    'Antes de escrever qualquer código, quem programa precisa enxergar a regra por trás dos dados. Reconhecer padrões é identificar regularidades, generalizar e abstrair: a base de qualquer algoritmo.',
    'Cada regra que você descobriu aqui pode virar um laço ou uma função. A sequência 5, 10, 15, 20, por exemplo, é um for somando 5 a cada volta. Fibonacci usa os dois valores anteriores. Já as sequências intercaladas mostram que um problema grande se resolve separando-o em partes menores.',
  ],
  codigo: 'a, b = 1, 1\nfor _ in range(6):\n    print(a)\n    a, b = b, a + b   # Fibonacci: 1 1 2 3 5 8',
};

export default function Padrao({ onSair }) {
  const [i, setI] = useState(0);
  const [pts, setPts] = useState(0);
  const [tot, setTot] = useState(0);
  const [erros, setErros] = useState(0);
  const [dica, setDica] = useState(false);
  const [ok, setOk] = useState(false);
  const [msg, setMsg] = useState('');
  const [val, setVal] = useState('');
  const [tremer, setTremer] = useState(false);
  const [errada, setErrada] = useState(null);
  const [fim, setFim] = useState(false);

  const f = FASES[i];
  const estr = estrelasPorPenalidade(erros + (dica ? 1 : 0));

  const erro = (texto) => {
    setErros((x) => x + 1);
    setMsg(texto);
    setTremer(true);
    setTimeout(() => setTremer(false), 450);
  };
  const acertou = () => {
    setOk(true); setMsg('');
    salvarEstrelas('padrao', i, estr);
    setPts((p) => p + estr * 100);
    setTot((t) => t + estr);
  };

  function enviar(e) {
    e.preventDefault();
    const t = val.trim().replace(',', '.');
    if (t === '' || Number.isNaN(Number(t))) { setMsg('Digite um número para responder.'); return; }
    if (Number(t) === f.resp) acertou();
    else erro('Ainda não é esse. Veja como cada número se relaciona com o anterior.');
  }
  function escolher(op, k) {
    if (ok) return;
    if (igual(op, f.resp)) acertou();
    else { setErrada(k); erro('Essa não encaixa. Compare com o que se repete na sequência.'); }
  }
  function proxima() {
    if (i === FASES.length - 1) { setFim(true); return; }
    setI(i + 1); setErros(0); setDica(false); setOk(false); setMsg(''); setVal(''); setErrada(null);
  }
  function reiniciar() {
    setI(0); setPts(0); setTot(0); setErros(0); setDica(false); setOk(false); setMsg(''); setVal(''); setErrada(null); setFim(false);
  }

  return (
    <Moldura titulo="Decifre o Padrão" conceito="Reconhecimento de padrões" fase={fim ? FASES.length : i} total={FASES.length} pontos={pts} onSair={onSair}>
      {fim ? (
        <Resultado pontos={pts} estrelas={tot} max={FASES.length * 3} conceito={CONCEITO} onRepetir={reiniciar} onSair={onSair} />
      ) : (
        <div className="jg-corpo">
          <p className="enun">{f.tipo === 'num' ? 'Qual número completa a sequência?' : 'Qual forma completa a sequência?'}</p>

          <div className={'seq' + (tremer ? ' tremer' : '')} role="group" aria-label="Sequência">
            {f.tipo === 'num'
              ? f.seq.map((n, k) => <span className="cel" key={k}>{n}</span>)
              : f.seq.map((x, k) => <span className="cel" key={k}><Forma {...x} /></span>)}
            {ok
              ? <span className="cel certa">{f.tipo === 'num' ? f.resp : <Forma {...f.resp} />}</span>
              : <span className="cel duvida">?</span>}
          </div>

          {!ok && f.tipo === 'num' && (
            <form className="resp" onSubmit={enviar}>
              <input key={i} autoFocus inputMode="numeric" autoComplete="off" aria-label="Sua resposta" placeholder="Sua resposta" value={val} onChange={(e) => setVal(e.target.value)} />
              <button className="btn" type="submit">Verificar</button>
            </form>
          )}
          {!ok && f.tipo === 'vis' && (
            <div className="opcoes" role="group" aria-label="Opções de resposta">
              {f.opcoes.map((op, k) => (
                <button key={k} type="button" className={'opc' + (errada === k ? ' erro' : '')} onClick={() => escolher(op, k)}>
                  <Forma {...op} />
                </button>
              ))}
            </div>
          )}

          <div className="msgs" aria-live="polite">{msg && <p className="erro">{msg}</p>}</div>

          {!ok && <Dica texto={f.dica} usada={dica} onUsar={() => setDica(true)} />}

          {ok && (
            <FaseOk estrelas={estr} pontos={estr * 100} ultima={i === FASES.length - 1} onProxima={proxima}>
              <span className="tag2">A REGRA POR TRÁS DO PADRÃO</span>
              <p>{f.regra}</p>
            </FaseOk>
          )}
        </div>
      )}
    </Moldura>
  );
}
