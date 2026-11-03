import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CURSOS, PROFESSORES, LIDERES, PROJETOS_HACKATHON, DESAFIOS_LIBERADO } from '../dados.js';

const AREAS = ['Web', 'Dados', 'Jogos', 'Mobile', 'Inteligência Artificial', 'Banco de dados', 'Segurança', 'Algoritmos', 'Robótica', 'Nuvem'];

const TABS = [
  { nome: 'Aulas mentoreadas', h: 'Aprender fazendo, com quem está na mesma jornada', p: 'Encontros semanais conduzidos por estudantes, docentes e convidados, combinando explicação e prática. Você reforça a base do curso, conhece ferramentas e áreas novas e sai com algo funcionando.',
    l: ['Lógica, fundamentos e ferramentas do dia a dia de quem programa', 'Introdução a novas linguagens e às áreas da Computação', 'Acompanhamento nos exercícios, miniprojetos e revisão de projetos', 'Material e projeto modelo para consultar depois'] },
  { nome: 'Competições e eventos', h: 'Hora de testar o que você sabe', p: 'O clube promove maratonas, desafios e hackathons internos e divulga eventos externos, para que você aplique o que aprendeu em situações próximas às do mercado e represente a escola.',
    l: ['Desafios de programação entre os alunos, com equipes mistas', 'Eventos internos organizados pelo clube', 'Participação em eventos fora da escola, com apoio na inscrição'] },
];

const SECOES = [
  { id: 'topo', nome: 'Início' },
  { id: 'clube', nome: 'O clube' },
  { id: 'atividades', nome: 'Atividades' },
  { id: 'hackathon', nome: 'Hackathon' },
  { id: 'professores', nome: 'Professores' },
  { id: 'curriculo', nome: 'Currículo' },
  { id: 'equipe', nome: 'Equipe' },
  { id: 'entrar', nome: 'Participar' },
];

const ATIVIDADES = ['Aula de Git e GitHub', 'Aula de lógica de programação', 'Maratona de programação', 'Projeto em equipe no portfólio', 'Apresentação de projeto em evento', 'Competição externa representando a escola'];

