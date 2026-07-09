// ============================================================
// Hook useInatividade
// Detecta quando ninguém toca na tela por um tempo.
// Usado pelo Modo Atrativo (descanso) e pela limpeza do chat.
// ============================================================
import { useEffect, useRef, useState } from 'react';

// Eventos que contam como "alguém está usando o totem"
const EVENTOS_DE_ATIVIDADE = ['pointerdown', 'touchstart', 'keydown', 'mousemove', 'wheel'];

/**
 * @param {number} tempoLimite - milissegundos sem interação até considerar inativo
 * @returns {boolean} true quando o tempo de inatividade foi atingido
 */
export function useInatividade(tempoLimite) {
  const [inativo, setInativo] = useState(false);
  const temporizador = useRef(null);

  useEffect(() => {
    // (Re)inicia a contagem sempre que houver interação
    const reiniciar = () => {
      setInativo(false);
      clearTimeout(temporizador.current);
      temporizador.current = setTimeout(() => setInativo(true), tempoLimite);
    };

    EVENTOS_DE_ATIVIDADE.forEach((evento) =>
      window.addEventListener(evento, reiniciar, { passive: true })
    );
    reiniciar(); // inicia a primeira contagem

    return () => {
      clearTimeout(temporizador.current);
      EVENTOS_DE_ATIVIDADE.forEach((evento) => window.removeEventListener(evento, reiniciar));
    };
  }, [tempoLimite]);

  return inativo;
}
