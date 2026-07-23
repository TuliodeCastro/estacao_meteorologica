// ============================================================
// Análise de nascer e pôr do sol A PARTIR DA IRRADIÂNCIA medida
// A irradiância cruza um limiar baixo no nascer (sobe) e no pôr
// (desce). Detectamos esses cruzamentos no histórico do banco.
// ============================================================
import { get, orderByKey, query, ref, startAt } from 'firebase/database';
import { bancoDados } from './firebase.js';

// Acima deste valor consideramos que "tem sol" (dados reais mostram
// noite ≈ 0 W/m² e dia chegando a centenas — 5 separa bem os dois).
const LIMIAR_SOL = 5;

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
    .map(([epoch, v]) => ({ epoch: Number(epoch), irrad: Number(v.irrad) || 0 }))
    .sort((a, b) => a.epoch - b.epoch);
}

/**
 * Encontra os cruzamentos de limiar e devolve:
 * - nascer / por : os MAIS RECENTES (nascer de manhã, pôr de tarde)
 * - parNascer / parPor : o último DIA COMPLETO (nascer seguido do seu pôr),
 *   usado para a duração do dia e para estimar o pôr quando ainda é dia.
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

  const nascer = nasceres.length ? nasceres[nasceres.length - 1] : null;
  const por = pores.length ? pores[pores.length - 1] : null;

  // Último dia completo: o pôr mais recente e o nascer que veio antes dele
  const parPor = por;
  let parNascer = null;
  if (parPor) {
    for (let i = nasceres.length - 1; i >= 0; i--) {
      if (nasceres[i] < parPor) {
        parNascer = nasceres[i];
        break;
      }
    }
  }

  return { nascer, por, parNascer, parPor };
}
