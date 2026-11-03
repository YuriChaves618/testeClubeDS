import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function EmBreve() {
  useEffect(() => { document.title = 'Em breve — Clube D/S'; }, []);
  return (
    <main className="breve-pg">
      <div className="breve">
        <span className="breve-tag">DESAFIOS DE LÓGICA</span>
        <h1>Em breve</h1>
        <p>Estamos preparando os desafios. Em breve eles estarão disponíveis para todos.</p>
        <Link className="btn" to="/">Voltar ao site</Link>
      </div>
    </main>
  );
}
