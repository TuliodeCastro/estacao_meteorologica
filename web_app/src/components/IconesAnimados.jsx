// ============================================================
// Ícones animados em SVG puro (leves para o totem!)
// Cada ícone reage aos dados REAIS dos sensores:
//  - o cata-vento gira na velocidade proporcional ao vento
//  - a bússola aponta para a direção real
//  - o sol pulsa, as gotas caem...
// ============================================================

/** Sol pulsando com raios girando devagar (temperatura/irradiância) */
export function IconeSol({ tamanho = 80 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" aria-hidden="true">
      <g className="raios-sol">
        {/* 8 raios ao redor do sol */}
        {Array.from({ length: 8 }).map((_, i) => (
          <rect
            key={i}
            x="48"
            y="4"
            width="4"
            height="16"
            rx="2"
            fill="#fbbf24"
            transform={`rotate(${i * 45} 50 50)`}
          />
        ))}
      </g>
      <circle cx="50" cy="50" r="20" fill="#fbbf24" className="animate-pulso-suave">
        {/* brilho interno pulsante */}
      </circle>
      <circle cx="50" cy="50" r="14" fill="#fde68a" opacity="0.8" />
    </svg>
  );
}

/** Termômetro com "mercúrio" que sobe conforme a temperatura real */
export function IconeTermometro({ tamanho = 80, temperatura = 20 }) {
  // Converte a temperatura (0 a 40 °C) em altura da coluna (0 a 38 px)
  const proporcao = Math.min(Math.max(temperatura / 40, 0.08), 1);
  const altura = 38 * proporcao;
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" aria-hidden="true">
      <rect x="42" y="10" width="16" height="56" rx="8" fill="#fff" opacity="0.35" />
      <rect
        x="46"
        y={62 - altura}
        width="8"
        height={altura + 4}
        rx="4"
        fill="#ef4444"
        style={{ transition: 'all 1.5s ease' }}
      />
      <circle cx="50" cy="74" r="14" fill="#ef4444" className="animate-pulso-suave" />
      <circle cx="50" cy="74" r="8" fill="#fca5a5" />
    </svg>
  );
}

/** Gota d'água com gotinhas pingando (umidade) */
export function IconeGota({ tamanho = 80 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" aria-hidden="true">
      <path
        d="M50 12 C50 12 26 44 26 60 a24 24 0 0 0 48 0 C74 44 50 12 50 12 Z"
        fill="#38bdf8"
        className="animate-pulso-suave"
      />
      <path d="M40 58 a10 12 0 0 0 6 14" stroke="#bae6fd" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="30" cy="22" r="4" fill="#7dd3fc" className="pingando" />
      <circle cx="72" cy="18" r="3" fill="#7dd3fc" className="pingando" style={{ animationDelay: '0.7s' }} />
    </svg>
  );
}

/** Barômetro com ponteiro que se move conforme a pressão real */
export function IconePressao({ tamanho = 80, pressao = 890 }) {
  // Em Ouro Preto (1.179 m) a pressão típica fica entre ~860 e ~910 hPa.
  // Mapeamos essa faixa para o ângulo do ponteiro (-80° a +80°).
  const proporcao = Math.min(Math.max((pressao - 860) / 50, 0), 1);
  const angulo = -80 + proporcao * 160;
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="55" r="34" fill="#fff" opacity="0.25" />
      <circle cx="50" cy="55" r="28" fill="#fff" opacity="0.25" />
      {/* marcações do mostrador */}
      {Array.from({ length: 9 }).map((_, i) => (
        <rect
          key={i}
          x="49"
          y="25"
          width="2"
          height="7"
          fill="#e0e7ff"
          transform={`rotate(${-80 + i * 20} 50 55)`}
        />
      ))}
      {/* ponteiro */}
      <g style={{ transition: 'transform 1.5s ease', transformOrigin: '50px 55px', transform: `rotate(${angulo}deg)` }}>
        <path d="M50 55 L46 55 L50 30 L54 55 Z" fill="#f87171" />
      </g>
      <circle cx="50" cy="55" r="5" fill="#fecaca" />
    </svg>
  );
}

