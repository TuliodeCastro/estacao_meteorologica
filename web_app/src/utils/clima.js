// ============================================================
// Funções auxiliares sobre o clima
// Interpretam os números dos sensores para deixar o site vivo
// ============================================================

/**
 * Decide a "condição do céu" mostrada no site.
 *
 * O momento do dia (DIA x NOITE) é definido pelo RELÓGIO LOCAL de
 * Ouro Preto (fuso America/Sao_Paulo) — NÃO pela irradiância. Assim,
 * de madrugada o site fica no tema noturno mesmo que um sensor registre
 * luz, e durante o dia nunca vira "noite" só porque nublou ou a
 * irradiância caiu.
 *
 * - chuvoso : pluviômetro registrou chuva
 * - noite   : está de noite em Ouro Preto (pelo horário)
 * - ensolarado : de dia, com irradiância alta (sol forte)
 * - nublado : de dia, com sol fraco
 */
export function condicaoDoCeu(dados) {
  const chuva = Number(dados?.chuva) || 0;
  if (chuva > 0) return 'chuvoso';

  if (ehNoiteEmOuroPreto()) return 'noite';

  // A partir daqui é DIA: o céu (sol forte x nublado) ainda vem da irradiância
  if (!dados) return 'nublado'; // de dia, mas ainda sem dados → tema neutro
  const irradiancia = Number(dados.irrad) || 0;
  return irradiancia >= 400 ? 'ensolarado' : 'nublado';
}

// Faixas de horário (Ouro Preto). O Brasil não usa horário de verão
// desde 2019, então o fuso é estável (UTC-3).
const HORA_NASCER_DO_SOL = 6; // antes disso, ainda é noite
const HORA_POR_DO_SOL = 18; // a partir disso, já é noite

/**
 * Diz se é noite em Ouro Preto AGORA, usando o fuso da cidade
 * independentemente do fuso configurado no aparelho/totem.
 */
function ehNoiteEmOuroPreto() {
  let hora;
  try {
    const partes = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      hour12: false,
    }).formatToParts(new Date());
    // %24 converte "24" (meia-noite em alguns motores) para 0
    hora = (Number(partes.find((p) => p.type === 'hour')?.value) || 0) % 24;
  } catch {
    // Se o fuso não estiver disponível, usa o relógio local do aparelho
    hora = new Date().getHours();
  }
  return hora < HORA_NASCER_DO_SOL || hora >= HORA_POR_DO_SOL;
}

/** Emoji e nome amigável de cada condição */
export const INFO_CONDICAO = {
  ensolarado: { emoji: '☀️', nome: 'Ensolarado' },
  nublado: { emoji: '☁️', nome: 'Nublado' },
  chuvoso: { emoji: '🌧️', nome: 'Chuvoso' },
  noite: { emoji: '🌙', nome: 'Noite' },
};

/**
 * Aparência de cada um dos TRÊS estados do sistema.
 * - online    : receptor vivo, dados fluindo
 * - aguardando: receptor vivo, mas o transmissor está dormindo/sem dados
 * - offline   : sem heartbeat do receptor
 */
export const INFO_STATUS = {
  online: { emoji: '🟢', rotulo: 'Sistema Online', cor: 'bg-green-400' },
  aguardando: { emoji: '🟡', rotulo: 'Aguardando dados dos sensores', cor: 'bg-yellow-400' },
  offline: { emoji: '🔴', rotulo: 'Sistema Offline', cor: 'bg-red-500' },
};

/**
 * Descreve, de forma amigável, há quanto tempo algo aconteceu.
 * @param {number} epochSegundos - momento do evento (epoch em segundos)
 * @param {number} agoraEpoch    - "agora" (epoch em segundos)
 */
export function descreverTempoDecorrido(epochSegundos, agoraEpoch) {
  if (!epochSegundos) return 'aguardando primeira medição';
  const segundos = Math.max(0, (agoraEpoch || Math.floor(Date.now() / 1000)) - epochSegundos);
  if (segundos < 60) return 'agora mesmo';
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  return `há ${horas} h`;
}

