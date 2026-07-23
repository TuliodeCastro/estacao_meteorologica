// ============================================================
// Meteorinho — assistente virtual da estação! ☁️
// - Responde perguntas usando a IA da NVIDIA, através de um
//   proxy seguro (Cloudflare Worker) que guarda a chave em segredo
//   — a URL do proxy fica em src/config.js (URL_METEORINHO)
// - Se o proxy não estiver configurado ou falhar, usa um "cérebro
//   local" com respostas prontas baseadas nos dados reais
// - Teclado virtual na tela (totem não tem teclado físico)
// - Limpa a conversa após 1 minuto sem interação (privacidade!)
// ============================================================
import { useEffect, useRef, useState } from 'react';
import TecladoVirtual from './TecladoVirtual.jsx';
import { IconeMeteorinho } from './IconesAnimados.jsx';
import { URL_METEORINHO } from '../config.js';
import {
  formatarNumero,
  grausParaDirecao,
  INFO_STATUS,
  descreverTempoDecorrido,
} from '../utils/clima.js';

// Tempo máximo de espera pela resposta da IA (o totem não pode travar)
const TEMPO_LIMITE_IA = 15000;

// Tempo sem interação até limpar a conversa (privacidade entre visitantes)
const TEMPO_LIMPAR_CONVERSA = 60 * 1000;

// Perguntas prontas — em totems, botões são MUITO mais usados que digitação
const PERGUNTAS_PRONTAS = [
  'Por que a pressão está baixa?',
  'Como o pluviômetro funciona?',
  'Vai chover hoje?',
  'O que é LoRa?',
];

const MENSAGEM_BOAS_VINDAS = {
  autor: 'meteorinho',
  texto:
    'Oi! Eu sou o Meteorinho, a nuvem que sabe tudo sobre o clima daqui! ☁️✨ Toque numa pergunta abaixo ou digite a sua!',
};

// ------------------------------------------------------------
// Monta o texto de contexto com os dados atuais dos sensores
// (enviado para o Claude junto com a pergunta do visitante)
// ------------------------------------------------------------
function montarContexto(dados, info) {
  if (!dados) return 'Os sensores ainda estão carregando os dados.';
  const velMS = Number(dados.velMS) || 0; // velocidade MÉDIA (norma OMM)
  const velKMH = velMS * 3.6; // km/h calculado (não vem mais pronto)
  const partes = [
    `temperatura: ${formatarNumero(dados.temp)} °C`,
    `umidade: ${formatarNumero(dados.umid, 0)} %`,
    `pressão: ${formatarNumero(dados.pres)} hPa`,
    `chuva acumulada: ${formatarNumero(dados.chuva)} mm`,
    `velocidade MÉDIA do vento (média dos últimos 2 min): ${formatarNumero(velMS)} m/s (${formatarNumero(velKMH)} km/h)`,
    `rajada (pico de 3 s): ${formatarNumero(dados.rajada)} m/s`,
    `direção do vento: ${dados.direcao || grausParaDirecao(dados.dir)} (${formatarNumero(dados.dir, 0)}°)`,
    `irradiância solar: ${formatarNumero(dados.irrad, 0)} W/m²`,
  ];
  // Status do sistema e idade da última medição (quando disponíveis)
  if (info?.statusSistema) {
    const s = INFO_STATUS[info.statusSistema];
    if (s) partes.push(`status do sistema: ${s.rotulo}`);
  }
  if (info?.timestampLeitura) {
    partes.push(`última medição: ${descreverTempoDecorrido(info.timestampLeitura, info.agoraEpoch)}`);
  }
  return partes.join(', ');
}

