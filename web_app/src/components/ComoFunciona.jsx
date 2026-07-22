// ============================================================
// Seção "Como Funciona?" — diagrama interativo do sistema
// Toque em cada componente para abrir uma explicação simples
// ============================================================
import { useState } from 'react';
import { IconeCochilo } from './IconesAnimados.jsx';

// Cada etapa do caminho que o dado percorre, do sensor até a tela
const ETAPAS = [
  {
    id: 'sensores',
    emoji: '🌡️',
    nome: 'Sensores',
    resumo: 'Medem o clima',
    explicacao:
      'São os "sentidos" da estação! Um termômetro digital mede a temperatura, um barômetro sente a pressão do ar, um pluviômetro de báscula conta as gotas de chuva, um anemômetro de conchas gira com o vento e um piranômetro mede a força do sol. Cada sensor transforma um fenômeno da natureza em números.',
  },
  {
    id: 'esp8266',
    emoji: '🧠',
    nome: 'ESP8266',
    resumo: 'O cérebro',
    explicacao:
      'Um microcontrolador menor que uma caixa de fósforos! Ele segue um ciclo espertinho: ACORDA, fica uns 2 minutos lendo os sensores e calculando as médias, ENVIA o "pacotinho" de dados pelo rádio e depois DORME por alguns minutos para poupar bateria. Por isso os dados chegam a cada ~5 minutos. Foi programado pelos alunos da UFOP e custa menos que um lanche!',
  },
  {
    id: 'lora',
    emoji: '📡',
    nome: 'LoRa',
    resumo: 'Rádio de longo alcance',
    destaque: true,
    explicacao:
      '⭐ A estrela do projeto! LoRa significa "Long Range" (longo alcance). Os dados viajam QUILÔMETROS sem internet, usando menos energia que uma lâmpada de LED! O segredo é enviar pouquinhos dados de cada vez, em ondas de rádio especiais que atravessam morros e prédios — perfeito para as montanhas de Ouro Preto.',
  },
  {
    id: 'receptor',
    emoji: '📻',
    nome: 'Receptor',
    resumo: 'Escuta o rádio',
    explicacao:
      'Uma segunda placa com antena LoRa fica "escutando" o rádio o tempo todo. Quando o pacotinho de dados chega da estação, ela confere se veio tudo certinho e repassa para a internet. É a ponte entre o mundo do rádio e o mundo da web!',
  },
  {
    id: 'firebase',
    emoji: '☁️',
    nome: 'Firebase',
    resumo: 'Nuvem do Google',
    explicacao:
      'Um banco de dados que mora na nuvem (servidores do Google). Ele guarda as leituras e tem um superpoder: avisa NA HORA todos os aparelhos conectados quando um dado novo chega. Por isso este site se atualiza sozinho, sem precisar apertar nada!',
  },
  {
    id: 'site',
    emoji: '📱',
    nome: 'Este site!',
    resumo: 'Você está aqui',
    explicacao:
      'A tela que você está tocando agora! Feita em React, ela fica conectada ao Firebase e redesenha os números, gráficos e animações em tempo real. Do sensor lá fora até esta tela, o dado percorre todo o caminho em poucos segundos. 🚀',
  },
];

