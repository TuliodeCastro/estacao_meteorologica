// ============================================================
// Ponto de entrada da aplicação
// Estação Meteorológica IoT — UFOP
// ============================================================
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './index.css';

// ------------------------------------------------------------
// PROTEÇÕES DE QUIOSQUE (totem com tela touch)
// ------------------------------------------------------------

// Bloqueia o zoom por pinça no iOS/Safari (gesto não-padrão)
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('gesturechange', (e) => e.preventDefault());

// Bloqueia o zoom por duplo-toque
let ultimoToque = 0;
document.addEventListener(
  'touchend',
  (e) => {
    const agora = Date.now();
    if (agora - ultimoToque < 350) e.preventDefault();
    ultimoToque = agora;
  },
  { passive: false }
);

// Bloqueia zoom com Ctrl+roda do mouse (caso o totem tenha mouse)
document.addEventListener(
  'wheel',
  (e) => {
    if (e.ctrlKey) e.preventDefault();
  },
  { passive: false }
);

// Bloqueia o menu de contexto (toque longo no Android abre menu)
document.addEventListener('contextmenu', (e) => e.preventDefault());

// ------------------------------------------------------------
// AUTO-RECUPERAÇÃO
// Se ocorrerem muitos erros seguidos (site "travou"), recarrega
// a página sozinho — o totem não tem operador por perto.
// ------------------------------------------------------------
let contadorErros = 0;
const TEMPO_JANELA_ERROS = 60_000; // janela de 1 minuto
setInterval(() => (contadorErros = 0), TEMPO_JANELA_ERROS);

function registrarErroFatal() {
  contadorErros += 1;
  if (contadorErros >= 8) {
    // Muitos erros em 1 minuto → recarrega a página automaticamente
    window.location.reload();
  }
}
window.addEventListener('error', registrarErroFatal);
window.addEventListener('unhandledrejection', registrarErroFatal);

// ------------------------------------------------------------
// Renderiza a aplicação
// ------------------------------------------------------------
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
