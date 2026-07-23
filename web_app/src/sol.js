// ============================================================
// Análise de nascer e pôr do sol A PARTIR DA IRRADIÂNCIA medida
// A irradiância cruza um limiar baixo no nascer (sobe) e no pôr
// (desce). Detectamos esses cruzamentos no histórico do banco.
// ============================================================
import { get, orderByKey, query, ref, startAt } from 'firebase/database';
import { bancoDados } from './firebase.js';

// Acima deste valor consideramos que "tem sol". A irradiância já vem
// clampada em ≥0 no firmware (noite = 0 exato), então 0 detecta a
// primeira e a última réstia de luz do dia.
const LIMIAR_SOL = 0;

/**
 * Busca a irradiância das últimas horas (só irrad + horário, sem reduzir).
 * @param {number} janelaSegundos - quanto tempo para trás (padrão ~30 h)
 */
export async function buscarSol(janelaSegundos = 30 * 3600) {
  const agora = Math.floor(Date.now() / 1000);
  const inicio = agora - janelaSegundos;

  const consulta = query(
    ref(bancoDados, 'estacao/historico'),
    orderByKey(),
    startAt(String(inicio))
  );

  const foto = await get(consulta);
  const valores = foto.val();
  if (!valores) return [];

  return Object.entries(valores)
    .map(([epoch, v]) => ({ epoch: Number(epoch), irrad: Math.max(Number(v.irrad) || 0, 0) }))
    .sort((a, b) => a.epoch - b.epoch);
}

/** Data (YYYY-MM-DD) no fuso de Ouro Preto, para agrupar por dia */
function dataBRT(epoch) {
  return new Date(epoch * 1000).toLocaleDateString('en-CA', {
    timeZone: 'America/Sao_Paulo',
  });
}

/**
 * Analisa a irradiância e devolve, por DIA:
 * - ehDia: se AGORA é dia (baseado na última irradiância medida — sinal
 *   direto e confiável, imune a oscilações na ordem dos cruzamentos)
 * - nascerHoje / porHoje e nascerOntem / porOntem
 *
 * Por dia pegamos o PRIMEIRO nascer e o ÚLTIMO pôr: assim uma nuvem que
 * zere a irradiância no meio do dia não vira um "pôr do sol" falso.
 */
export function analisarSol(pontos) {
  const nasceres = [];
  const pores = [];

  for (let i = 1; i < pontos.length; i++) {
    const anterior = pontos[i - 1].irrad;
    const atual = pontos[i].irrad;
    if (anterior <= LIMIAR_SOL && atual > LIMIAR_SOL) nasceres.push(pontos[i].epoch);
    if (anterior > LIMIAR_SOL && atual <= LIMIAR_SOL) pores.push(pontos[i].epoch);
  }

  // É dia se a leitura mais recente ainda tem sol
  const ultimo = pontos.length ? pontos[pontos.length - 1] : null;
  const ehDia = ultimo ? ultimo.irrad > LIMIAR_SOL : false;

  const agora = Math.floor(Date.now() / 1000);
  const diaHoje = dataBRT(agora);
  const diaOntem = dataBRT(agora - 86400);

  const primeiroNascer = (dia) => nasceres.find((e) => dataBRT(e) === dia) ?? null;
  const ultimoPor = (dia) => {
    const doDia = pores.filter((e) => dataBRT(e) === dia);
    return doDia.length ? doDia[doDia.length - 1] : null;
  };

  return {
    ehDia,
    nascerHoje: primeiroNascer(diaHoje),
    porHoje: ultimoPor(diaHoje),
    nascerOntem: primeiroNascer(diaOntem),
    porOntem: ultimoPor(diaOntem),
  };
}
