// ============================================================
// Hook useValorAnimado — efeito "count-up"
// Quando uma leitura nova chega, o número da tela não troca de
// repente: ele "corre" do valor antigo até o novo em ~0,8 s.
// Detalhe premium que dá vida aos cards!
// ============================================================
import { useEffect, useRef, useState } from 'react';

const DURACAO_MS = 800;

export function useValorAnimado(valorFinal) {
  const numeroFinal = Number(valorFinal) || 0;
  const [valorExibido, setValorExibido] = useState(numeroFinal);
  const animacao = useRef(null);
  const valorAtual = useRef(numeroFinal);

  useEffect(() => {
    const inicio = valorAtual.current;
    const delta = numeroFinal - inicio;

    // Sem mudança → nada a animar
    if (delta === 0) return undefined;

    const comecou = performance.now();

    // Interpola com easing suave (desacelera no final)
    function quadro(agora) {
      const progresso = Math.min((agora - comecou) / DURACAO_MS, 1);
      const suavizado = 1 - Math.pow(1 - progresso, 3); // ease-out cúbico
      const valor = inicio + delta * suavizado;
      valorAtual.current = valor;
      setValorExibido(valor);
      if (progresso < 1) animacao.current = requestAnimationFrame(quadro);
    }
    animacao.current = requestAnimationFrame(quadro);

    return () => cancelAnimationFrame(animacao.current);
  }, [numeroFinal]);

  return valorExibido;
}
