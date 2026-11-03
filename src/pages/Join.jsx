import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CURSOS } from '../dados.js';

const WHATSAPP_URL = 'https://chat.whatsapp.com/E1IorlIMs6lF2jipsT9Cwr?s=cl&p=a&mlu=4&ilr=4&iam=2';
// Endereço que recebe os dados do formulário (Google Apps Script -> Google Planilhas). Veja docs/google-apps-script.gs
const FORM_ENDPOINT = import.meta.env.VITE_FORM_ENDPOINT || '';
const DOMAINS = (import.meta.env.VITE_ALLOWED_EMAIL_DOMAINS || '')
  .split(',').map((d) => d.trim().toLowerCase()).filter(Boolean);

function mascaraTelefone(v) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const BENEFICIOS = [
  ['Avisos de aulas e eventos', 'Fique sabendo antes de todo mundo.'],
  ['Eventos e competições', 'Datas, inscrições e desafios do clube.'],
  ['Troca entre membros', 'Tire dúvidas e combine projetos em grupo.'],
];

export default function Join() {
  const [params] = useSearchParams();
  const cursoInicial = CURSOS.includes(params.get('curso')) ? params.get('curso') : '';
  const [f, setF] = useState({ nome: '', email: '', telefone: '', curso: cursoInicial });
  const [erro, setErro] = useState('');
  const [nome, setNome] = useState(null); // preenchido = cadastro concluído
  const [enviando, setEnviando] = useState(false);
  const [pergunta, setPergunta] = useState(false); // caixa "quer entrar na comunidade?"
  const comunidade = useRef(null);

  useEffect(() => {
    if (nome) setTimeout(() => comunidade.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 500);
  }, [nome]);

  const mudar = (campo) => (e) =>
    setF({ ...f, [campo]: campo === 'telefone' ? mascaraTelefone(e.target.value) : e.target.value });

  async function enviar(e) {
    e.preventDefault();
    if (enviando) return;
    const n = f.nome.trim();
    const email = f.email.trim().toLowerCase();
    const tel = f.telefone.replace(/\D/g, '');
    if (n.length < 3) return setErro('Informe seu nome completo.');
    if (DOMAINS.length && !DOMAINS.includes(email.split('@')[1])) return setErro('Use seu e-mail institucional.');
    if (tel.length < 10) return setErro('Telefone inválido. Use DDD + número.');
    if (!CURSOS.includes(f.curso)) return setErro('Escolha o seu curso.');
    setErro('');
    setEnviando(true);
    try {
      if (FORM_ENDPOINT) {
        // text/plain evita o preflight do CORS; o Apps Script lê o JSON em e.postData.contents
        await fetch(FORM_ENDPOINT, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ nome: n, email, telefone: f.telefone, curso: f.curso, enviadoEm: new Date().toISOString() }),
        });
      } else {
        console.warn('VITE_FORM_ENDPOINT não configurado: os dados não foram enviados a nenhum banco.');
      }
    } catch {
      setEnviando(false);
      return setErro('Não foi possível enviar agora. Verifique sua conexão e tente de novo.');
    }
    setEnviando(false);
    setNome(n.split(' ')[0]);
    setPergunta(true);
  }

  return (
    <>
      <nav className="topbar" aria-label="Principal">
        <Link className="lg" to="/"><b>{'<D'}</b>/<b>{'S>'}</b></Link>
        <Link className="btn ghost" to="/">Voltar</Link>
      </nav>

      <main className={'fp' + (nome ? ' col' : '')}>
        {!nome ? (
          <div className="card">
            <form onSubmit={enviar}>
              <h1>Quero participar</h1>
              <p className="sub">Preencha seus dados e entre na comunidade do clube.</p>
              <label>Nome completo
                <input value={f.nome} onChange={mudar('nome')} required minLength={3} maxLength={100} autoComplete="name" />
              </label>
              <label>E-mail institucional
                <input type="email" value={f.email} onChange={mudar('email')} required autoComplete="email" />
              </label>
              <label>Telefone <small>com DDD</small>
                <input type="tel" value={f.telefone} onChange={mudar('telefone')} required inputMode="numeric" placeholder="(71) 99999-9999" autoComplete="tel" />
              </label>
              <label>Curso
                <select value={f.curso} onChange={mudar('curso')} required>
                  <option value="" disabled>Selecione seu curso</option>
                  {CURSOS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              {erro && <p className="erro" role="alert">{erro}</p>}
              <button className="btn" type="submit" disabled={enviando}>{enviando ? 'Enviando...' : 'Enviar'}</button>
              <Link className="back" to="/">Voltar</Link>
            </form>
          </div>
        ) : (
          <>
            <div className="card" role="status">
              <div className="okmark">✓</div>
              <h1>Cadastro realizado com sucesso, {nome}!</h1>
              <p className="sub" style={{ margin: 0 }}>Você agora faz parte do Clube D/S ({f.curso}). Entre na nossa comunidade logo abaixo.</p>
            </div>

            <section className="comm" ref={comunidade} aria-label="Comunidade do Clube D/S">
              <div>
                <div className="tag2">COMUNIDADE</div>
                <h2>Comunidade <b className="o">{'<D'}</b>/<b className="b">{'S>'}</b></h2>
                <p className="sub" style={{ margin: '12px 0 24px' }}>O espaço dos membros no WhatsApp. É por lá que o clube divulga tudo o que acontece.</p>
                {WHATSAPP_URL ? (
                  <a className="btn wa" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">Entrar na comunidade</a>
                ) : (
                  <p className="erro">O link da comunidade ainda não foi configurado.</p>
                )}
              </div>
              <ul>
                {BENEFICIOS.map(([t, d]) => (
                  <li key={t}><strong>{t}</strong><span>{d}</span></li>
                ))}
              </ul>
            </section>
            <Link className="back" to="/">Voltar para o início</Link>
          </>
        )}
      </main>

      {pergunta && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo" onClick={(e) => e.target === e.currentTarget && setPergunta(false)}>
          <div className="modal-box">
            <div className="okmark wa-ico">✓</div>
            <h2 id="modal-titulo">Quer entrar na comunidade do WhatsApp?</h2>
            <p className="sub">É por lá que o clube divulga aulas, eventos e competições, e onde os membros trocam dúvidas e combinam projetos.</p>
            <a className="btn wa" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" onClick={() => setPergunta(false)}>Sim, quero entrar</a>
            <button type="button" className="btn ghost" onClick={() => setPergunta(false)}>Agora não</button>
          </div>
        </div>
      )}
    </>
  );
}
