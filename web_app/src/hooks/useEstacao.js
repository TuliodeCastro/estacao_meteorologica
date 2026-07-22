// ============================================================
// Hook useEstacao — coração do site!
// Escuta os dados da estação no Firebase em tempo real,
// guarda o histórico da sessão e calcula o status do sistema.
//
// IMPORTANTE (firmware novo): o transmissor dorme entre medições
// (deep sleep) e os dados chegam só a cada ~5 min. Por isso NÃO
// dá mais para usar "tempo desde a última leitura" como sinal de
// conexão — 5 min de silêncio é NORMAL. Quem diz se o sistema está
// no ar é o HEARTBEAT do receptor (gravado a cada 15 s).
// ============================================================
import { useEffect, useRef, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { bancoDados, reconectarFirebase } from '../firebase.js';

// Máximo de pontos guardados no gráfico
// (com leituras de 5 em 5 min, 120 pontos ≈ 10 horas de histórico)
const MAXIMO_PONTOS_HISTORICO = 120;

// O receptor grava o heartbeat a cada 15 s.
// Consideramos OFFLINE se passou mais de 45 s sem heartbeat
// (tolera a perda de ~2 heartbeats antes de alarmar).
const SEGUNDOS_HEARTBEAT_OFFLINE = 45;

// Se o TOTEM perder o Firebase por mais de 2 min, forçamos reconexão.
const MS_DESCONECTADO_PARA_RECONECTAR = 2 * 60 * 1000;

export function useEstacao() {
  // Última leitura recebida (null enquanto carrega)
  const [dados, setDados] = useState(null);
  // Histórico em memória da sessão, para os gráficos
  const [historico, setHistorico] = useState([]);
  // Estado bruto do heartbeat do receptor (null enquanto não chega)
  const [status, setStatus] = useState(null);
  // Epoch (s) da última leitura — vem de leituras.timestamp (firmware novo)
  // ou, como fallback, do horário em que o evento chegou ao site.
  const [timestampLeitura, setTimestampLeitura] = useState(null);
  // Conexão DO TOTEM com o Firebase (.info/connected) — usada na
  // auto-recuperação e no fallback de status.
  const [conectado, setConectado] = useState(true);

  // Relógio interno: avança sozinho para o status "envelhecer" mesmo
  // sem novos eventos do Firebase (senão um heartbeat travado nunca
  // seria percebido, pois nada dispararia um novo render).
  const [agoraEpoch, setAgoraEpoch] = useState(Math.floor(Date.now() / 1000));

  // Marca quando o totem ficou sem conexão (para a vigia de reconexão)
  const momentoDesconectado = useRef(null);

  // Timestamp da última leitura JÁ processada. O gateway grava a leitura
  // campo a campo (temp, pres, umid...), então o onValue dispara várias
  // vezes por leitura; usamos isto para tratar cada leitura UMA só vez.
  const ultimoTimestampLeitura = useRef(null);

  useEffect(() => {
    // ---- Escuta as leituras da estação em tempo real ----
    const referenciaLeituras = ref(bancoDados, 'estacao/leituras');
    const pararLeituras = onValue(referenciaLeituras, (foto) => {
      const valores = foto.val();
      if (!valores) return;

      const agora = new Date();
      // timestamp vem do firmware novo (epoch s); se não vier, usamos
      // o horário de chegada do evento (em segundos) como aproximação.
      const epochLeitura =
        Number(valores.timestamp) || Math.floor(agora.getTime() / 1000);

      // Só é leitura NOVA se o timestamp mudou. Os disparos intermediários
      // (um por campo gravado pelo gateway) carregam o timestamp antigo e
      // são ignorados — senão o gráfico da sessão ganharia vários pontos
      // para uma única leitura.
      if (epochLeitura === ultimoTimestampLeitura.current) return;
      ultimoTimestampLeitura.current = epochLeitura;

      setTimestampLeitura(epochLeitura);
      setDados(valores);

      // Acrescenta o ponto ao histórico do gráfico
      setHistorico((anterior) => {
        const ponto = {
          hora: agora.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          ...valores,
        };
        // Mantém apenas os pontos mais recentes (site leve!)
        return [...anterior, ponto].slice(-MAXIMO_PONTOS_HISTORICO);
      });
    });

    // ---- Escuta o heartbeat do receptor ----
    const referenciaStatus = ref(bancoDados, 'estacao/status');
    const pararStatus = onValue(
      referenciaStatus,
      (foto) => setStatus(foto.val()),
      () => setStatus(null)
    );

    // ---- Monitora a conexão DO TOTEM com o Firebase ----
    const referenciaConexao = ref(bancoDados, '.info/connected');
    const pararConexao = onValue(referenciaConexao, (foto) => {
      const online = foto.val() === true;
      setConectado(online);
      // Registra/limpa o instante em que perdemos a conexão
      momentoDesconectado.current = online ? null : Date.now();
    });

    // ---- Relógio interno (faz o status "envelhecer") ----
    const relogio = setInterval(() => {
      setAgoraEpoch(Math.floor(Date.now() / 1000));
    }, 10 * 1000);

    // ---- Vigia de auto-recuperação ----
    // Se o TOTEM ficar sem Firebase por muito tempo, forçamos a
    // reconexão (o sinal real é .info/connected, não o tempo entre
    // leituras — que agora é naturalmente espaçado).
    const vigia = setInterval(() => {
      const desde = momentoDesconectado.current;
      if (desde && Date.now() - desde > MS_DESCONECTADO_PARA_RECONECTAR) {
        momentoDesconectado.current = Date.now(); // evita repetir em loop
        reconectarFirebase();
      }
    }, 30 * 1000);

    // Limpeza ao desmontar o componente
    return () => {
      pararLeituras();
      pararStatus();
      pararConexao();
      clearInterval(relogio);
      clearInterval(vigia);
    };
  }, []);

  // ---- Calcula o status do sistema (online / offline) ----
  const statusSistema = calcularStatus({
    status,
    agoraEpoch,
    conectado,
    temDados: dados !== null,
  });

  return { dados, historico, statusSistema, timestampLeitura, agoraEpoch, conectado };
}

/**
 * Decide entre 'online' | 'offline' — baseado só no RECEPTOR.
 *
 * A VERDADE está sempre no tempo desde o último heartbeat — nunca no campo
 * `online: true` sozinho, porque se o receptor cair ele não grava `false`.
 *
 * NÃO alarmamos quando só faltam leituras dos sensores: o receptor perde
 * pacotes do nó com frequência (LoRa), e isso é normal. A idade dos dados
 * é comunicada pelo "Última medição há X", sem virar tela de erro.
 */
function calcularStatus({ status, agoraEpoch, conectado, temDados }) {
  const ultimoHeartbeat = Number(status?.ultimoHeartbeat);

  // Fallback gracioso: sem nó de status → deriva da conexão do próprio totem.
  if (!ultimoHeartbeat) {
    return conectado && temDados ? 'online' : 'offline';
  }

  // Receptor no ar se o heartbeat é recente; caiu se ficou velho.
  return agoraEpoch - ultimoHeartbeat < SEGUNDOS_HEARTBEAT_OFFLINE ? 'online' : 'offline';
}
