// ============================================================
// ArcoSolar — o "caminho do sol" no céu, detectado da irradiância
// O arco ocupa o card inteiro. O SVG usa coordenadas normalizadas
// (0–100) e estica com o card; o sol e as pontas são elementos HTML
// posicionados em %, então continuam perfeitamente redondos.
// ============================================================
import { useEffect, useState } from 'react';
import { buscarSol, analisarSol } from '../sol.js';

// Horário HH:MM no fuso de Ouro Preto (independe do fuso do aparelho)
function horaBRT(epoch) {
  return new Date(epoch * 1000).toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function duracaoTexto(segundos) {
  const h = Math.floor(segundos / 3600);
  const m = Math.round((segundos % 3600) / 60);
  return `${h}h${String(m).padStart(2, '0')}`;
}

// Geometria do arco em % do card (horizonte em 88%, topo em 12%)
const X_INICIO = 4;
const X_FIM = 96;
const Y_BASE = 88;
const ALTURA = 76;

function posicaoNoArco(fracao) {
  const ang = Math.PI * (1 - fracao);
  return {
    x: 50 + ((X_FIM - X_INICIO) / 2) * Math.cos(ang),
    y: Y_BASE - ALTURA * Math.sin(ang),
  };
}

function Moldura({ children }) {
  return (
    <div className="vidro mx-4 rounded-3xl px-5 py-4 text-white">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
        Caminho do sol
      </p>
      {children}
    </div>
  );
}

export default function ArcoSolar({ agoraEpoch }) {
  const [pontos, setPontos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Busca a irradiância recente ao montar e a cada 5 min
  useEffect(() => {
    let vivo = true;
    const carregar = () =>
      buscarSol(30 * 3600)
        .then((p) => vivo && setPontos(p))
        .catch(() => {})
        .finally(() => vivo && setCarregando(false));
    carregar();
    const timer = setInterval(carregar, 5 * 60 * 1000);
    return () => {
      vivo = false;
      clearInterval(timer);
    };
  }, []);

  const { ehDia, nascerHoje, porHoje, nascerOntem, porOntem } = analisarSol(pontos);
  const agora = agoraEpoch || Math.floor(Date.now() / 1000);

  // Extremos do arco: dia de hoje completo, dia em curso, ou madrugada
  let arcoNascer = null;
  let arcoPor = null;
  let porEstimado = false;
  if (nascerHoje && porHoje) {
    arcoNascer = nascerHoje;
    arcoPor = porHoje;
  } else if (nascerHoje) {
    // Dia em curso: estima o pôr somando 24 h ao pôr de ontem
    // (o horário do pôr muda ~1 min por dia, então é bem preciso).
    arcoNascer = nascerHoje;
    arcoPor = porOntem ? porOntem + 86400 : nascerHoje + 11 * 3600;
    porEstimado = true;
  } else if (nascerOntem && porOntem) {
    arcoNascer = nascerOntem;
    arcoPor = porOntem;
  }

  if (carregando && !pontos.length) {
    return (
      <Moldura>
        <p className="mt-2 text-center text-sm text-white/70">
          Detectando o sol pela irradiância…
        </p>
      </Moldura>
    );
  }
  if (!arcoNascer || !arcoPor || arcoPor <= arcoNascer) {
    return (
      <Moldura>
        <p className="mt-2 text-center text-sm text-white/70">
          Coletando a irradiância ao longo do dia…
        </p>
      </Moldura>
    );
  }

  const duracao = arcoPor - arcoNascer;
  // Fração do dia percorrida (fica em 1 se o dia passar da estimativa —
  // o sol repousa no fim do arco em vez de sumir).
  const fracao = Math.min(Math.max((agora - arcoNascer) / duracao, 0), 1);
  const sol = posicaoNoArco(fracao);

  return (
    <Moldura>
      {/* Arco ocupando o card inteiro */}
      <div className="relative mt-2 h-28 w-full sm:h-36">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="arcoGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#fde68a" />
              <stop offset="100%" stopColor="#fb923c" />
            </linearGradient>
          </defs>

          <path
            d={`M ${X_INICIO} ${Y_BASE} A ${(X_FIM - X_INICIO) / 2} ${ALTURA} 0 0 1 ${X_FIM} ${Y_BASE}`}
            fill="none"
            stroke="url(#arcoGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            opacity={ehDia ? 0.95 : 0.4}
          />
          <line
            x1="0"
            y1={Y_BASE}
            x2="100"
            y2={Y_BASE}
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* pontas do arco (HTML: continuam redondas mesmo esticando) */}
        <span
          className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400"
          style={{ left: `${X_INICIO}%`, top: `${Y_BASE}%` }}
        />
        <span
          className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-400"
          style={{ left: `${X_FIM}%`, top: `${Y_BASE}%` }}
        />

        {/* sol durante o dia · lua à noite */}
        {ehDia ? (
          <span
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${sol.x}%`, top: `${sol.y}%` }}
          >
            <span className="block h-5 w-5 rounded-full bg-amber-300 shadow-[0_0_22px_8px_rgba(253,224,71,0.45)] sm:h-6 sm:w-6" />
          </span>
        ) : (
          <span className="absolute left-1/2 top-[26%] -translate-x-1/2 -translate-y-1/2">
            <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
              <defs>
                <mask id="luaMask">
                  <circle cx="18" cy="18" r="13" fill="white" />
                  <circle cx="24" cy="14" r="12" fill="black" />
                </mask>
              </defs>
              <circle cx="18" cy="18" r="13" fill="#e2e8f0" opacity="0.9" mask="url(#luaMask)" />
            </svg>
          </span>
        )}
      </div>

      {/* nascer · duração · pôr */}
      <div className="mt-2 flex items-end justify-between px-1">
        <div className="text-left">
          <p className="numeros-tabulares text-2xl font-black leading-none sm:text-3xl">
            {horaBRT(arcoNascer)}
          </p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-white/50">
            Nascer
          </p>
        </div>

        <div className="text-center">
          <p className="text-lg font-bold leading-none text-white/80 sm:text-xl">
            {duracaoTexto(duracao)}
          </p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-white/50">
            Duração
          </p>
        </div>

        <div className="text-right">
          <p className="numeros-tabulares text-2xl font-black leading-none sm:text-3xl">
            {horaBRT(arcoPor)}
          </p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-white/50">
            Pôr{porEstimado ? ' · prev.' : ''}
          </p>
        </div>
      </div>
    </Moldura>
  );
}
