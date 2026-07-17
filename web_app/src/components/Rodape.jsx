// ============================================================
// Rodapé — créditos da equipe e logos institucionais
// ============================================================

export default function Rodape() {
  return (
    <footer className="px-4 pb-28 pt-4 text-center text-white">
      <div className="vidro mx-auto max-w-3xl rounded-3xl p-6">
        {/* Logos (placeholders — substituir pelos arquivos oficiais) */}
        <div className="mb-4 flex items-center justify-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 text-sm font-black">
            UFOP
          </div>
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 text-sm font-black">
            DECAT
          </div>
        </div>

        <p className="text-base font-semibold leading-relaxed text-white/90 sm:text-lg">
          Desenvolvido por <strong>Altamiro Marcos Ferreira Neto</strong>,{' '}
          <strong>Túlio Leandro de Castro</strong> e{' '}
          <strong>Gustavo de Oliveira Morais</strong>
        </p>
        <p className="mt-1 text-sm font-medium text-white/70 sm:text-base">
          Departamento de Engenharia de Controle e Automação — UFOP
        </p>
        <p className="mt-3 text-xs text-white/50">
          🛰️ Dados transmitidos por rádio LoRa direto da estação · Universidade Federal de Ouro Preto
        </p>
      </div>
    </footer>
  );
}
