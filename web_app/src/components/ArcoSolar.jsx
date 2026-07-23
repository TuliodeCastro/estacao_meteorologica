// ============================================================
// ArcoSolar — o "caminho do sol" no céu, detectado da irradiância
// Painel compacto e discreto: um arco fino com o sol percorrendo
// conforme o horário, e nascer / duração / pôr detectados dos
// sensores. Sem emojis — tudo em SVG limpo.
// ============================================================
import { useEffect, useState } from 'react';
import { buscarSol, analisarSol } from '../sol.js';

// Horário HH:MM no fuso de Ouro Preto (independe do fuso do totem)
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

// Geometria do arco (elipse rx=150, ry=70, base y=90)
const CX = 160;
const RX = 140;
const RY = 68;
const BASE_Y = 88;

function pontoNoArco(fracao) {
  const ang = Math.PI * (1 - fracao);
  return { x: CX + RX * Math.cos(ang), y: BASE_Y - RY * Math.sin(ang) };
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

  const { nascer, por, parNascer, parPor } = analisarSol(pontos);
  const agora = agoraEpoch || Math.floor(Date.now() / 1000);

  if ((carregando && !pontos.length) || (!nascer && !por)) {
    return (
      <div className="vidro mx-auto max-w-xl rounded-3xl px-5 py-4 text-center text-white/80">
        <p className="text-sm font-semibold uppercase tracking-widest text-white/50">
          Caminho do sol
        </p>
        <p className="mt-1 text-sm">Detectando o sol pela irradiância…</p>
      </div>
    );
  }

  // É dia agora se o último evento foi um nascer (nascer mais recente que o pôr)
  const ehDia = nascer && (!por || nascer > por);
  const duracaoDia = parNascer && parPor ? parPor - parNascer : null;

  // Extremos do arco. Se o dia está em curso, estima o pôr somando a
  // duração do último dia completo ao nascer de hoje.
  let arcoNascer;
  let arcoPor;
  let porEstimado = false;
  if (ehDia && duracaoDia) {
    arcoNascer = nascer;
    arcoPor = nascer + duracaoDia;
    porEstimado = true;
  } else if (parNascer && parPor) {
    arcoNascer = parNascer;
    arcoPor = parPor;
  } else {
    arcoNascer = nascer ?? por;
    arcoPor = por ?? nascer;
  }

  const fracao =
    arcoPor > arcoNascer ? Math.min(Math.max((agora - arcoNascer) / (arcoPor - arcoNascer), 0), 1) : 0;
  const mostrarSol = ehDia && fracao > 0 && fracao < 1;
  const sol = pontoNoArco(fracao);

  const inicio = pontoNoArco(0);
  const fim = pontoNoArco(1);

  return (
    <div className="vidro mx-auto max-w-xl rounded-3xl px-5 pt-4 pb-3 text-white">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
        Caminho do sol
      </p>

      <svg viewBox="0 0 320 108" className="mt-1 w-full" aria-hidden="true">
        <defs>
          <linearGradient id="arcoGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
          <radialGradient id="solGrad">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="55%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#f59e0b" />
          </radialGradient>
          <mask id="luaCrescente">
            <circle cx={CX} cy="34" r="12" fill="white" />
            <circle cx={CX + 6} cy="30" r="11" fill="black" />
          </mask>
        </defs>

        {/* trilho do arco (fino, gradiente quente) */}
        <path
          d={`M ${inicio.x} ${inicio.y} A ${RX} ${RY} 0 0 1 ${fim.x} ${fim.y}`}
          fill="none"
          stroke="url(#arcoGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity={mostrarSol ? 0.9 : 0.4}
        />

        {/* horizonte */}
        <line
          x1="14"
          y1={BASE_Y}
          x2="306"
          y2={BASE_Y}
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="1"
        />

        {/* marcadores discretos de nascer e pôr */}
        <circle cx={inicio.x} cy={inicio.y} r="3" fill="#fbbf24" />
        <circle cx={fim.x} cy={fim.y} r="3" fill="#fb923c" />

        {mostrarSol ? (
          <g>
            <circle cx={sol.x} cy={sol.y} r="15" fill="url(#solGrad)" opacity="0.28" />
            <circle cx={sol.x} cy={sol.y} r="8" fill="url(#solGrad)" />
          </g>
        ) : (
          <circle cx={CX} cy="34" r="12" fill="#e2e8f0" opacity="0.85" mask="url(#luaCrescente)" />
        )}
      </svg>

      {/* nascer · duração · pôr — tipografia limpa, sem ícones */}
      <div className="-mt-1 flex items-end justify-between px-1">
        <div className="text-left">
          <p className="numeros-tabulares text-2xl font-black leading-none sm:text-3xl">
            {horaBRT(ehDia ? nascer : parNascer ?? nascer)}
          </p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-white/50">
            Nascer
          </p>
        </div>

        <div className="text-center">
          <p className="text-lg font-bold leading-none text-white/80 sm:text-xl">
            {duracaoDia ? duracaoTexto(duracaoDia) : '—'}
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
    </div>
  );
}