/** Nuvem com gotas caindo (chuva) — as gotas só caem se chove! */
export function IconeChuva({ tamanho = 80, chovendo = false }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" aria-hidden="true">
      <g className="animate-flutuar">
        <ellipse cx="40" cy="40" rx="20" ry="15" fill="#e2e8f0" />
        <ellipse cx="60" cy="36" rx="22" ry="17" fill="#f1f5f9" />
        <ellipse cx="50" cy="46" rx="28" ry="14" fill="#f8fafc" />
      </g>
      {chovendo ? (
        <>
          <line x1="34" y1="64" x2="30" y2="76" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" className="pingando" />
          <line x1="52" y1="64" x2="48" y2="76" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" className="pingando" style={{ animationDelay: '0.5s' }} />
          <line x1="70" y1="64" x2="66" y2="76" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" className="pingando" style={{ animationDelay: '1s' }} />
        </>
      ) : (
        // Sem chuva: gotas "esperando" bem clarinhas
        <g opacity="0.25">
          <line x1="34" y1="64" x2="32" y2="70" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
          <line x1="52" y1="64" x2="50" y2="70" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
          <line x1="70" y1="64" x2="68" y2="70" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

/**
 * Anemômetro (cata-vento de conchas) girando na velocidade
 * PROPORCIONAL ao vento real medido pela estação!
 */
export function IconeCatavento({ tamanho = 80, velocidadeKMH = 0 }) {
  // Quanto mais vento, mais rápido o giro.
  // 0 km/h → praticamente parado (60 s/volta); 40 km/h → 0,4 s/volta.
  const velocidade = Math.max(Number(velocidadeKMH) || 0, 0.05);
  const duracaoSegundos = Math.min(16 / velocidade, 60);
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" aria-hidden="true">
      {/* haste */}
      <rect x="47" y="46" width="6" height="44" rx="3" fill="#cbd5e1" />
      {/* conchas girando */}
      <g className="girando" style={{ animationDuration: `${duracaoSegundos}s` }}>
        {[0, 120, 240].map((angulo) => (
          <g key={angulo} transform={`rotate(${angulo} 50 42)`}>
            <line x1="50" y1="42" x2="50" y2="16" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
            <circle cx="50" cy="13" r="8" fill="#38bdf8" />
            <circle cx="48" cy="11" r="3" fill="#bae6fd" />
          </g>
        ))}
        <circle cx="50" cy="42" r="6" fill="#e2e8f0" />
      </g>
    </svg>
  );
}

/**
 * Rajada de vento — linhas de vento "soprando" com força.
 * A rajada é o pico de 3 s; o ícone passa essa sensação de intensidade.
 */
export function IconeRajada({ tamanho = 80 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" aria-hidden="true">
      {/* três linhas de vento de comprimentos diferentes, deslizando */}
      <g fill="none" stroke="#fbbf24" strokeWidth="6" strokeLinecap="round">
        <path d="M14 34 H64 a10 10 0 1 0 -10 -10" className="seta-fluxo" />
        <path d="M14 52 H78 a12 12 0 1 1 -12 12" className="seta-fluxo" style={{ animationDelay: '0.2s' }} />
        <path d="M14 70 H56 a9 9 0 1 0 -9 9" className="seta-fluxo" style={{ animationDelay: '0.4s' }} />
      </g>
    </svg>
  );
}

/**
 * Ciclo de baixo consumo — sol/bateria/"zzz".
 * Ilustra a estação que funciona a energia solar e "cochila"
 * entre uma medição e outra para poupar bateria.
 */
export function IconeCochilo({ tamanho = 80 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" aria-hidden="true">
      {/* sol */}
      <circle cx="28" cy="30" r="12" fill="#fbbf24" className="animate-pulso-suave" />
      {/* bateria carregando */}
      <rect x="50" y="20" width="34" height="20" rx="4" fill="none" stroke="#34d399" strokeWidth="3" />
      <rect x="84" y="26" width="4" height="8" rx="2" fill="#34d399" />
      <rect x="54" y="24" width="9" height="12" rx="1" fill="#34d399" />
      <rect x="65" y="24" width="9" height="12" rx="1" fill="#34d399" opacity="0.5" className="animate-brilho" />
      {/* "zzz" do cochilo, subindo */}
      <text x="42" y="74" fontSize="16" fontWeight="bold" fill="#a5b4fc" className="pingando">z</text>
      <text x="56" y="66" fontSize="20" fontWeight="bold" fill="#c7d2fe" className="pingando" style={{ animationDelay: '0.5s' }}>z</text>
      <text x="72" y="58" fontSize="24" fontWeight="bold" fill="#e0e7ff" className="pingando" style={{ animationDelay: '1s' }}>z</text>
    </svg>
  );
}

/** Bússola com agulha apontando a direção REAL do vento */
export function IconeBussola({ tamanho = 80, graus = 0 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="38" fill="#fff" opacity="0.25" />
      <circle cx="50" cy="50" r="32" fill="#fff" opacity="0.2" />
      {/* pontos cardeais */}
      <text x="50" y="20" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#fff">N</text>
      <text x="50" y="89" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#e2e8f0">S</text>
      <text x="86" y="54" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#e2e8f0">L</text>
      <text x="14" y="54" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#e2e8f0">O</text>
      {/* agulha — gira suavemente até a direção medida */}
      <g className="agulha-bussola" style={{ transform: `rotate(${Number(graus) || 0}deg)` }}>
        <path d="M50 24 L44 50 L56 50 Z" fill="#ef4444" />
        <path d="M50 76 L44 50 L56 50 Z" fill="#e2e8f0" />
      </g>
      <circle cx="50" cy="50" r="4" fill="#fbbf24" />
    </svg>
  );
}

/** Painel solar recebendo raios (irradiância) */
export function IconeIrradiancia({ tamanho = 80 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" aria-hidden="true">
      {/* sol no canto */}
      <circle cx="26" cy="22" r="11" fill="#fbbf24" className="animate-pulso-suave" />
      {/* raios chegando ao painel */}
      <line x1="34" y1="32" x2="46" y2="46" stroke="#fde047" strokeWidth="3" strokeLinecap="round" className="animate-brilho" />
      <line x1="26" y1="38" x2="34" y2="52" stroke="#fde047" strokeWidth="3" strokeLinecap="round" className="animate-brilho" style={{ animationDelay: '0.5s' }} />
      {/* painel solar inclinado */}
      <g transform="rotate(-14 60 64)">
        <rect x="38" y="52" width="46" height="26" rx="3" fill="#1e3a8a" stroke="#93c5fd" strokeWidth="2" />
        <line x1="53" y1="52" x2="53" y2="78" stroke="#93c5fd" strokeWidth="1.5" />
        <line x1="68" y1="52" x2="68" y2="78" stroke="#93c5fd" strokeWidth="1.5" />
        <line x1="38" y1="65" x2="84" y2="65" stroke="#93c5fd" strokeWidth="1.5" />
      </g>
      <rect x="58" y="80" width="5" height="12" fill="#94a3b8" />
    </svg>
  );
}

/** Nuvem simpática — avatar do Meteorinho 🥰 */
export function IconeMeteorinho({ tamanho = 64 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" aria-hidden="true" className="animate-flutuar">
      {/* corpo de nuvem */}
      <ellipse cx="36" cy="52" rx="20" ry="16" fill="#fff" />
      <ellipse cx="62" cy="48" rx="24" ry="19" fill="#fff" />
      <ellipse cx="50" cy="60" rx="30" ry="16" fill="#fff" />
      {/* bochechas */}
      <circle cx="36" cy="60" r="4" fill="#fda4af" opacity="0.8" />
      <circle cx="66" cy="60" r="4" fill="#fda4af" opacity="0.8" />
      {/* olhos */}
      <circle cx="43" cy="52" r="4" fill="#1e293b" />
      <circle cx="59" cy="52" r="4" fill="#1e293b" />
      <circle cx="44.5" cy="50.5" r="1.5" fill="#fff" />
      <circle cx="60.5" cy="50.5" r="1.5" fill="#fff" />
      {/* sorriso */}
      <path d="M44 62 Q51 69 58 62" stroke="#1e293b" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}
