import { useCallback, useEffect, useRef, useState } from 'react';
import Buddy from './Buddy.jsx';
import { FALAS, NIVEIS } from './falas.js';
import { frameUrl, preloadAll, reduzMovimento } from './assets.js';
import { tocarAbertura, tocarTema } from './audio.js';

const TEMPO_MIN = 3400; // tempo mínimo da tela de carregamento (o robô passa voando)
const ULTIMA = FALAS.length - 1;

export default function Intro({ direto = false, modoInicial = null, onEscolher }) {
  const reduz = reduzMovimento();
  const [fase, setFase] = useState(direto ? 'fala' : 'inicio'); // inicio | carregando | chegando | transformando | fala
  const [prog, setProg] = useState(0);
  const [frame, setFrame] = useState(1);
  const [i, setI] = useState(direto ? ULTIMA : 0);
  const [n, setN] = useState(direto ? FALAS[ULTIMA].t.length : 0);
  const [aviso, setAviso] = useState('');
  const [modo, setModo] = useState(modoInicial); // null | solo | duelo
  const real = useRef(0);

  // som: abertura enquanto o robô voa; tema em loop depois da tela de carregamento
  useEffect(() => {
    if (fase === 'fala') tocarTema();
    else if (fase !== 'inicio') tocarAbertura();
  }, [fase]);

  // 1) carrega as imagens enquanto o robô passa voando
  useEffect(() => {
    if (fase !== 'carregando') return undefined;
    const ini = Date.now();
    preloadAll((p) => { real.current = p; });
    const id = setInterval(() => {
      const p = Math.min(real.current, (Date.now() - ini) / TEMPO_MIN);
      setProg(p);
      if (p >= 1) { clearInterval(id); setFase('chegando'); }
    }, 60);
    return () => clearInterval(id);
  }, [fase]);

  // 2) bate de asas: troca de frame enquanto voa
  useEffect(() => {
    if (fase !== 'carregando' && fase !== 'chegando') return undefined;
    const id = setInterval(() => setFrame((f) => (f >= 18 ? 1 : f + 1)), 70);
    return () => clearInterval(id);
  }, [fase]);

  // 3) chegada: últimos frames (19 a 23) e vira o mascote
  useEffect(() => {
    if (fase !== 'transformando') return undefined;
    let f = 19;
    setFrame(19);
    const id = setInterval(() => {
      f += 1;
      if (f > 23) { clearInterval(id); setFase('fala'); } else setFrame(f);
    }, 120);
    return () => clearInterval(id);
  }, [fase]);

  // 4) máquina de escrever
  const fala = FALAS[i];
  const digitando = fase === 'fala' && n < fala.t.length && !aviso;
  useEffect(() => {
    if (fase !== 'fala') return undefined;
    if (reduz) { setN(FALAS[i].t.length); return undefined; }
    setN((x) => (direto && i === ULTIMA ? x : 0));
    const id = setInterval(() => setN((x) => {
      if (x >= FALAS[i].t.length) { clearInterval(id); return x; }
      return x + 1;
    }), 24);
    return () => clearInterval(id);
  }, [fase, i, reduz, direto]);

  const perto = FALAS.slice(0, i + 1).some((f) => f.perto);
  const animado = !!fala.animado;
  const fimDasFalas = i === ULTIMA && n >= fala.t.length;
  const texto = aviso || fala.t.slice(0, n);

  const avancar = useCallback(() => {
    if (fase !== 'fala' || aviso) return;
    if (n < FALAS[i].t.length) { setN(FALAS[i].t.length); return; }
    if (i < ULTIMA) setI(i + 1);
  }, [fase, aviso, n, i]);

  useEffect(() => {
    const tecla = (e) => {
      if (['BUTTON', 'A', 'INPUT'].includes(e.target.tagName)) return;
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); avancar(); }
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [avancar]);

  // o clique no botão de play é o gesto que libera o som no navegador
  function comecar() {
    if (reduz) { tocarTema(); setFase('fala'); return; }
    tocarAbertura();
    setFase('carregando');
  }

  function pular() { setAviso(''); setI(ULTIMA); setN(FALAS[ULTIMA].t.length); setFase('fala'); }

  function escolher(nv) {
    if (nv.pronto) { onEscolher(nv.id, modo); return; }
    setAviso(`Opa! O nível ${nv.nome} ainda está sendo preparado por aqui. Que tal aquecer os circuitos no Fácil primeiro?`);
  }

  const voando = fase === 'carregando' || fase === 'chegando' || fase === 'transformando';
  const pct = Math.round((fase === 'carregando' ? prog : 1) * 100);

  return (
    <div className="intro">
      {fase === 'inicio' && (
        <div className="inicio">
          <button type="button" className="play" onClick={comecar} aria-label="Começar os desafios de lógica">
            <img src="/buddy/play.webp" alt="" draggable="false" />
          </button>
          <p>Clique para começar</p>
        </div>
      )}

      {fase !== 'inicio' && (fase !== 'fala' || !direto) ? (
        <button type="button" className="pular" onClick={pular} hidden={fase === 'fala' && fimDasFalas}>Pular introdução ›</button>
      ) : null}

      {voando && (
        <div className="faixa" aria-hidden="true">
          <div
            className={'voo ' + (fase === 'carregando' ? 'passa' : fase === 'chegando' ? 'chega' : 'parado')}
            onAnimationEnd={(e) => { if (e.target === e.currentTarget && fase === 'chegando') setFase('transformando'); }}
          >
            <img className="bob" src={frameUrl(frame)} alt="" draggable="false" />
          </div>
        </div>
      )}

      {(fase === 'carregando' || fase === 'chegando') && (
        <div className="carga" role="status" aria-live="polite">
          <p>{fase === 'carregando' ? 'Carregando desafios…' : 'Tudo pronto! Alguém está chegando…'}</p>
          <div className="carga-bar"><i style={{ width: pct + '%' }} /></div>
          <small>{pct}%</small>
        </div>
      )}

      {fase === 'fala' && (
        <div className="cena">
          <Buddy expr="normal" falando={digitando} animado={animado} perto={perto} className="pop" />
          <div className={'balao' + (animado ? ' grita' : '')} onClick={avancar} aria-live="polite">
            <span className="quem">Buddy</span>
            <p>{texto}<span className="cursor" aria-hidden="true">{digitando ? '▍' : ''}</span></p>
          </div>

          {!fimDasFalas && !aviso && (
            <button type="button" className="btn" onClick={avancar}>{digitando ? 'Mostrar tudo' : 'Continuar ▸'}</button>
          )}
          {aviso && <button type="button" className="btn ghost" onClick={() => setAviso('')}>Ok, entendi</button>}

          {fimDasFalas && !aviso && !modo && (
            <div className="modos" role="group" aria-label="Escolha como jogar">
              <button type="button" className="modo solo" onClick={() => setModo('solo')}>
                <i aria-hidden="true">🎮</i>
                <b>Jogar sozinho</b>
                <span>Treine no seu ritmo, peça dicas e colecione estrelas.</span>
              </button>
              <button type="button" className="modo duelo" onClick={() => setModo('duelo')}>
                <i aria-hidden="true">⚔️</i>
                <b>Duelo</b>
                <span>Dois jogadores, os mesmos desafios. Vence quem fizer mais estrelas.</span>
              </button>
            </div>
          )}

          {fimDasFalas && !aviso && modo && (
            <>
              <p className="modo-atual">
                Modo: <b>{modo === 'duelo' ? '⚔️ Duelo' : '🎮 Sozinho'}</b>
                <button type="button" className="lnk" onClick={() => setModo(null)}>trocar</button>
              </p>
              <div className="niveis" role="group" aria-label="Escolha o nível">
                {NIVEIS.map((nv) => (
                  <button key={nv.id} type="button" className={'nivel ' + nv.cor + (nv.pronto ? '' : ' trava')} onClick={() => escolher(nv)}>
                    <b>{nv.nome}</b>
                    <span>{nv.pronto ? nv.desc : 'Em breve'}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
