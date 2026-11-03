import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Intro from '../desafios/Intro.jsx';
import Buddy from '../desafios/Buddy.jsx';
import Padrao from '../desafios/Padrao.jsx';
import Numero from '../desafios/Numero.jsx';
import Fila from '../desafios/Fila.jsx';
import Luzes from '../desafios/Luzes.jsx';
import Bug from '../desafios/Bug.jsx';
import Robo from '../desafios/Robo.jsx';
import Hanoi from '../desafios/Hanoi.jsx';
import Portas from '../desafios/Portas.jsx';
import Duelo from '../desafios/Duelo.jsx';
import { Estrelas, lerProgresso } from '../desafios/comum.jsx';
import { alternarMudo, aoMudarMudo, estaMudo, pararTudo, aoMudarBloqueio, somBloqueado } from '../desafios/audio.js';
import '../desafios/desafios.css';

const JOGOS = [
  { nivel: 'facil', id: 'padrao', nome: 'Decifre o Padrão', conceito: 'Reconhecimento de padrões', fases: 8, Comp: Padrao,
    desc: 'Descubra a regra escondida em sequências de números, formas e cores e complete o próximo item.' },
  { nivel: 'facil', id: 'numero', nome: 'Adivinhe o Número', conceito: 'Busca binária', fases: 3, Comp: Numero,
    desc: 'Ache o número secreto com poucos palpites. Existe uma estratégia que sempre vence. Será que você a descobre?' },
  { nivel: 'facil', id: 'fila', nome: 'Ordene a Fila', conceito: 'Algoritmos de ordenação', fases: 4, Comp: Fila,
    desc: 'Barras embaralhadas, e você só pode trocar as vizinhas. Ordene com o menor número de trocas.' },
  { nivel: 'medio', id: 'luzes', nome: 'Lâmpadas Apagadas', conceito: 'Planejamento e efeitos em cadeia', fases: 5, Comp: Luzes,
    desc: 'Cada clique inverte uma lâmpada e as vizinhas. Planeje os cliques e apague todas, com o menor número possível.' },
  { nivel: 'medio', id: 'bug', nome: 'Caça ao Bug', conceito: 'Depuração e leitura de código', fases: 8, Comp: Bug,
    desc: 'Leia o código, simule a execução na cabeça e clique na linha que tem o erro. Dos mais óbvios aos mais sutis.' },
  { nivel: 'medio', id: 'robo', nome: 'Robô no Labirinto', conceito: 'Sequências, loops e condicionais', fases: 6, Comp: Robo,
    desc: 'Monte o programa com blocos para guiar o robô até a saída. Com limite de blocos, só loops e condicionais resolvem.' },
  { nivel: 'dificil', id: 'hanoi', nome: 'Torre de Hanói', conceito: 'Recursão e decomposição de problemas', fases: 4, Comp: Hanoi,
    desc: 'Mova os discos entre três pinos sem colocar um maior sobre um menor. Quanto mais discos, mais a recursão aparece.' },
  { nivel: 'dificil', id: 'portas', nome: 'Portas Lógicas', conceito: 'Lógica booleana e circuitos', fases: 7, Comp: Portas,
    desc: 'Escolha portas AND, OR e NOT para acender a lâmpada, de uma porta só até circuitos com tabela-verdade.' },
];

const NOME_NIVEL = { facil: 'FÁCIL', medio: 'MÉDIO', dificil: 'DIFÍCIL' };

export default function Desafios() {
  const [tela, setTela] = useState('intro'); // intro | niveis | jogos | duelo | <id do jogo>
  const [nivel, setNivel] = useState('facil');
  const [modo, setModo] = useState('solo'); // solo | duelo
  const [prog, setProg] = useState({});
  const [mudo, setMudo] = useState(estaMudo());
  const [bloq, setBloq] = useState(somBloqueado());

  // ao sair da página (voltar ao site), a música para
  useEffect(() => { const off = aoMudarMudo(setMudo); const off2 = aoMudarBloqueio(setBloq); return () => { off(); off2(); pararTudo(); }; }, []);
  useEffect(() => { document.title = 'Desafios de lógica — Clube D/S'; }, []);
  useEffect(() => { setProg(lerProgresso()); window.scrollTo(0, 0); }, [tela]);

  const jogo = JOGOS.find((j) => j.id === tela);
  const escolherModoNivel = (n, m) => { setNivel(n); setModo(m); setTela(m === 'duelo' ? 'duelo' : 'jogos'); };

  return (
    <div className="dz">
      <header className="dz-top">
        <Link to="/" className="dz-logo" aria-label="Voltar ao site do Clube D/S"><b>{'<D'}</b>/<b>{'S>'}</b> <span>Desafios</span></Link>
        <div className="dz-acoes">
          <button type="button" className={'som' + (bloq && !mudo ? ' chama' : '')} onClick={alternarMudo} aria-pressed={mudo} aria-label={mudo ? 'Ligar o som' : 'Desligar o som'}>{mudo ? '🔇 Som desligado' : bloq ? '🔈 Toque para ativar o som' : '🔊 Som ligado'}</button>
          <Link to="/" className="lnk">Voltar ao site</Link>
        </div>
      </header>

      {tela === 'intro' && <Intro onEscolher={escolherModoNivel} />}
      {tela === 'niveis' && <Intro direto modoInicial={modo} onEscolher={escolherModoNivel} />}

      {tela === 'duelo' && <Duelo nivel={nivel} todos={JOGOS} nomeNivel={NOME_NIVEL} onSair={() => setTela('niveis')} />}

      {tela === 'jogos' && (
        <main className="jogos wrap">
          <div className="jogos-h">
            <Buddy expr="feliz" mini />
            <div>
              <span className="tag2">NÍVEL {NOME_NIVEL[nivel]}</span>
              <h1>Escolha um desafio</h1>
              <p>Cada jogo tem fases que ficam mais difíceis. Faça com calma, peça dicas quando precisar e conquiste as 3 estrelas.</p>
            </div>
          </div>
          <div className="cards">
            {JOGOS.filter((j) => j.nivel === nivel).map((j, k) => {
              const est = (prog[j.id] || []).reduce((a, b) => a + (b || 0), 0);
              return (
                <article className={'jcard c' + k} key={j.id}>
                  <span className="jn">{k + 1}</span>
                  <h2>{j.nome}</h2>
                  <span className="chip2">{j.conceito}</span>
                  <p>{j.desc}</p>
                  <div className="jf">
                    <span>{j.fases} fases</span>
                    <span><Estrelas n={est > 0 ? Math.max(1, Math.round((est / (j.fases * 3)) * 3)) : 0} /> <small>{est}/{j.fases * 3}</small></span>
                  </div>
                  <button type="button" className="btn" onClick={() => setTela(j.id)}>{est > 0 ? 'Jogar de novo' : 'Jogar'}</button>
                </article>
              );
            })}
          </div>
          <button type="button" className="btn ghost" onClick={() => setTela('niveis')}>← Trocar de nível</button>
        </main>
      )}

      {jogo && <main className="wrap jogo-pg"><jogo.Comp onSair={() => setTela('jogos')} /></main>}
    </div>
  );
}
