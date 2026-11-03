import { useState } from 'react';
import { Moldura, Dica, FaseOk, Resultado, estrelasPorPenalidade, salvarEstrelas, aleatorio, semearFase, soltarSemente } from './comum.jsx';

const FASES = [
  { n: 100, max: 10, txt: 'Descubra o número de 1 a 100 em até 10 tentativas.' },
  { n: 100, max: 7, txt: 'De novo, de 1 a 100, mas agora com apenas 7 tentativas. Dá para garantir a vitória?' },
  { n: 1000, max: 10, txt: 'Agora é de 1 a 1000, com 10 tentativas. Você consegue?' },
];

// No duelo a 1ª tentativa de cada fase tem o mesmo número para os dois. Em "Tentar de novo" o número
// é realmente aleatório, senão quem perdeu a rodada já saberia a resposta.
const sorteio = (n, fase, repetida = false) => {
  if (repetida) soltarSemente(); else semearFase('numero', fase);
  return 1 + Math.floor(aleatorio() * n);
};
const ideal = (n) => Math.floor(Math.log2(n)) + 1; // máximo de palpites da busca binária

// palpites que a busca binária faria para achar `alvo`
function sequenciaIdeal(n, alvo) {
  let lo = 1; let hi = n; const seq = [];
  while (lo <= hi) {
    const m = Math.floor((lo + hi) / 2);
    seq.push(m);
    if (m === alvo) break;
    if (alvo > m) lo = m + 1; else hi = m - 1;
  }
  return seq;
}

const CONCEITO = {
  nome: 'Busca binária',
  paragrafos: [
    'Dividir o intervalo ao meio a cada palpite elimina metade das possibilidades de uma vez. Por isso 7 tentativas bastam para qualquer número de 1 a 100, e 10 bastam para de 1 a 1000.',
    'É a ideia da busca binária: em vez de olhar item por item (n passos), ela precisa de apenas log₂(n) passos. Para um milhão de itens, são só 20 tentativas. Isso se chama complexidade logarítmica, e é o que torna buscas em listas ordenadas tão rápidas.',
  ],
  codigo: 'def busca_binaria(lista, alvo):\n    ini, fim = 0, len(lista) - 1\n    while ini <= fim:\n        meio = (ini + fim) // 2\n        if lista[meio] == alvo:\n            return meio\n        if lista[meio] < alvo:\n            ini = meio + 1\n        else:\n            fim = meio - 1\n    return -1',
};

