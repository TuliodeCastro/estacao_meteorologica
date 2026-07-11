// ============================================================
// Consulta do histórico de medições no Realtime Database
// O gateway grava cada leitura em /estacao/historico/<epoch>.
// Aqui buscamos uma FAIXA de tempo (ex.: últimas 24 h) direto no
// servidor com orderByKey/startAt — sem baixar o histórico inteiro.
// ============================================================
import { get, orderByKey, query, ref, startAt } from 'firebase/database';
import { bancoDados } from './firebase.js';

// Máximo de pontos desenhados no gráfico (totem tem hardware modesto).
const MAX_PONTOS_GRAFICO = 180;

/**
 * Busca as medições dos últimos `janelaSegundos`.
 * @param {number} janelaSegundos - tamanho da janela (ex.: 24*3600)
 * @param {boolean} incluirData - se o rótulo do eixo X mostra o dia
 * @returns {Promise<Array>} pontos ordenados por tempo, já reduzidos
 */
export async function buscarHistorico(janelaSegundos, incluirData = false) {
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

  const pontos = Object.entries(valores)
    .map(([epoch, v]) => {
      const d = new Date(Number(epoch) * 1000);
      const hora = incluirData
        ? d.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })
        : d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return { epoch: Number(epoch), hora, ...v };
    })
    .sort((a, b) => a.epoch - b.epoch);

  return amostrar(pontos, MAX_PONTOS_GRAFICO);
}

/**
 * Reduz a quantidade de pontos para o gráfico ficar leve,
 * mantendo sempre o primeiro e o último.
 */
function amostrar(pontos, max) {
  if (pontos.length <= max) return pontos;
  const passo = Math.ceil(pontos.length / max);
  const reduzidos = pontos.filter((_, i) => i % passo === 0);
  const ultimo = pontos[pontos.length - 1];
  if (reduzidos[reduzidos.length - 1]?.epoch !== ultimo.epoch) reduzidos.push(ultimo);
  return reduzidos;
}
