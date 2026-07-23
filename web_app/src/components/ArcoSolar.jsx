// ============================================================
// ArcoSolar — o "caminho do sol" no céu, detectado da irradiância
// Mostra nascer, pôr e duração do dia (medidos pelos sensores) e
// um sol que percorre o arco conforme o horário atual.
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
  return `${h} h ${String(m).padStart(2, '0')} min`;
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

  // Estados de carregamento / sem dados
  if (carregando && !pontos.length) {
    return (
      <div className="vidro mx-4 rounded-3xl p-6 text-center text-white">
        <p className="animate-brilho text-xl font-bold">☀️ Analisando o caminho do sol…</p>
      </div>
    );
  }
  if (!nascer && !por) {
    return (
      <div className="vidro mx-4 rounded-3xl p-6 text-center text-white">
        <p className="text-lg font-bold">🌤️ Nascer e pôr do sol</p>
        <p className="mt-1 text-sm text-white/70">
          Coletando a irradiância ao longo do dia para detectar o sol…
        </p>
      </div>
    );
  }

  // É dia agora se o último evento foi um nascer (nascer mais recente que o pôr)
  const ehDia = nascer && (!por || nascer > por);
  const duracaoDia = parNascer && parPor ? parPor - parNascer : null;

  // Extremos do arco (nascer → pôr). Se o dia está em curso, estima o pôr
  // somando a duração do último dia completo ao nascer de hoje.
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

  // Fração do dia já percorrida (0 = nascer, 1 = pôr)
  const fracao =
    arcoPor > arcoNascer ? Math.min(Math.max((agora - arcoNascer) / (arcoPor - arcoNascer), 0), 1) : 0;
  const mostrarSol = ehDia && fracao > 0 && fracao < 1;

  // Posição do sol sobre o arco elíptico (A 160,140)
  const angulo = Math.PI * (1 - fracao);
  const solX = 200 + 160 * Math.cos(angulo);
  const solY = 160 - 140 * Math.sin(angulo);

  return (
    <div className="vidro mx-4 rounded-3xl p-5 text-white sm:p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold uppercase tracking-wider text-white/80 sm:text-xl">
          Caminho do sol
        </h3>
        <span className="text-sm font-semibold text-white/60">detectado pela irradiância ☀️</span>
      </div>

      {/* Arco do céu com o sol na posição atual */}
      <svg viewBox="0 0 400 185" className="mt-2 w-full" aria-hidden="true">
        <defs>
          <linearGradient id="ceuArco" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="brilhoSol">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#f59e0b" />
          </radialGradient>
        </defs>

        {/* preenchimento suave do céu sob o arco */}
        <path d="M40,160 A160,140 0 0,1 360,160 Z" fill="url(#ceuArco)" />
        {/* trilho do arco */}
        <path
          d="M40,160 A160,140 0 0,1 360,160"
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="3"
          strokeDasharray="4 9"
          strokeLinecap="round"
        />
        {/* linha do horizonte */}
        <line x1="16" y1="160" x2="384" y2="160" stroke="rgba(255,255,255,0.45)" strokeWidth="2" />

        {/* marcadores de nascer (esq.) e pôr (dir.) */}
        <circle cx="40" cy="160" r="6" fill="#fbbf24" />
        <text x="40" y="178" textAnchor="middle" fontSize="13" fill="#fde68a">
          🌅
        </text>
        <circle cx="360" cy="160" r="6" fill="#f97316" />
        <text x="360" y="178" textAnchor="middle" fontSize="13" fill="#fed7aa">
          🌇
        </text>

        {/* sol na posição atual (só quando é dia) ou lua (à noite) */}
        {mostrarSol ? (
          <g>
            <circle cx={solX} cy={solY} r="18" fill="url(#brilhoSol)" opacity="0.35" />
            <circle cx={solX} cy={solY} r="11" fill="url(#brilhoSol)" />
          </g>
        ) : (
          <text x="200" y="70" textAnchor="middle" fontSize="30">
            🌙
          </text>
        )}
      </svg>

      {/* Números: nascer · duração · pôr */}
      <div className="mt-1 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-white/60">Nascer</p>
          <p className="numeros-tabulares text-2xl font-black sm:text-3xl">
            {horaBRT(ehDia ? nascer : parNascer ?? nascer)}
          </p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-white/60">Duração do dia</p>
          <p className="text-2xl font-black sm:text-3xl">
            {duracaoDia ? duracaoTexto(duracaoDia) : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-white/60">
            Pôr {porEstimado ? '(prev.)' : ''}
          </p>
          <p className="numeros-tabulares text-2xl font-black sm:text-3xl">{horaBRT(arcoPor)}</p>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-white/50">
        Detectado pela irradiância medida na estação (limiar de 5 W/m²).
        {porEstimado && ' O pôr de hoje é uma estimativa até o sol se pôr.'}
      </p>
    </div>
  );
}
