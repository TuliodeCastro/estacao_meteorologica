// ============================================================
// Teclado virtual na tela — o totem não tem teclado físico!
// Teclas grandes (mínimo 48x48px) com feedback de toque.
// ============================================================

// Linhas do teclado (layout brasileiro simplificado)
const LINHAS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ç'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', '?', '!', ','],
];

export default function TecladoVirtual({ aoDigitar, aoApagar, aoEnviar }) {
  // Estilo comum: cada tecla tem no mínimo 48px de altura/largura
  const estiloTecla =
    'tocavel min-h-[48px] min-w-[28px] flex-1 rounded-xl bg-white/15 text-lg font-bold text-white sm:text-xl';

  return (
    <div className="animate-aparecer mt-3 select-none space-y-1.5">
      {LINHAS.map((linha, i) => (
        <div key={i} className="flex gap-1.5">
          {linha.map((tecla) => (
            <button
              key={tecla}
              type="button"
              className={estiloTecla}
              onClick={() => aoDigitar(tecla)}
            >
              {tecla}
            </button>
          ))}
        </div>
      ))}

      {/* Última linha: apagar, espaço e enviar */}
      <div className="flex gap-1.5">
        <button
          type="button"
          className="tocavel min-h-[52px] flex-[2] rounded-xl bg-rose-500/60 text-lg font-bold text-white"
          onClick={aoApagar}
        >
          ⌫ Apagar
        </button>
        <button
          type="button"
          className="tocavel min-h-[52px] flex-[4] rounded-xl bg-white/15 text-lg font-bold text-white"
          onClick={() => aoDigitar(' ')}
        >
          Espaço
        </button>
        <button
          type="button"
          className="tocavel min-h-[52px] flex-[2] rounded-xl bg-emerald-500/70 text-lg font-bold text-white"
          onClick={aoEnviar}
        >
          Enviar ➤
        </button>
      </div>
    </div>
  );
}
