import { useEffect, useMemo, useRef, useState } from 'react';
import Buddy from './Buddy.jsx';
import { DueloCtx, definirSemente } from './comum.jsx';
import { abrirSala, gerarCodigo, limparCodigo, novoId, onlineDisponivel } from './sala.js';

const fmt = (ms) => {
  const s = Math.max(0, ms) / 1000;
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};
const fmtFino = (ms) => {
  const s = Math.max(0, ms) / 1000;
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toFixed(1).padStart(4, '0')}`;
};
const somar = (res, campo) => res.reduce((a, r) => a + (r[campo] || 0), 0);

// Regra do duelo: mais estrelas vence; empatou, vence o menor tempo total; igual nos dois, empate.
// Quem abandona (ou some da sala) sem terminar perde.
function decidir(res, aband, n) {
  const completo = (s) => res[s].length >= n;
  const perdeu = (s) => aband[s] && !completo(s);
  if (perdeu(0) && !perdeu(1)) return { venc: 1, motivo: 'abandono' };
  if (perdeu(1) && !perdeu(0)) return { venc: 0, motivo: 'abandono' };
  const e0 = somar(res[0], 'estrelas'); const e1 = somar(res[1], 'estrelas');
  if (e0 !== e1) return { venc: e0 > e1 ? 0 : 1, motivo: 'estrelas' };
  const t0 = somar(res[0], 'ms'); const t1 = somar(res[1], 'ms');
  if (t0 !== t1) return { venc: t0 < t1 ? 0 : 1, motivo: 'tempo' };
  return { venc: null, motivo: 'empate' };
}

function Seletor({ lista, selecao, onToggle, somenteLeitura }) {
  return (
    <fieldset className="dl-jogos">
      <legend>{somenteLeitura ? 'Jogos do duelo' : 'Escolha os jogos do duelo'}</legend>
      {lista.map((j) => {
        const on = selecao.includes(j.id);
        return (
          <label key={j.id} className={'dl-jg' + (on ? ' on' : '')}>
            <input type="checkbox" checked={on} disabled={somenteLeitura} onChange={() => onToggle(j.id)} />
            <span><b>{j.nome}</b><small>{j.fases} {j.fases === 1 ? 'fase' : 'fases'}</small></span>
          </label>
        );
      })}
    </fieldset>
  );
}

function Cabeca({ titulo, texto, nivelTxt }) {
  return (
    <div className="jogos-h">
      <Buddy expr="feliz" mini />
      <div>
        <span className="tag2">⚔️ DUELO · NÍVEL {nivelTxt}</span>
        <h1>{titulo}</h1>
        {texto && <p>{texto}</p>}
      </div>
    </div>
  );
}

export default function Duelo({ nivel, todos, nomeNivel, onSair }) {
  const [etapa, setEtapa] = useState('modo'); // modo | online | locnomes | sala | troca | contagem | jogo | fim
  const [modo, setModo] = useState(null); // online | local
  const [nivelSala, setNivelSala] = useState(nivel);
  const [selecao, setSelecao] = useState(() => todos.filter((j) => j.nivel === nivel).map((j) => j.id)); // ids dos jogos do duelo
  const [nome, setNome] = useState('');
  const [nomeLocal, setNomeLocal] = useState(['', '']);
  const [codigoDigitado, setCodigoDigitado] = useState('');
  const [codigo, setCodigo] = useState('');
  const [souHost, setSouHost] = useState(true);
  const [status, setStatus] = useState('');
  const [erro, setErro] = useState('');
  const [outros, setOutros] = useState([]);
  const [nomeAdv, setNomeAdv] = useState('Oponente');
  const [slot, setSlot] = useState(0);
  const [idx, setIdx] = useState(0);
  const [resultados, setResultados] = useState([[], []]);
  const [meuPontos, setMeuPontos] = useState(0);
  const [opLive, setOpLive] = useState({ idx: 0, pontos: 0 });
  const [opAbandonou, setOpAbandonou] = useState(false);
  const [opSumiu, setOpSumiu] = useState(false);
  const [euAbandonei, setEuAbandonei] = useState(false);
  const [conta, setConta] = useState(3);
  const [, setTick] = useState(0);

  const meuId = useRef(novoId()).current;
  const salaRef = useRef(null);
  const t0 = useRef(0);
  const feitos = useRef(new Set());
  const R = useRef({});

  const jogosNivel = useMemo(() => todos.filter((j) => j.nivel === nivelSala), [todos, nivelSala]);
  const jogos = useMemo(() => jogosNivel.filter((j) => selecao.includes(j.id)), [jogosNivel, selecao]);
  const n = jogos.length;
  const maxEstrelas = jogos.reduce((a, j) => a + j.fases * 3, 0);
  const online = modo === 'online';
  const meuSlot = online ? (souHost ? 0 : 1) : slot;
  const meuNome = (nome.trim() || 'Jogador').slice(0, 16);
  const adv = souHost ? outros.find((p) => !p.host) : outros.find((p) => p.host);
  const nomes = online
    ? (souHost ? [meuNome, nomeAdv] : [nomeAdv, meuNome])
    : [nomeLocal[0].trim() || 'Jogador 1', nomeLocal[1].trim() || 'Jogador 2'];

  R.current = { slot: meuSlot, idx, resultados, n, modo, jogos, online };

  useEffect(() => { if (adv) setNomeAdv(adv.nome); }, [adv]);
  useEffect(() => () => { definirSemente(null); if (salaRef.current) salaRef.current.sair(); }, []);
  useEffect(() => { document.title = 'Duelo — Clube D/S'; }, []);

  // ---------- comunicação ----------
  const enviar = (tipo, dados) => { if (salaRef.current) salaRef.current.enviar(tipo, dados); };

  function aoReceber(m) {
    if (m.tipo === 'start') { iniciar(m.seed, m.jogos); }
    else if (m.tipo === 'prog') { setOpLive({ idx: m.idx, pontos: m.pontos }); }
    else if (m.tipo === 'res') { setResultados((prev) => { const c = [prev[0], prev[1]]; c[m.slot] = m.res; return c; }); }
    else if (m.tipo === 'abandono') { setOpAbandonou(true); }
  }

  async function conectar(cod, host) {
    setErro(''); setStatus('conectando'); setCodigo(cod); setSouHost(host); setOutros([]); setEtapa('sala');
    if (host) setNivelSala(nivel);
    try {
      salaRef.current = await abrirSala(cod, { id: meuId, nome: meuNome, host, nivel: host ? nivel : null, jogos: host ? selecao : null }, {
        onPresenca: (lista) => {
          const outros2 = lista.filter((p) => p.id !== meuId);
          setOutros(outros2);
          const h = outros2.find((p) => p.host);
          if (!host && h) {
            if (h.nivel) setNivelSala(h.nivel);
            if (Array.isArray(h.jogos)) setSelecao(h.jogos);
          }
        },
        onMsg: aoReceber,
        onStatus: (s) => {
          setStatus(s);
          if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') setErro('Não foi possível conectar à sala. Verifique a internet e tente de novo.');
        },
      });
    } catch {
      setErro('Não foi possível conectar. Tente de novo em instantes.');
      setEtapa('online');
    }
  }

  function alternar(id) {
    const novo = jogosNivel.map((j) => j.id).filter((x) => (x === id ? !selecao.includes(id) : selecao.includes(x)));
    if (!novo.length) return; // pelo menos um jogo
    setSelecao(novo);
    if (salaRef.current) salaRef.current.atualizar({ jogos: novo });
  }

  function sairDaSala() {
    if (salaRef.current) { salaRef.current.sair(); salaRef.current = null; }
    setOutros([]); setStatus('');
  }

  // convidado: sala inexistente ou cheia
  useEffect(() => {
    if (etapa !== 'sala' || souHost || status !== 'SUBSCRIBED') return undefined;
    if (outros.some((p) => !p.host) && outros.some((p) => p.host)) { sairDaSala(); setErro('Essa sala já está cheia.'); setEtapa('online'); return undefined; }
    if (outros.some((p) => p.host)) return undefined;
    const t = setTimeout(() => { sairDaSala(); setErro('Sala não encontrada. Confira o código com o seu adversário.'); setEtapa('online'); }, 5000);
    return () => clearTimeout(t);
  }, [etapa, souHost, status, outros]);

  // oponente sumiu no meio do duelo (10 s sem voltar)
  useEffect(() => {
    if (!online || !['contagem', 'jogo', 'fim'].includes(etapa)) return undefined;
    if (adv) { setOpSumiu(false); return undefined; }
    const t = setTimeout(() => setOpSumiu(true), 10000);
    return () => clearTimeout(t);
  }, [online, etapa, adv]);

  // reenvia os meus resultados de tempos em tempos (garante que o outro lado receba, mesmo com uma queda de conexão)
  useEffect(() => {
    if (!online || !['jogo', 'fim'].includes(etapa)) return undefined;
    const id = setInterval(() => {
      const r = R.current;
      if (r.resultados[r.slot].length) enviar('res', { slot: r.slot, res: r.resultados[r.slot] });
    }, 3000);
    return () => clearInterval(id);
  }, [online, etapa]);

  // ---------- fluxo do duelo ----------
  function iniciar(seed, ids) {
    if (Array.isArray(ids)) setSelecao(ids);
    definirSemente(seed);
    feitos.current = new Set();
    setIdx(0); setResultados([[], []]); setMeuPontos(0); setOpLive({ idx: 0, pontos: 0 });
    setOpAbandonou(false); setOpSumiu(false); setEuAbandonei(false);
    setConta(3); setEtapa('contagem');
  }
  const novaSemente = () => (crypto.getRandomValues(new Uint32Array(1))[0] % 2147483647) + 1;

  function comecarOnline() { const seed = novaSemente(); enviar('start', { seed, jogos: selecao }); iniciar(seed); }
  function comecarLocal() { setSlot(0); iniciar(novaSemente()); }

  useEffect(() => {
    if (etapa !== 'contagem') return undefined;
    if (conta <= 0) { setEtapa('jogo'); return undefined; }
    const t = setTimeout(() => setConta((c) => c - 1), 900);
    return () => clearTimeout(t);
  }, [etapa, conta]);

  // o relógio de cada jogo começa quando ele aparece na tela
  useEffect(() => { if (etapa === 'jogo') t0.current = performance.now(); }, [etapa, idx, meuSlot]);
  useEffect(() => {
    if (etapa !== 'jogo') return undefined;
    const id = setInterval(() => setTick((x) => x + 1), 500);
    return () => clearInterval(id);
  }, [etapa]);

  const ctx = useMemo(() => ({
    ultimo: idx === n - 1,
    progresso: (pontos) => {
      setMeuPontos(pontos);
      const r = R.current;
      if (r.online) enviar('prog', { slot: r.slot, idx: r.idx, pontos });
    },
    concluir: ({ estrelas, pontos, max }) => {
      const r = R.current;
      const chave = `${r.slot}-${r.idx}`;
      if (feitos.current.has(chave)) return;
      feitos.current.add(chave);
      const j = r.jogos[r.idx];
      const item = { jogo: j.id, nome: j.nome, estrelas, pontos, max, ms: Math.round(performance.now() - t0.current) };
      const lista = [...r.resultados[r.slot], item];
      setResultados((prev) => { const c = [prev[0], prev[1]]; c[r.slot] = lista; return c; });
      if (r.online) enviar('res', { slot: r.slot, res: lista });
    },
    proximo: () => {
      const r = R.current;
      setMeuPontos(0);
      if (r.idx < r.n - 1) { setIdx(r.idx + 1); return; }
      if (r.modo === 'local' && r.slot === 0) { setSlot(1); setIdx(0); setEtapa('troca'); return; }
      setEtapa('fim');
    },
    abandonar: () => {
      const r = R.current;
      if (!window.confirm(r.online ? 'Abandonar o duelo? Seu adversário ganha a partida.' : 'Cancelar o duelo?')) return;
      if (r.online) { enviar('abandono', { slot: r.slot }); setEuAbandonei(true); setEtapa('fim'); } else onSair();
    },
  }), [idx, n]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- telas ----------
  if (etapa === 'modo') {
    return (
      <main className="jogos wrap duelo">
        <Cabeca nivelTxt={nomeNivel[nivelSala]} titulo="Como vai ser o duelo?" texto={`Vocês jogam os mesmos desafios do nível ${nomeNivel[nivel].toLowerCase()} (quem cria a sala escolhe quais jogos). Vence quem somar mais estrelas; se empatar, vence quem resolver mais rápido.`} />
        <div className="modos dl-modos">
          <button type="button" className="modo duelo" disabled={!onlineDisponivel} onClick={() => { setModo('online'); setErro(''); setEtapa('online'); }}>
            <i aria-hidden="true">🌐</i><b>Online</b>
            <span>{onlineDisponivel ? 'Cada um no seu aparelho, ao mesmo tempo, com um código de sala.' : 'Indisponível: falta configurar o Supabase (veja o README).'}</span>
          </button>
          <button type="button" className="modo solo" onClick={() => { setModo('local'); setEtapa('locnomes'); }}>
            <i aria-hidden="true">🤝</i><b>No mesmo aparelho</b>
            <span>Um joga e depois passa para o outro. Os desafios são idênticos.</span>
          </button>
        </div>
        <button type="button" className="btn ghost" onClick={onSair}>← Voltar</button>
      </main>
    );
  }

  if (etapa === 'online') {
    const podeEntrar = limparCodigo(codigoDigitado).length === 5;
    return (
      <main className="jogos wrap duelo">
        <Cabeca nivelTxt={nomeNivel[nivelSala]} titulo="Duelo online" texto="Crie uma sala e passe o código para o seu adversário, ou entre com o código que ele te mandar." />
        <div className="dl-caixa">
          <label className="dl-campo">Seu nome
            <input value={nome} maxLength={16} placeholder="Como quer ser chamado?" onChange={(e) => setNome(e.target.value)} />
          </label>
          {erro && <p className="erro" role="alert">{erro}</p>}
          <div className="dl-duas">
            <div>
              <h3>Criar sala</h3>
              <p>Você escolhe os jogos do nível {nomeNivel[nivel].toLowerCase()} e comanda o início.</p>
              <button type="button" className="btn" onClick={() => conectar(gerarCodigo(), true)}>Criar sala</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); if (podeEntrar) conectar(limparCodigo(codigoDigitado), false); }}>
              <h3>Entrar numa sala</h3>
              <input className="dl-cod-in" value={codigoDigitado} placeholder="CÓDIGO" aria-label="Código da sala" autoComplete="off" onChange={(e) => setCodigoDigitado(limparCodigo(e.target.value))} />
              <button type="submit" className="btn" disabled={!podeEntrar}>Entrar</button>
            </form>
          </div>
        </div>
        <button type="button" className="btn ghost" onClick={() => setEtapa('modo')}>← Voltar</button>
      </main>
    );
  }

  if (etapa === 'sala') {
    const conectando = status !== 'SUBSCRIBED';
    return (
      <main className="jogos wrap duelo">
        <Cabeca nivelTxt={nomeNivel[nivelSala]} titulo={souHost ? 'Sala criada' : 'Entrando na sala…'} texto={souHost ? 'Passe o código abaixo para o seu adversário.' : undefined} />
        <div className="dl-caixa dl-sala">
          <span className="tag2">CÓDIGO DA SALA</span>
          <div className="dl-codigo" aria-label={`Código ${codigo.split('').join(' ')}`}>{codigo}</div>
          {souHost && <button type="button" className="btn ghost sm" onClick={() => navigator.clipboard && navigator.clipboard.writeText(codigo)}>Copiar código</button>}
          <ul className="dl-lista">
            <li><b>{meuNome}</b> <small>(você){souHost ? ' · anfitrião' : ''}</small></li>
            <li className={adv ? '' : 'espera'}>{adv ? <><b>{adv.nome}</b>{adv.host ? <small> · anfitrião</small> : null}</> : (conectando ? 'Conectando…' : 'Aguardando adversário…')}</li>
          </ul>
          <Seletor lista={jogosNivel} selecao={selecao} onToggle={alternar} somenteLeitura={!souHost} />
          {erro && <p className="erro" role="alert">{erro}</p>}
          {souHost
            ? <button type="button" className="btn" disabled={!adv || !selecao.length} onClick={comecarOnline}>{adv ? 'Começar o duelo!' : 'Esperando o adversário entrar'}</button>
            : <p className="dl-nota">{adv ? `Nível ${nomeNivel[nivelSala]}. Aguardando ${adv.nome} começar o duelo…` : 'Procurando a sala…'}</p>}
        </div>
        <button type="button" className="btn ghost" onClick={() => { sairDaSala(); setEtapa('online'); }}>← Sair da sala</button>
      </main>
    );
  }

  if (etapa === 'locnomes') {
    return (
      <main className="jogos wrap duelo">
        <Cabeca nivelTxt={nomeNivel[nivelSala]} titulo="Quem vai duelar?" texto="Cada um joga a sua vez, sem olhar o outro. O primeiro joga todos os desafios, depois passa o aparelho." />
        <form className="dl-caixa" onSubmit={(e) => { e.preventDefault(); comecarLocal(); }}>
          {[0, 1].map((k) => (
            <label className="dl-campo" key={k}>Jogador {k + 1}
              <input value={nomeLocal[k]} maxLength={16} placeholder={`Jogador ${k + 1}`} onChange={(e) => setNomeLocal((v) => v.map((x, i) => (i === k ? e.target.value : x)))} />
            </label>
          ))}
          <Seletor lista={jogosNivel} selecao={selecao} onToggle={alternar} />
          <button type="submit" className="btn">Começar o duelo!</button>
        </form>
        <button type="button" className="btn ghost" onClick={() => setEtapa('modo')}>← Voltar</button>
      </main>
    );
  }

  if (etapa === 'troca') {
    return (
      <main className="jogos wrap duelo">
        <Cabeca nivelTxt={nomeNivel[nivelSala]} titulo={`Agora é a vez de ${nomes[1]}`} texto={`Passe o aparelho. ${nomes[1]}, os desafios são exatamente os mesmos de ${nomes[0]}. O resultado só aparece no final.`} />
        <button type="button" className="btn" onClick={() => { setConta(3); setEtapa('contagem'); }} autoFocus>Estou pronto!</button>
      </main>
    );
  }

  if (etapa === 'contagem') {
    return (
      <main className="jogos wrap duelo dl-conta" aria-live="assertive">
        <p>{online ? `${nomes[0]} × ${nomes[1]}` : `Vez de ${nomes[meuSlot]}`}</p>
        <div className="dl-num" key={conta}>{conta > 0 ? conta : 'JÁ!'}</div>
        <small>{n} {n === 1 ? 'desafio' : 'desafios'} · nível {nomeNivel[nivelSala]}</small>
      </main>
    );
  }

  const minhaLista = resultados[meuSlot];
  const opSlot = 1 - meuSlot;

  if (etapa === 'jogo') {
    const j = jogos[idx];
    const concluido = minhaLista.length > idx;
    const minhasEst = somar(minhaLista, 'estrelas') + (concluido ? 0 : Math.floor(meuPontos / 100));
    const tempo = somar(minhaLista, 'ms') + (concluido ? 0 : performance.now() - t0.current);
    const opLista = resultados[opSlot];
    const opEst = somar(opLista, 'estrelas') + (opLive.idx === opLista.length ? Math.floor(opLive.pontos / 100) : 0);
    return (
      <main className="wrap jogo-pg">
        <div className="dl-hud" role="status">
          <div className="dl-j eu"><small>{nomes[meuSlot]}</small><b>★ {minhasEst}</b></div>
          <div className="dl-c">
            <span>Jogo {idx + 1} de {n}</span>
            <b>⏱ {fmt(tempo)}</b>
          </div>
          {online
            ? (
              <div className={'dl-j op' + (opSumiu || opAbandonou ? ' off' : '')}>
                <small>{nomes[opSlot]}</small>
                <b>★ {opEst}</b>
                <em>{opAbandonou ? 'abandonou' : opSumiu ? 'desconectou' : opLista.length >= n ? 'terminou' : `jogo ${Math.min(opLista.length + 1, n)}/${n}`}</em>
              </div>
            )
            : <div className="dl-j op"><small>Máx.</small><b>★ {maxEstrelas}</b></div>}
        </div>
        <DueloCtx.Provider value={ctx}>
          <j.Comp key={`${meuSlot}-${idx}`} onSair={ctx.abandonar} />
        </DueloCtx.Provider>
      </main>
    );
  }

  // ---------- fim ----------
  const abandono = [false, false];
  abandono[meuSlot] = euAbandonei;
  abandono[opSlot] = online && (opAbandonou || opSumiu);
  const completo = (s) => resultados[s].length >= n;
  const aguardando = online && !euAbandonei && !completo(opSlot) && !abandono[opSlot];
  const { venc, motivo } = decidir(resultados, abandono, n);
  const euVenci = venc === meuSlot;
  const titulo = aguardando ? 'Você terminou!' : venc === null ? 'Empate!' : online ? (euVenci ? 'Você venceu! 🏆' : 'Você perdeu') : `${nomes[venc]} venceu! 🏆`;
  const explica = aguardando ? `Aguardando ${nomes[opSlot]} terminar os desafios…`
    : motivo === 'abandono' ? (abandono[0] && abandono[1] ? 'Os dois saíram.' : `Vitória por abandono de ${nomes[venc === 0 ? 1 : 0]}.`)
    : motivo === 'estrelas' ? 'Venceu por ter mais estrelas.'
    : motivo === 'tempo' ? 'Empate em estrelas: o desempate foi o tempo total de resolução.'
    : 'Mesmas estrelas e o mesmo tempo. Que duelo!';

  return (
    <main className="jogos wrap duelo">
      <Cabeca nivelTxt={nomeNivel[nivelSala]} titulo={titulo} texto={explica} />
      <div className="dl-final">
        {[0, 1].map((s) => {
          const lista = resultados[s];
          const est = somar(lista, 'estrelas');
          const ganhou = !aguardando && venc === s;
          return (
            <section key={s} className={'dl-card' + (ganhou ? ' ganhou' : '')}>
              <h2>{nomes[s]}{online && s === meuSlot ? ' (você)' : ''} {ganhou && '🏆'}</h2>
              <div className="dl-tot"><b>★ {est}</b><small>de {maxEstrelas}</small></div>
              <p className="dl-tempo">⏱ {lista.length ? fmtFino(somar(lista, 'ms')) : '—'} <small>tempo total</small></p>
              <ul>
                {jogos.map((j, k) => (
                  <li key={j.id}>
                    <span>{j.nome}</span>
                    {lista[k] ? <span>★ {lista[k].estrelas}/{lista[k].max} · {fmtFino(lista[k].ms)}</span> : <span className="pend">{abandono[s] ? 'não jogou' : 'jogando…'}</span>}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      <div className="res-b">
        {!aguardando && <button type="button" className="btn" onClick={() => { sairDaSala(); definirSemente(null); setEtapa('modo'); setModo(null); }}>Novo duelo</button>}
        <button type="button" className="btn ghost" onClick={onSair}>{aguardando ? 'Sair' : 'Voltar aos desafios'}</button>
      </div>
    </main>
  );
}
