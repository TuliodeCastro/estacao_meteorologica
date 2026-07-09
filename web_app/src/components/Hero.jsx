// ============================================================
// Hero — topo do site com título e indicador de status
// Agora distingue TRÊS estados (online / aguardando / offline)
// com base no heartbeat do receptor — não mais no tempo entre
// leituras, que passou a ser naturalmente espaçado (~5 min).
// ============================================================
import { INFO_CONDICAO, INFO_STATUS, descreverTempoDecorrido } from '../utils/clima.js';

export default function Hero({ statusSistema, timestampLeitura, agoraEpoch, condicao }) {
  const info = INFO_CONDICAO[condicao] ?? INFO_CONDICAO.noite;
  const status = INFO_STATUS[statusSistema] ?? INFO_STATUS.offline;

  return (
    <header className="px-4 pt-6 pb-2 text-center text-white">
      {/* Sobretítulo discreto em caixa alta — toque editorial premium */}
      <p className="text-xs font-bold uppercase tracking-[0.35em] text-white/60 sm:text-sm">
        UFOP · Ouro Preto · MG
      </p>
      <h1 className="texto-gradiente mt-1 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
        Estação Meteorológica IoT
      </h1>

      {/* Linha de status: estado do sistema + condição do céu */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <span className="vidro flex items-center gap-2 rounded-full px-5 py-2.5 text-base font-bold">
          <span className={`inline-block h-3 w-3 rounded-full ${status.cor} animate-brilho`} />
          {status.emoji} {status.rotulo}
        </span>

        <span className="vidro rounded-full px-5 py-2.5 text-base font-bold">
          {info.emoji} {info.nome}
        </span>

        {timestampLeitura && (
          <span className="vidro rounded-full px-5 py-2.5 text-base font-semibold text-white/90">
            Última medição {descreverTempoDecorrido(timestampLeitura, agoraEpoch)}
          </span>
        )}
      </div>

      {/* Aviso discreto só quando o sistema está realmente offline */}
      {statusSistema === 'offline' && (
        <p className="mt-3 text-sm font-medium text-red-200/90">
          ⚠️ Sem sinal do receptor no momento — mostrando os últimos dados recebidos.
        </p>
      )}
    </header>
  );
}