export default function Home() {
  // deixa o som dos desafios no cache para tocar no mesmo instante em que a nova aba abrir
  useEffect(() => { if (!DESAFIOS_LIBERADO) return; const a = new Audio('/audio/carregamento.mp3'); a.preload = 'auto'; a.load(); }, []);

  // enquanto os desafios não são liberados, o botão só mostra o aviso "Em breve"
  const [breve, setBreve] = useState(false);
  useEffect(() => {
    if (!breve) return;
    const fechar = (e) => { if (e.key === 'Escape') setBreve(false); };
    window.addEventListener('keydown', fechar);
    return () => window.removeEventListener('keydown', fechar);
  }, [breve]);
  const botaoDesafios = DESAFIOS_LIBERADO
    ? <a className="btn bl" href="/desafios" target="_blank" rel="noopener noreferrer">Desafios de lógica ↗</a>
    : <button type="button" className="btn bl" onClick={() => setBreve(true)}>Desafios de lógica</button>;

  const hero = useRef(null);
  const [aba, setAba] = useState(0);
  const [sel, setSel] = useState([]);
  const [ativa, setAtiva] = useState('topo');
  const rail = useRef(null);
  const trilha = useRef(null);

  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.15 });
    document.querySelectorAll('.rv').forEach((el, i) => { el.style.transitionDelay = (i % 3) * 90 + 'ms'; io.observe(el); });
    return () => io.disconnect();
  }, []);

  // descobre qual seção está no meio da tela
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) setAtiva(e.target.id);
    }), { rootMargin: '-45% 0px -50% 0px' });
    SECOES.forEach((x) => { const el = document.getElementById(x.id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);

  // no celular, o nome da seção aparece por um instante a cada mudança
  useEffect(() => {
    if (!rail.current) return;
    rail.current.classList.add('ping');
    const t = setTimeout(() => rail.current && rail.current.classList.remove('ping'), 2200);
    return () => clearTimeout(t);
  }, [ativa]);

  // linha de progresso da rolagem
  useEffect(() => {
    let raf = 0;
    const atualizar = () => {
      raf = 0;
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, h.scrollTop / total)) : 0;
      if (trilha.current) trilha.current.style.setProperty('--p', p);
    };
    const aoRolar = () => { if (!raf) raf = requestAnimationFrame(atualizar); };
    atualizar();
    window.addEventListener('scroll', aoRolar, { passive: true });
    window.addEventListener('resize', aoRolar);
    return () => { window.removeEventListener('scroll', aoRolar); window.removeEventListener('resize', aoRolar); if (raf) cancelAnimationFrame(raf); };
  }, []);

  function brilho(e) {
    const r = hero.current.getBoundingClientRect();
    hero.current.style.setProperty('--mx', e.clientX - r.left + 'px');
    hero.current.style.setProperty('--my', e.clientY - r.top + 'px');
  }
  const alternar = (i) => setSel((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
  const ordenadas = [...sel].sort((a, b) => a - b);
  const t = TABS[aba];

  return (
    <>
      <nav className="rail" ref={rail} aria-label="Seções da página">
        <ul ref={trilha}>
          {SECOES.map((x) => (
            <li key={x.id}>
              <a href={'#' + x.id} aria-current={ativa === x.id ? 'true' : undefined} aria-label={x.nome}>
                <span className="t" aria-hidden="true">{x.nome}</span>
              </a>
            </li>
          ))}
        </ul>
        <Link className="rail-cta" to="/participar" aria-label="Quero participar">
          +<span className="t" aria-hidden="true">Quero participar</span>
        </Link>
      </nav>

      <header className="hero" id="topo" ref={hero} onPointerMove={brilho}>
        <div className="wrap">
          <div className="tag">CLUBE</div>
          <div className="mark" aria-label="Clube D/S">
            <i className="c1">{'<'}</i><i className="d">D</i><i className="sl">/</i><i className="s">S</i><i className="c2">{'>'}</i>
          </div>
          <h1>Programação na prática, junto com a sua turma.</h1>
          <p className="lead">O clube de programação da Escola Técnica SENAI CIMATEC. Uma iniciativa estudantil que complementa a sua formação técnica com aulas mentoreadas, competições e projetos reais, sempre de alunos para alunos.</p>
          <div className="cta">
            <Link className="btn" to="/participar">Quero participar</Link>
            <a className="btn ghost" href="#clube">Conhecer o clube</a>
            {botaoDesafios}
          </div>
        </div>
      </header>

      <div className="mq" aria-hidden="true">
        <div>
          {[0, 1].flatMap((k) => AREAS.flatMap((a) => [<span key={k + a}>{a}</span>, <span key={k + a + '/'} style={{ color: 'var(--mut)' }}>/</span>]))}
        </div>
      </div>

      <section id="clube">
        <div className="wrap about">
          <div className="rv">
            <h2>O que é o Clube D/S</h2>
            <p className="sub">É um espaço dos alunos, feito para aprender fazendo. O clube apresenta as várias áreas da Computação, incentiva a prática e leva os membros a competições e eventos, internos e externos.</p>
            <p className="sub">Você não precisa ser expert para entrar. Precisa de vontade de criar, testar e aprender com os colegas.</p>
          </div>
          <div className="goals">
            <div className="goal rv"><h3>Complementar a formação</h3><p>Conteúdos e desafios que vão além da sala de aula e reforçam o curso técnico.</p></div>
            <div className="goal rv"><h3>Explorar a Computação</h3><p>Conheça áreas diferentes para descobrir com qual delas você mais se identifica.</p></div>
            <div className="goal rv"><h3>Praticar de verdade</h3><p>Projetos, competições e eventos para colocar o que você aprendeu em uso.</p></div>
          </div>
        </div>
      </section>

      <section id="atividades" style={{ background: 'var(--bg2)', borderBlock: '1px solid var(--line)' }}>
        <div className="wrap">
          <div className="rv"><h2>O que acontece no clube</h2><p className="sub">Aulas, competições e eventos pensados para você aprender, praticar e se conectar. Escolha um formato para ver como funciona.</p></div>
          <div className="panel rv">
            <div className="tabs" role="tablist">
              {TABS.map((x, i) => (
                <button key={x.nome} role="tab" aria-selected={aba === i} onClick={() => setAba(i)}>{x.nome}</button>
              ))}
            </div>
            <div className="tp on" role="tabpanel" key={aba}>
              <div><h3>{t.h}</h3><p>{t.p}</p></div>
              <ul>{t.l.map((li) => <li key={li}>{li}</li>)}</ul>
            </div>
          </div>
        </div>
      </section>

      <section id="hackathon">
        <div className="wrap">
          <div className="rv"><h2>Power Tech Hackathon</h2><p className="sub">O evento que reuniu alunos de toda a escola para criar tecnologia em equipe.</p></div>
          <figure className="foto-larga rv">
            <img src="/equipe/hackathon.jpg" width="1600" height="620" loading="lazy" alt="Participantes do Power Tech Hackathon sentados e em pé no palco do auditório do SENAI CIMATEC, com o logo do evento projetado no telão" />
          </figure>
          <div className="hk">
            <div className="rv">
              <h3>De uma ideia no papel a um projeto de verdade</h3>
              <p>No Power Tech Hackathon, os participantes se juntaram para desenhar e construir projetos próprios. Foi o maior encontro de alunos que o clube já organizou.</p>
              <p>Hoje, esses projetos estão a um passo de se tornarem startups reais.</p>
            </div>
            <ul className="trilha rv">
              <li><b>Ideias que saíram do papel</b><span>Cada grupo transformou um problema em um projeto de tecnologia.</span></li>
              <li><b>Trabalho em equipe</b><span>Gente de áreas e cursos diferentes construindo junto.</span></li>
              <li><b>Próximo passo: startup</b><span>Os projetos seguem evoluindo para virar negócios de verdade.</span></li>
            </ul>
          </div>
          {PROJETOS_HACKATHON.length > 0 && (
            <div className="projs">
              {PROJETOS_HACKATHON.map((pj) => (
                <article className="proj rv" key={pj.nome}>
                  <h3>{pj.nome}</h3>
                  <p>{pj.texto}</p>
                  {pj.equipe && <small>Equipe: {pj.equipe}</small>}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="professores">
        <div className="wrap">
          <div className="rv"><h2>Professores</h2><p className="sub">Docentes que acompanham o clube de perto, orientam os estudantes e ajudam a transformar vontade de aprender em projetos de verdade.</p></div>
          <div className="profs">
            {PROFESSORES.map((p) => (
              <article className="prof rv" key={p.nome}>
                <div className="foto"><img src={p.foto} alt={p.alt} loading="lazy" /></div>
                <div className="info">
                  <h3>{p.nome}</h3>
                  <p>{p.papel}</p>
                  <div className="areas">{p.areas.map((a) => <span key={a}>{a}</span>)}</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="curriculo">
        <div className="wrap cv">
          <div className="rv">
            <h2>Atividades que contam no seu currículo</h2>
            <p className="sub">Cada experiência no clube vira uma linha para mostrar a recrutadores e professores. Clique nos exemplos e monte o seu.</p>
            <div className="acts">
              {ATIVIDADES.map((a, i) => (
                <button key={a} type="button" aria-pressed={sel.includes(i)} onClick={() => alternar(i)}>{a}</button>
              ))}
            </div>
          </div>
          <aside className="sheet rv" aria-live="polite">
            <h3>Seu currículo</h3><small>Exemplo interativo</small>
            <h4>Experiências no Clube D/S</h4>
            <ol>
              {ordenadas.length
                ? ordenadas.map((i) => <li key={i}>{ATIVIDADES[i]}</li>)
                : <li className="empty">Selecione uma atividade ao lado.</li>}
            </ol>
            <div className="bar"><i style={{ width: (ordenadas.length / ATIVIDADES.length) * 100 + '%' }} /></div>
            <div className="cnt">{ordenadas.length} de {ATIVIDADES.length} atividades</div>
          </aside>
        </div>
      </section>

      <section id="equipe" style={{ background: 'var(--bg2)', borderBlock: '1px solid var(--line)' }}>
        <div className="wrap">
          <div className="rv"><h2>Nossa equipe</h2><p className="sub">Os estudantes que dão vida ao Clube D/S: planejam, ensinam, organizam e representam a escola em cada atividade e evento.</p></div>

          <div className="gt rv">
            <h3>Diretoria</h3>
            <p>Os alunos que organizam o clube, planejam as atividades de cada semestre e levam o Clube D/S para os eventos, dentro e fora da escola.</p>
          </div>
          <figure className="foto-larga eq rv">
            <img src="/equipe/equipe.jpg" width="1220" height="685" loading="lazy" alt="A diretoria do Clube D/S reunida no palco, lado a lado, diante do painel do SENAI CIMATEC" />
            <figcaption>A diretoria do Clube D/S reunida.</figcaption>
          </figure>

          <div className="gt rv">
            <h3>Presidência</h3>
            <p>Quem lidera o clube, conduz as decisões da equipe e representa os alunos.</p>
          </div>
          <div className="pres">
            <figure className="pf rv">
              <img src="/equipe/presidentes.jpg" width="900" height="1200" loading="lazy" alt="O presidente e o vice-presidente do Clube D/S no palco, cada um com um microfone, falando para o público" />
            </figure>
            <div className="pl">
              {LIDERES.map((l) => (
                <article className="lider rv" key={l.cargo}>
                  <span className="cargo">{l.cargo}</span>
                  <h3>{l.nome}</h3>
                  <p>{l.texto}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="entrar">
        <div className="wrap">
          <div className="join rv">
            <h2>Faça parte do Clube D/S</h2>
            <p className="sub">Escolha o seu curso para começar a inscrição e entrar na comunidade do clube. Se quiser conhecer as regras e o funcionamento por dentro, leia também o nosso documento oficial.</p>
            <div className="chips">
              {CURSOS.map((c) => (
                <Link key={c} className="chip" to={'/participar?curso=' + encodeURIComponent(c)}>{c}</Link>
              ))}
            </div>
            <div className="join-cta">
              <Link className="btn" to="/participar">Quero participar</Link>
              {botaoDesafios}
              <a className="btn ghost" href="/documentos/ClubeDS-Documento-Oficial.pdf" target="_blank" rel="noopener noreferrer">Documento oficial (PDF)</a>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <span><b style={{ color: 'var(--or)' }}>{'<D'}</b>/<b style={{ color: 'var(--bl)' }}>{'S>'}</b> Clube D/S</span>
          <span>Clube de Programação · Escola Técnica SENAI CIMATEC</span>
        </div>
      </footer>
      {breve && (
        <div className="breve-bg" onClick={() => setBreve(false)}>
          <div className="breve" role="dialog" aria-modal="true" aria-labelledby="breve-t" onClick={(e) => e.stopPropagation()}>
            <span className="breve-tag">DESAFIOS DE LÓGICA</span>
            <h2 id="breve-t">Em breve</h2>
            <p>Estamos preparando os desafios. Em breve eles estarão disponíveis para todos.</p>
            <button type="button" className="btn" autoFocus onClick={() => setBreve(false)}>Entendi</button>
          </div>
        </div>
      )}
    </>
  );
}
