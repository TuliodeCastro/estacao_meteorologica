// ============================================================
// Partículas de chuva — aparecem na tela inteira quando o
// pluviômetro registra chuva DE VERDADE em Ouro Preto! 🌧️
// Feito com CSS puro para ser leve no hardware do totem.
// ============================================================
import { useMemo } from 'react';

const QUANTIDADE_GOTAS = 36; // poucas gotas = animação leve

export default function ParticulasChuva() {
  // Posições e tempos sorteados uma única vez (useMemo evita
  // re-sortear a cada renderização)
  const gotas = useMemo(
    () =>
      Array.from({ length: QUANTIDADE_GOTAS }, (_, i) => ({
        id: i,
        esquerda: Math.random() * 100, // posição horizontal (%)
        duracao: 0.8 + Math.random() * 0.9, // tempo de queda (s)
        atraso: Math.random() * 2, // atraso inicial (s)
        opacidade: 0.35 + Math.random() * 0.45,
      })),
    []
  );

  return (
    <div aria-hidden="true">
      {gotas.map((gota) => (
        <span
          key={gota.id}
          className="gota-chuva"
          style={{
            left: `${gota.esquerda}%`,
            animationDuration: `${gota.duracao}s`,
            animationDelay: `${gota.atraso}s`,
            opacity: gota.opacidade,
          }}
        />
      ))}
    </div>
  );
}