/** Formata um número com vírgula brasileira e casas fixas */
export function formatarNumero(valor, casas = 1) {
  const numero = Number(valor);
  if (Number.isNaN(numero)) return '—';
  return numero.toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

/**
 * Frases didáticas que mudam conforme o valor real do sensor.
 * É o que torna os cards interessantes para o visitante!
 */
export function descricaoTemperatura(temp) {
  if (temp <= 12) return 'Brrr! Friozinho típico das manhãs de Ouro Preto. ☕';
  if (temp <= 18) return 'Clima ameno de montanha — leve um casaco!';
  if (temp <= 26) return 'Temperatura agradável, perfeita para passear pela cidade histórica.';
  return 'Dia quente! Raro por aqui, aproveite a sombra. 🌳';
}

export function descricaoUmidade(umid) {
  if (umid >= 85) return 'Ar bem úmido — é assim que nasce a neblina das montanhas!';
  if (umid >= 60) return 'Umidade confortável para o corpo humano (ideal: 40–70%).';
  if (umid >= 40) return 'Ar levemente seco. Beba água!';
  return 'Ar muito seco — hidrate-se bastante! 💧';
}

export function descricaoPressao() {
  return 'Em Ouro Preto a pressão é menor que no litoral por causa da altitude de 1.179 m! No nível do mar ela fica perto de 1.013 hPa.';
}

export function descricaoChuva(chuva) {
  if (chuva <= 0) return 'Sem chuva registrada. O pluviômetro conta cada "badelada" de 0,25 mm.';
  if (chuva < 5) return 'Chuvinha fraca — o pluviômetro de báscula está contando cada gota!';
  if (chuva < 25) return 'Chuva moderada. A água enche uma pequena báscula que vira e conta os mm.';
  return 'Chuva forte! Em Ouro Preto, chuvas intensas pedem atenção nas ladeiras. ⚠️';
}

export function descricaoVento(velKMH) {
  // velMS é a velocidade MÉDIA da janela (norma OMM/WMO), não um valor instantâneo.
  if (velKMH < 2) return 'Vento quase parado — média calculada ao longo de 2 minutos (norma da OMM).';
  if (velKMH < 12) return 'Brisa leve. Esta é a velocidade MÉDIA do vento, medida ao longo de 2 minutos conforme as normas da Organização Meteorológica Mundial (OMM).';
  if (velKMH < 29) return 'Vento moderado — dá para sentir no rosto e ver as folhas dançando. Valor médio dos últimos 2 minutos.';
  return 'Ventania! Segure o chapéu! 🎩 (média da janela conforme a OMM)';
}

export function descricaoRajada(rajadaMS) {
  const r = Number(rajadaMS) || 0;
  if (r <= 0) return 'A rajada é o pico de vento em 3 segundos — sempre maior que a média! Meteorologistas usam essa medida para alertas de tempestade.';
  if (r < 8) return 'A rajada é o pico de vento em 3 segundos — sempre maior que a média! É ela que arranca um chapéu mesmo num dia de brisa. 🎩';
  return 'Rajada forte! O pico de 3 segundos é o que os meteorologistas vigiam para emitir alertas de tempestade. ⚠️';
}

export function descricaoDirecao(direcao) {
  return `O vento está soprando de ${direcao || '—'}. O sensor usa um catavento com ímãs para descobrir a direção.`;
}

export function descricaoIrradiancia(irrad) {
  if (irrad < 10) return 'Sol se pôs — irradiância quase zero. Hora das estrelas! ✨';
  if (irrad < 200) return 'Sol fraquinho — pode ser começo/fim do dia ou céu encoberto.';
  if (irrad < 600) return 'Boa luz solar! Painéis solares já gerariam bastante energia.';
  return 'Sol forte! Em dias assim, 1 m² recebe energia para acender 10 lâmpadas LED.';
}

/** Converte graus em pontos cardeais — usado se "direcao" vier vazio */
export function grausParaDirecao(graus) {
  const pontos = ['Norte', 'Nordeste', 'Leste', 'Sudeste', 'Sul', 'Sudoeste', 'Oeste', 'Noroeste'];
  const indice = Math.round(((Number(graus) || 0) % 360) / 45) % 8;
  return pontos[indice];
}
