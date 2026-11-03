import { createContext, useContext, useEffect } from 'react';
import Buddy from './Buddy.jsx';

// ---- Modo duelo ----
// Quando um duelo está em andamento, o componente Duelo fornece este contexto. Os jogos não precisam
// saber nada sobre o duelo: Moldura e Resultado (abaixo) avisam o contexto o que está acontecendo.
export const DueloCtx = createContext(null);

// ---- Aleatoriedade controlada ----
// No duelo os dois jogadores precisam receber exatamente os mesmos puzzles. Cada fase de cada jogo
// recebe uma semente própria (semente do duelo + jogo + fase), então o resultado não depende de
// quantas vezes cada jogador clicou, errou ou reiniciou. Fora do duelo (semente nula) é Math.random.
let semente = null;
let gerador = null;
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashTexto(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
export function definirSemente(s) { semente = s; gerador = null; }
export function semearFase(jogo, fase) { gerador = semente == null ? null : mulberry32(hashTexto(`${semente}|${jogo}|${fase}`)); }
export function soltarSemente() { gerador = null; }
export const aleatorio = () => (gerador ? gerador() : Math.random());

const CHAVE = 'clubeds:desafios:v1';

export function lerProgresso() {
  try { return JSON.parse(localStorage.getItem(CHAVE)) || {}; } catch { return {}; }
}
export function salvarEstrelas(jogo, fase, est) {
  try {
    const p = lerProgresso();
    const arr = p[jogo] || [];
    arr[fase] = Math.max(arr[fase] || 0, est);
    p[jogo] = arr;
    localStorage.setItem(CHAVE, JSON.stringify(p));
  } catch { /* sem armazenamento: segue sem salvar */ }
}

// 0 erros/dicas = 3 estrelas; até 2 = 2 estrelas; mais que isso = 1
export const estrelasPorPenalidade = (p) => (p <= 0 ? 3 : p <= 2 ? 2 : 1);

export function Estrelas({ n, max = 3, grande = false }) {
  return (
    <span className={'est' + (grande ? ' g' : '')} role="img" aria-label={`${n} de ${max} estrelas`}>
      {Array.from({ length: max }, (_, k) => <i key={k} className={k < n ? 'on' : ''}>★</i>)}
    </span>
  );
}

export function Moldura({ titulo, conceito, fase, total, pontos, onSair, children }) {
  const duelo = useContext(DueloCtx);
  useEffect(() => { if (duelo) duelo.progresso(pontos); }, [pontos]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="jg">
      <div className="jg-top">
        {duelo
          ? <button type="button" className="lnk" onClick={duelo.abandonar}>✕ Abandonar</button>
          : <button type="button" className="lnk" onClick={onSair}>← Jogos</button>}
        <div className="jg-tt"><h2>{titulo}</h2><span>{conceito}</span></div>
        <div className="jg-pts"><b>{pontos}</b> pts</div>
      </div>
      {total > 0 && (
        <div className="jg-fases" aria-label={`Fase ${Math.min(fase + 1, total)} de ${total}`}>
          {Array.from({ length: total }, (_, k) => <i key={k} className={k < fase ? 'ok' : k === fase ? 'atual' : ''} />)}
          <span>Fase {Math.min(fase + 1, total)} de {total}</span>
        </div>
      )}
      {children}
    </div>
  );
}

export function Dica({ texto, usada, onUsar }) {
  if (usada) return <div className="dica"><b>Dica:</b> {texto}</div>;
  return <button type="button" className="btn ghost sm" onClick={onUsar}>Pedir dica <small>(−1 estrela)</small></button>;
}

export function FaseOk({ estrelas, pontos, ultima, onProxima, children, titulo = 'Fase concluída!', expr = 'feliz' }) {
  return (
    <div className="fok">
      <div className="fok-h">
        <Buddy expr={expr} mini />
        <div>
          <h3>{titulo}</h3>
          <Estrelas n={estrelas} grande />
          <p>+{pontos} pontos</p>
        </div>
      </div>
      <div className="fok-b">{children}</div>
      <button type="button" className="btn" onClick={onProxima} autoFocus>{ultima ? 'Ver resultado final' : 'Próxima fase →'}</button>
    </div>
  );
}

// Tela final: explica qual conceito de programação foi praticado
export function Resultado({ pontos, estrelas, max, conceito, onRepetir, onSair }) {
  const duelo = useContext(DueloCtx);
  useEffect(() => { if (duelo) duelo.concluir({ pontos, estrelas, max }); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const razao = estrelas / max;
  return (
    <div className="res">
      <div className="res-h">
        <Buddy expr="feliz" mini />
        <div>
          <h3>{razao >= 0.8 ? 'Que desempenho!' : razao >= 0.5 ? 'Muito bem!' : 'Boa jornada!'}</h3>
          <Estrelas n={Math.round(razao * 3)} grande />
          <p><b>{pontos}</b> pontos · {estrelas} de {max} estrelas</p>
        </div>
      </div>
      <div className="res-c">
        <span className="tag2">CONCEITO PRATICADO</span>
        <h4>{conceito.nome}</h4>
        {conceito.paragrafos.map((p) => <p key={p}>{p}</p>)}
        {conceito.codigo && <pre aria-label="Exemplo em Python"><code>{conceito.codigo}</code></pre>}
      </div>
      <div className="res-b">
        {duelo ? (
          <button type="button" className="btn" onClick={duelo.proximo} autoFocus>{duelo.ultimo ? 'Ver resultado do duelo →' : 'Próximo jogo →'}</button>
        ) : (
          <>
            <button type="button" className="btn" onClick={onRepetir}>Jogar de novo</button>
            <button type="button" className="btn ghost" onClick={onSair}>Voltar aos jogos</button>
          </>
        )}
      </div>
    </div>
  );
}
