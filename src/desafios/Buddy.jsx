import { useEffect, useState } from 'react';
import { EXPR } from './assets.js';

// Buddy com a boca mexendo enquanto fala.
// expr: 'normal' | 'aberta' | 'feliz'
export default function Buddy({ expr = 'normal', falando = false, animado = false, perto = false, mini = false, className = '' }) {
  const [abre, setAbre] = useState(false);
  useEffect(() => {
    if (!falando) { setAbre(false); return undefined; }
    const id = setInterval(() => setAbre((a) => !a), 150);
    return () => clearInterval(id);
  }, [falando]);
  const base = animado ? 'feliz' : expr;
  const atual = falando && abre ? 'aberta' : base;
  const cls = ['buddy', mini ? 'mini' : '', perto ? 'perto' : '', animado ? 'animado' : '', className].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      <img src={EXPR[atual]} alt="Buddy, o mascote robô do Clube DS" draggable="false" />
    </div>
  );
}