// ------------------------------------------------------------
// "Cérebro local" — respostas prontas quando o Claude não está
// disponível. Casa palavras-chave da pergunta com respostas
// didáticas que usam os dados REAIS dos sensores.
// ------------------------------------------------------------
function respostaLocal(pergunta, dados, info) {
  const p = pergunta.toLowerCase();
  const d = dados || {};
  const irrad = Number(d.irrad) || 0;
  const umid = Number(d.umid) || 0;
  const chuva = Number(d.chuva) || 0;
  const velMS = Number(d.velMS) || 0;
  const velKMH = velMS * 3.6;

  if (p.includes('pressão') || p.includes('pressao')) {
    return `Ótima pergunta! A pressão aqui está em ${formatarNumero(d.pres)} hPa — bem menor que no litoral (~1.013 hPa). Sabe por quê? Ouro Preto fica a 1.179 metros de altitude! Quanto mais alto, menos ar tem "empilhado" em cima da gente, então a pressão cai. É como mergulhar: quanto mais fundo, mais a água aperta! 🏔️`;
  }
  if (p.includes('pluvi') || (p.includes('chuva') && p.includes('funciona'))) {
    return `O pluviômetro é uma gangorra minúscula! 🌧️ A chuva cai num funil e enche uma pequena "concha". Quando ela enche (0,25 mm de chuva), a gangorra vira — TIC! — e um ímã passa por um sensor que conta +1. Somando os tics, sabemos quantos milímetros choveram. Hoje já registramos ${formatarNumero(chuva)} mm!`;
  }
  if (p.includes('vai chover') || p.includes('chover hoje') || p.includes('previsão') || p.includes('previsao')) {
    if (chuva > 0) return `Olha, já está chovendo! ☔ O pluviômetro registrou ${formatarNumero(chuva)} mm. Eu não faço previsão do futuro (sou só uma nuvem observadora 😅), mas com umidade de ${formatarNumero(umid, 0)}%, leve o guarda-chuva!`;
    if (umid > 85) return `Eu não consigo prever o futuro, mas posso dar pistas! 🔍 A umidade está em ${formatarNumero(umid, 0)}% — bem alta! Quando o ar fica tão úmido assim, a chance de chuva aumenta. Fique de olho no céu!`;
    return `Eu não faço previsão (sou uma nuvem observadora, não vidente! 😄), mas as pistas de agora: umidade em ${formatarNumero(umid, 0)}% e ${chuva > 0 ? 'chuva caindo' : 'nenhuma chuva registrada'}. Umidade abaixo de 80% costuma indicar tempo firme por enquanto!`;
  }
  if (p.includes('lora')) {
    return `LoRa é a tecnologia mais legal do projeto! 📡 Significa "Long Range" (longo alcance). Ela manda os dados por ondas de rádio a QUILÔMETROS de distância, sem internet e gastando menos energia que uma lâmpada de LED! O truque é enviar poucos dados de cada vez, devagarzinho. Perfeito para atravessar as montanhas de Ouro Preto!`;
  }
  if (p.includes('temperatura') || p.includes('calor') || p.includes('frio')) {
    return `Agora estão fazendo ${formatarNumero(d.temp)} °C aqui em Ouro Preto! 🌡️ O sensor mede isso eletronicamente: um material muda sua resistência elétrica conforme esquenta ou esfria, e o ESP8266 converte isso em graus. Bem mais preciso que aquele termômetro de mercúrio antigo!`;
  }
  if (p.includes('umidade')) {
    return `A umidade do ar está em ${formatarNumero(umid, 0)}%! 💧 Isso significa que o ar está carregando ${formatarNumero(umid, 0)}% do vapor d'água máximo que ele aguenta. Quando chega perto de 100%, o vapor vira gotinhas — é assim que nascem a neblina e a chuva!`;
  }
  if (p.includes('rajada') || p.includes('pico')) {
    return `A rajada é o PICO de vento em apenas 3 segundos — agora está em ${formatarNumero(d.rajada)} m/s! 🌬️ Ela é sempre maior que a velocidade média. Os meteorologistas ficam de olho na rajada porque é ela que derruba galhos e telhados nas tempestades, mesmo quando a média parece tranquila!`;
  }
  if (p.includes('vento') || p.includes('anemômetro') || p.includes('anemometro')) {
    return `O vento médio está a ${formatarNumero(velKMH)} km/h (${formatarNumero(velMS)} m/s), vindo de ${d.direcao || grausParaDirecao(d.dir)}! 💨 Medimos com um anemômetro de conchas que gira com o vento. Mas atenção: esse valor é a MÉDIA dos últimos 2 minutos (não uma foto instantânea). O pico rápido a gente chama de rajada!`;
  }
  if (
    p.includes('dorme') || p.includes('cochil') || p.includes('sono') || p.includes('deep sleep') ||
    p.includes('bateria') || p.includes('energia') || p.includes('solar') || p.includes('5 min')
  ) {
    return `Boa pergunta! 🔋 Lá no campo, a estação funciona com energia solar e bateria. Para não gastar tudo, ela tira um cochilo entre as medições: acorda, mede por uns 2 minutos, envia os dados pelo rádio e dorme de novo. Por isso os dados chegam a cada ~5 minutos — é ela economizando bateria para funcionar dia e noite! 😴`;
  }
  if (p.includes('sol') || p.includes('irradiância') || p.includes('irradiancia') || p.includes('radiação') || p.includes('radiacao')) {
    return `A irradiância solar agora é de ${formatarNumero(irrad, 0)} W/m²! ☀️ Isso mede quanta energia do Sol chega em cada metro quadrado do chão. ${irrad > 600 ? 'Sol forte! Daria para acender várias lâmpadas com um painel solar!' : irrad < 10 ? 'Quase zero — o Sol já foi dormir! 🌙' : 'Sol moderado neste momento.'}`;
  }
  if (p.includes('esp') || p.includes('arduino') || p.includes('microcontrolador')) {
    return `O ESP8266 é o cérebro da estação! 🧠 Um chip menor que uma caixa de fósforos que lê todos os sensores, faz as contas e envia tudo pelo rádio LoRa. Ele foi programado pelos alunos de Engenharia de Controle e Automação da UFOP!`;
  }
  if (p.includes('oi') || p.includes('olá') || p.includes('ola') || p.includes('bom dia') || p.includes('boa tarde') || p.includes('boa noite')) {
    return `Oi! Que bom te ver por aqui! ☁️💙 Eu sou o Meteorinho e adoro falar sobre o clima. Pergunte sobre a temperatura, o vento, a chuva… ou toque numa das perguntas prontas!`;
  }

  // Resposta genérica quando não reconhecemos a pergunta
  return `Hmm, essa eu ainda estou aprendendo a responder! 😅 Mas posso te contar sobre os dados de agora: ${montarContexto(dados, info)}. Experimente tocar numa das perguntas prontas!`;
}