export default function Numero({ onSair }) {
  const [i, setI] = useState(0);
  const [segredo, setSegredo] = useState(() => sorteio(FASES[0].n, 0));
  const [palpites, setPalpites] = useState([]); // {n, r: 'maior' | 'menor' | 'certo'}
  const [val, setVal] = useState('');
  const [msg, setMsg] = useState('');
  const [dica, setDica] = useState(false);
  const [estado, setEstado] = useState('jogando'); // jogando | ganhou | perdeu
  const [pts, setPts] = useState(0);
  const [tot, setTot] = useState(0);
  const [fim, setFim] = useState(false);

  const fase = FASES[i];
  let lo = 1; let hi = fase.n;
  palpites.forEach((p) => {
    if (p.r === 'maior') lo = Math.max(lo, p.n + 1);
    if (p.r === 'menor') hi = Math.min(hi, p.n - 1);
  });
  const restam = fase.max - palpites.length;
  const tentativas = palpites.length;
  const idealN = ideal(fase.n);
  const base = tentativas <= idealN ? 3 : tentativas <= idealN + 2 ? 2 : 1;
  const estr = Math.max(1, base - (dica ? 1 : 0));

  function palpitar(e) {
    e.preventDefault();
    if (estado !== 'jogando') return;
    const t = val.trim();
    const n = Number(t);
    if (!/^\d+$/.test(t) || n < 1 || n > fase.n) { setMsg(`Digite um número inteiro de 1 a ${fase.n}.`); return; }
    if (n < lo || n > hi) { setMsg(`O ${n} já foi descartado pelas dicas anteriores. Escolha um número dentro do intervalo possível.`); return; }
    const r = n === segredo ? 'certo' : n < segredo ? 'maior' : 'menor';
    const novos = [...palpites, { n, r }];
    setPalpites(novos); setVal(''); setMsg('');
    if (r === 'certo') {
      const b = novos.length <= idealN ? 3 : novos.length <= idealN + 2 ? 2 : 1;
      const e2 = Math.max(1, b - (dica ? 1 : 0));
      salvarEstrelas('numero', i, e2);
      setPts((p) => p + e2 * 100); setTot((t2) => t2 + e2);
      setEstado('ganhou');
    } else if (novos.length >= fase.max) {
      setEstado('perdeu');
    }
  }

  function novaRodada(idx, repetida = false) {
    setSegredo(sorteio(FASES[idx].n, idx, repetida)); setPalpites([]); setVal(''); setMsg(''); setDica(false); setEstado('jogando');
  }
  function proxima() {
    if (i === FASES.length - 1) { setFim(true); return; }
    setI(i + 1); novaRodada(i + 1);
  }
  function reiniciar() { setI(0); setPts(0); setTot(0); setFim(false); novaRodada(0); }

  const pos = (n) => ((n - 0.5) / fase.n) * 100;
  const seqIdeal = sequenciaIdeal(fase.n, segredo);
  const meio = Math.floor((lo + hi) / 2);

  return (
    <Moldura titulo="Adivinhe o Número" conceito="Busca binária" fase={fim ? FASES.length : i} total={FASES.length} pontos={pts} onSair={onSair}>
      {fim ? (
        <Resultado pontos={pts} estrelas={tot} max={FASES.length * 3} conceito={CONCEITO} onRepetir={reiniciar} onSair={onSair} />
      ) : (
        <div className="jg-corpo">
          <p className="enun">{fase.txt}</p>

          <div className="faixa-num" aria-label={`O número está entre ${lo} e ${hi}`}>
            <div className="trilho">
              <i className="vivo" style={{ left: ((lo - 1) / fase.n) * 100 + '%', width: ((hi - lo + 1) / fase.n) * 100 + '%' }} />
              {palpites.map((p, k) => <b key={k} className={p.r} style={{ left: pos(p.n) + '%' }} title={`${p.n}`} />)}
            </div>
            <div className="ext"><span>1</span><span>{fase.n}</span></div>
            <p className="intervalo">Ainda possível: <b>{lo}</b> a <b>{hi}</b> <small>({hi - lo + 1} {hi - lo + 1 === 1 ? 'número' : 'números'})</small></p>
          </div>

          <div className="tent" aria-label={`${restam} tentativas restantes`}>
            {Array.from({ length: fase.max }, (_, k) => <i key={k} className={k < tentativas ? 'usada' : ''} />)}
            <span>{Math.max(restam, 0)} {restam === 1 ? 'tentativa' : 'tentativas'}</span>
          </div>

          {estado === 'jogando' && (
            <>
              <form className="resp" onSubmit={palpitar}>
                <input autoFocus inputMode="numeric" autoComplete="off" aria-label="Seu palpite" placeholder="Seu palpite" value={val} onChange={(e) => setVal(e.target.value)} />
                <button className="btn" type="submit">Chutar</button>
              </form>
              <div className="msgs" aria-live="polite">{msg && <p className="erro">{msg}</p>}</div>
              <Dica texto={`o número do meio do intervalo possível é ${meio}. Chutar o meio elimina metade das opções, não importa a resposta.`} usada={dica} onUsar={() => setDica(true)} />
            </>
          )}

          {palpites.length > 0 && (
            <ol className="hist" aria-label="Seus palpites">
              {palpites.map((p, k) => (
                <li key={k} className={p.r}>
                  <b>{p.n}</b>
                  <span>{p.r === 'certo' ? 'Acertou!' : p.r === 'maior' ? 'O número é maior ▲' : 'O número é menor ▼'}</span>
                </li>
              ))}
            </ol>
          )}

          {estado === 'ganhou' && (
            <FaseOk estrelas={estr} pontos={estr * 100} ultima={i === FASES.length - 1} onProxima={proxima}
              titulo={`Acertou em ${tentativas} ${tentativas === 1 ? 'tentativa' : 'tentativas'}!`}>
              <span className="tag2">VOCÊ × ESTRATÉGIA IDEAL</span>
              <div className="comp">
                <div><small>Seus palpites</small><div className="chips2">{palpites.map((p, k) => <span key={k}>{p.n}</span>)}</div></div>
                <div><small>Busca binária ({seqIdeal.length} {seqIdeal.length === 1 ? 'palpite' : 'palpites'})</small><div className="chips2 ideal">{seqIdeal.map((n, k) => <span key={k}>{n}</span>)}</div></div>
              </div>
              <p>Dividindo sempre o intervalo ao meio, qualquer número de 1 a {fase.n} sai em no máximo <b>{idealN}</b> tentativas (log₂({fase.n}) ≈ {Math.log2(fase.n).toFixed(1).replace('.', ',')}).</p>
            </FaseOk>
          )}

          {estado === 'perdeu' && (
            <div className="fok perdeu">
              <h3>Acabaram as tentativas!</h3>
              <p>O número era <b>{segredo}</b>. A busca binária o acharia em {seqIdeal.length} {seqIdeal.length === 1 ? 'palpite' : 'palpites'}: {seqIdeal.join(' → ')}.</p>
              <p>Dica de ouro: chute sempre o número do meio do intervalo possível.</p>
              <button type="button" className="btn" onClick={() => novaRodada(i, true)} autoFocus>Tentar de novo</button>
            </div>
          )}
        </div>
      )}
    </Moldura>
  );
}