export default function ComoFunciona() {
  // Etapa selecionada (null = nenhum popup aberto)
  const [etapaAberta, setEtapaAberta] = useState(null);

  return (
    <section className="px-4 text-white">
      <h2 className="mb-2 text-center text-3xl font-black sm:text-4xl">⚙️ Como Funciona?</h2>
      <p className="mb-6 text-center text-lg font-medium text-white/80">
        Toque em cada peça para descobrir o caminho que o dado percorre!
      </p>

      {/* Diagrama de fluxo — vertical no totem, horizontal em telas largas */}
      <div className="flex flex-col items-center gap-1 lg:flex-row lg:justify-center lg:gap-2">
        {ETAPAS.map((etapa, indice) => (
          <div key={etapa.id} className="flex flex-col items-center lg:flex-row">
            {/* Botão da etapa — área de toque bem maior que 48px */}
            <button
              type="button"
              onClick={() => setEtapaAberta(etapa)}
              className={`tocavel vidro w-44 rounded-2xl p-4 text-center ${
                etapa.destaque ? 'ring-2 ring-amber-300/80' : ''
              }`}
            >
              <span className="text-4xl">{etapa.emoji}</span>
              <p className="mt-1 text-lg font-black">{etapa.nome}</p>
              <p className="text-sm font-medium text-white/70">{etapa.resumo}</p>
            </button>

            {/* Seta animada entre as etapas */}
            {indice < ETAPAS.length - 1 && (
              <span
                className="seta-fluxo my-1 text-3xl text-amber-300 lg:mx-1 lg:my-0"
                style={{ animationDelay: `${indice * 0.25}s` }}
              >
                <span className="inline-block lg:hidden">⬇️</span>
                <span className="hidden lg:inline-block">➡️</span>
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Destaque da tecnologia LoRa */}
      <div className="vidro mx-auto mt-6 max-w-2xl rounded-3xl border-amber-300/40 p-5 text-center">
        <p className="text-lg font-bold text-amber-200">
          📡 Os dados viajam quilômetros sem internet, usando menos energia que uma lâmpada de LED!
        </p>
        <p className="mt-1 text-sm text-white/70">Essa é a mágica da tecnologia LoRa. Toque nela acima! ☝️</p>
      </div>

      {/* Diferenciais técnicos: norma WMO + energia solar */}
      <div className="mx-auto mt-4 grid max-w-4xl gap-4 lg:grid-cols-2">
        {/* Bloco 1 — dados conforme a norma WMO/OMM */}
        <div className="vidro rounded-3xl p-5">
          <p className="text-xl font-black text-sky-200">📏 Dados com padrão profissional</p>
          <p className="mt-2 text-sm leading-relaxed text-white/80 sm:text-base">
            Nossos números não são "fotos instantâneas": são <strong>médias</strong> calculadas ao
            longo do tempo, do mesmo jeito que as estações meteorológicas oficiais fazem. O vento,
            por exemplo, é a média dos últimos 2 minutos — e ainda medimos a <strong>rajada</strong>,
            o pico de vento em apenas 3 segundos (a mesma definição usada pela{' '}
            <strong>OMM</strong>, a Organização Meteorológica Mundial, para alertas de tempestade)! 🌬️
          </p>
        </div>

        {/* Bloco 2 — energia solar + cochilo */}
        <div className="vidro rounded-3xl p-5">
          <div className="flex items-center gap-3">
            <IconeCochilo tamanho={64} />
            <p className="text-xl font-black text-emerald-200">🔋 Energia solar e baixo consumo</p>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-white/80 sm:text-base">
            Lá fora, a estação funciona com <strong>energia solar</strong>. Entre uma medição e
            outra, ela tira um <strong>cochilo de poucos minutos</strong> para poupar bateria — por
            isso os dados chegam a cada 5 minutos, não a cada segundo! Acordar → medir → enviar →
            dormir: assim ela funciona dia e noite sem ninguém precisar trocar pilha. 😴☀️
          </p>
        </div>
      </div>

      {/* Popup (modal) com a explicação da etapa tocada */}
      {etapaAberta && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setEtapaAberta(null)}
        >
          <div
            className="vidro animate-aparecer w-full max-w-lg rounded-3xl bg-indigo-950/80 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="text-5xl">{etapaAberta.emoji}</span>
              <h3 className="text-3xl font-black">{etapaAberta.nome}</h3>
            </div>
            <p className="mt-4 text-lg leading-relaxed text-white/90">{etapaAberta.explicacao}</p>
            <button
              type="button"
              onClick={() => setEtapaAberta(null)}
              className="tocavel mt-6 w-full rounded-2xl bg-amber-400 py-4 text-xl font-black text-indigo-950"
            >
              Entendi! 👍
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
