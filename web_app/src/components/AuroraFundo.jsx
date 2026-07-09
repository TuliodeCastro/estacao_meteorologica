// ============================================================
// Fundo Aurora — blobs de luz desfocados flutuando devagar
// As cores mudam conforme a condição REAL do céu, deixando o
// fundo vivo e profundo sem pesar no hardware do totem.
// ============================================================

// Paleta de cores dos blobs para cada condição do céu
const CORES_POR_CONDICAO = {
  ensolarado: ['#fbbf24', '#fb7185', '#38bdf8'], // âmbar, rosa, ciano
  nublado: ['#94a3b8', '#7dd3fc', '#a5b4fc'], // tons frios suaves
  chuvoso: ['#38bdf8', '#6366f1', '#0ea5e9'], // azuis de tempestade
  noite: ['#8b5cf6', '#22d3ee', '#ec4899'], // violeta, ciano, magenta
};

export default function AuroraFundo({ condicao }) {
  const cores = CORES_POR_CONDICAO[condicao] ?? CORES_POR_CONDICAO.noite;

  return (
    <div aria-hidden="true">
      {/* Os 3 blobs de luz (posição/movimento definidos no CSS) */}
      {cores.map((cor, i) => (
        <span
          key={i}
          className={`aurora-blob aurora-blob-${i + 1}`}
          style={{
            // Gradiente que se dissolve suavemente = efeito de luz desfocada
            background: `radial-gradient(circle, ${cor}E6 0%, ${cor}66 35%, transparent 68%)`,
            transition: 'background 2s ease',
          }}
        />
      ))}
      {/* Ruído + vinheta para profundidade cinematográfica */}
      <span className="camada-ruido" />
      <span className="camada-vinheta" />
    </div>
  );
}
