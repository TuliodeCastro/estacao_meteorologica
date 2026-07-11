// ============================================================
// AvisoDesconectado — mostrado NO LUGAR dos cards quando o sistema
// não está enviando leituras novas. Evita exibir dados atrasados
// como se fossem atuais, e diz CLARAMENTE qual é o problema:
//  - offline    : o receptor caiu
//  - aguardando : os sensores no campo pararam de enviar
// ============================================================
import { INFO_DESCONEXAO, descreverTempoDecorrido } from '../utils/clima.js';

export default function AvisoDesconectado({ status, timestampLeitura, agoraEpoch }) {
  const info = INFO_DESCONEXAO[status] ?? INFO_DESCONEXAO.offline;

  return (
    <div className="px-4">
      <div className="vidro mx-auto max-w-2xl rounded-3xl p-8 text-center text-white sm:p-10">
        <p className="animate-pulso-suave text-7xl sm:text-8xl">{info.emoji}</p>
        <h3 className="mt-4 text-3xl font-black sm:text-4xl">{info.titulo}</h3>
        <p className="mt-3 text-lg leading-snug text-white/80 sm:text-xl">{info.texto}</p>

        {timestampLeitura && (
          <p className="mt-5 text-base font-semibold text-white/70 sm:text-lg">
            Última medição recebida {descreverTempoDecorrido(timestampLeitura, agoraEpoch)}.
          </p>
        )}

        <p className="mt-2 text-sm text-white/50 sm:text-base">
          Assim que a conexão voltar, os dados reaparecem aqui sozinhos. 🔄
        </p>
      </div>
    </div>
  );
}
