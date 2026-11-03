import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home.jsx';
import Join from './pages/Join.jsx';
import Desafios from './pages/Desafios.jsx';
import EmBreve from './pages/EmBreve.jsx';
import { DESAFIOS_LIBERADO } from './dados.js';
import './styles.css';

function ScrollTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => { if (!hash) window.scrollTo(0, 0); }, [pathname, hash]);
  return null;
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ScrollTop />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/participar" element={<Join />} />
      <Route path="/desafios" element={DESAFIOS_LIBERADO ? <Desafios /> : <EmBreve />} />
    </Routes>
  </BrowserRouter>
);
