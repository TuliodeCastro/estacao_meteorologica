// ============================================================
// ErrorBoundary — rede de segurança do totem
// Se algum componente quebrar, mostramos uma tela amigável e
// recarregamos o site SOZINHOS depois de alguns segundos
// (ninguém fica ao lado do totem para apertar F5!)
// ============================================================
import { Component } from 'react';

const SEGUNDOS_PARA_RECARREGAR = 10;

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { quebrou: false };
  }

  static getDerivedStateFromError() {
    return { quebrou: true };
  }

  componentDidCatch() {
    // Agenda o recarregamento automático da página
    this.temporizador = setTimeout(() => {
      window.location.reload();
    }, SEGUNDOS_PARA_RECARREGAR * 1000);
  }

  componentWillUnmount() {
    clearTimeout(this.temporizador);
  }

  render() {
    if (this.state.quebrou) {
      return (
        <div className="fundo-noite flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center text-white">
          <p className="text-7xl">🔧</p>
          <h1 className="text-3xl font-black">Ops! Algo deu errado…</h1>
          <p className="max-w-md text-lg text-white/80">
            O site vai se reiniciar sozinho em alguns segundos. Pode aguardar!
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="tocavel min-h-[56px] rounded-2xl bg-amber-400 px-8 text-xl font-black text-indigo-950"
          >
            Reiniciar agora 🔄
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
