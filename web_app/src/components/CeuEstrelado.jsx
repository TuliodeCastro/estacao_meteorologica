// ============================================================
// Céu estrelado — estrelinhas cintilando no modo noite ✨
// (quando a irradiância indica que o sol se pôs)
// ============================================================
import { useMemo } from 'react';

const QUANTIDADE_ESTRELAS = 40;

export default function CeuEstrelado() {
  const estrelas = useMemo(
    () =>
      Array.from({ length: QUANTIDADE_ESTRELAS }, (_, i) => ({
        id: i,
        esquerda: Math.random() * 100,
        topo: Math.random() * 100,
        duracao: 2 + Math.random() * 3,
        atraso: Math.random() * 3,
        tamanho: 1.5 + Math.random() * 2.5,
      })),
    []
  );

  return (
    <div aria-hidden="true">
      {estrelas.map((estrela) => (
        <span
          key={estrela.id}
          className="estrela"
          style={{
            left: `${estrela.esquerda}%`,
            top: `${estrela.topo}%`,
            width: `${estrela.tamanho}px`,
            height: `${estrela.tamanho}px`,
            animationDuration: `${estrela.duracao}s`,
            animationDelay: `${estrela.atraso}s`,
          }}
        />
      ))}
    </div>
  );
}