// ------------------------------------------------------------
// Pergunta ao Meteorinho via proxy da NVIDIA (Cloudflare Worker).
// O site manda só a pergunta + o contexto dos sensores; a chave da
// NVIDIA fica em segredo no Worker (nunca no site). Se o proxy não
// estiver configurado ou falhar, caímos no "cérebro local".
// ------------------------------------------------------------
async function perguntarAssistente(pergunta, dados, info) {
  if (URL_METEORINHO) {
    // Aborta se demorar demais — o totem não pode ficar travado
    const controle = new AbortController();
    const relogio = setTimeout(() => controle.abort(), TEMPO_LIMITE_IA);
    try {
      const resp = await fetch(URL_METEORINHO, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pergunta, contexto: montarContexto(dados, info) }),
        signal: controle.signal,
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data?.resposta && typeof data.resposta === 'string') return data.resposta;
      }
    } catch {
      // rede caiu, timeout, CORS, etc. → usamos o cérebro local abaixo
    } finally {
      clearTimeout(relogio);
    }
  }
  return respostaLocal(pergunta, dados, info);
}

// ============================================================
// Componente do chat
// ============================================================
export default function Meteorinho({ dados, statusSistema, timestampLeitura, agoraEpoch }) {
  // Reúne o status num objeto para enriquecer o contexto do assistente
  const info = { statusSistema, timestampLeitura, agoraEpoch };
  const [mensagens, setMensagens] = useState([MENSAGEM_BOAS_VINDAS]);
  const [texto, setTexto] = useState('');
  const [pensando, setPensando] = useState(false);
  const [tecladoAberto, setTecladoAberto] = useState(false);

  const fimDaConversa = useRef(null); // para rolar até a última mensagem
  const temporizadorLimpeza = useRef(null);

  // ---- Limpeza automática da conversa (privacidade no totem) ----
  // Sempre que há interação no chat, reiniciamos o relógio.
  // Após 1 minuto parado, a conversa volta ao início.
  const reiniciarRelogioLimpeza = () => {
    clearTimeout(temporizadorLimpeza.current);
    temporizadorLimpeza.current = setTimeout(() => {
      setMensagens([MENSAGEM_BOAS_VINDAS]);
      setTexto('');
      setTecladoAberto(false);
    }, TEMPO_LIMPAR_CONVERSA);
  };
  useEffect(() => () => clearTimeout(temporizadorLimpeza.current), []);

  // Rola para a última mensagem sempre que a conversa cresce
  useEffect(() => {
    fimDaConversa.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [mensagens, pensando]);

  // ---- Envia uma pergunta (digitada ou botão pronto) ----
  async function enviar(pergunta) {
    const limpa = (pergunta ?? texto).trim();
    if (!limpa || pensando) return;

    reiniciarRelogioLimpeza();
    setTexto('');
    setMensagens((m) => [...m, { autor: 'visitante', texto: limpa }]);
    setPensando(true);

    const resposta = await perguntarAssistente(limpa, dados, info);

    setPensando(false);
    setMensagens((m) => [...m, { autor: 'meteorinho', texto: resposta }]);
    reiniciarRelogioLimpeza();
  }

  return (
    <section className="px-4 text-white">
      <h2 className="mb-2 text-center text-3xl font-black sm:text-4xl">💬 Pergunte ao Meteorinho!</h2>
      <p className="mb-4 text-center text-lg font-medium text-white/80">
        Nosso assistente conhece todos os sensores da estação.
      </p>

      <div className="vidro mx-auto max-w-2xl rounded-3xl p-4 sm:p-5">
        {/* Cabeçalho com o avatar */}
        <div className="mb-3 flex items-center gap-3">
          <IconeMeteorinho tamanho={56} />
          <div>
            <p className="text-xl font-black">Meteorinho</p>
            <p className="text-sm text-white/70">☁️ a nuvem que entende de clima</p>
          </div>
        </div>

        {/* Janela de mensagens */}
        <div className="rolagem-fina max-h-72 space-y-3 overflow-y-auto pr-1" style={{ touchAction: 'pan-y' }}>
          {mensagens.map((mensagem, i) => (
            <div
              key={i}
              className={`animate-aparecer flex ${mensagem.autor === 'visitante' ? 'justify-end' : 'justify-start'}`}
            >
              <p
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-base font-medium leading-snug sm:text-lg ${
                  mensagem.autor === 'visitante'
                    ? 'rounded-br-sm bg-amber-400 text-indigo-950'
                    : 'rounded-bl-sm bg-white/15 text-white'
                }`}
              >
                {mensagem.texto}
              </p>
            </div>
          ))}

          {/* Indicador "digitando..." enquanto o Meteorinho pensa */}
          {pensando && (
            <div className="flex justify-start">
              <p className="digitando rounded-2xl rounded-bl-sm bg-white/15 px-4 py-3 text-white">
                <span /> <span /> <span />
              </p>
            </div>
          )}
          <div ref={fimDaConversa} />
        </div>

        {/* Perguntas prontas — botões GRANDES (o jeito favorito no totem) */}
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PERGUNTAS_PRONTAS.map((pergunta) => (
            <button
              key={pergunta}
              type="button"
              onClick={() => enviar(pergunta)}
              className="tocavel min-h-[52px] rounded-2xl bg-indigo-500/50 px-4 py-3 text-base font-bold text-white sm:text-lg"
            >
              {pergunta}
            </button>
          ))}
        </div>

        {/* Campo de texto — aceita o teclado FÍSICO (celular/computador),
            com Enter para enviar. No totem (sem teclado), o botão ao lado
            abre o teclado virtual na tela. */}
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              reiniciarRelogioLimpeza();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                enviar();
              }
            }}
            onFocus={reiniciarRelogioLimpeza}
            enterKeyHint="send"
            placeholder="Digite sua pergunta…"
            className="min-h-[52px] flex-1 rounded-2xl border border-white/25 bg-white/10 px-4 text-lg text-white placeholder-white/50 outline-none focus:border-amber-300/60"
          />
          <button
            type="button"
            onClick={() => {
              setTecladoAberto((aberto) => !aberto);
              reiniciarRelogioLimpeza();
            }}
            className="tocavel min-h-[52px] min-w-[64px] rounded-2xl bg-white/15 text-2xl"
            aria-label="Mostrar teclado na tela"
            title="Teclado na tela (para o totem)"
          >
            ⌨️
          </button>
          <button
            type="button"
            onClick={() => enviar()}
            disabled={!texto.trim() || pensando}
            className="tocavel min-h-[52px] min-w-[64px] rounded-2xl bg-emerald-500/70 text-lg font-bold text-white disabled:opacity-30"
            aria-label="Enviar pergunta"
          >
            ➤
          </button>
        </div>

        {/* Teclado virtual na tela */}
        {tecladoAberto && (
          <TecladoVirtual
            aoDigitar={(tecla) => {
              setTexto((t) => t + tecla);
              reiniciarRelogioLimpeza();
            }}
            aoApagar={() => {
              setTexto((t) => t.slice(0, -1));
              reiniciarRelogioLimpeza();
            }}
            aoEnviar={() => enviar()}
          />
        )}

        <p className="mt-3 text-center text-xs text-white/50">
          🔒 A conversa é apagada automaticamente após 1 minuto sem uso.
        </p>
      </div>
    </section>
  );
}
