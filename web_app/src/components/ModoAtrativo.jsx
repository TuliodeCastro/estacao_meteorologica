// ============================================================
// Modo Atrativo (descanso de tela)
// Entra após 2 minutos sem ninguém tocar no totem.
// Mostra os dados principais em fonte GIGANTE, alternando,
// para atrair os visitantes que passam perto. 👋
// ============================================================
import { useEffect, useState } from 'react';
import { formatarNumero, grausParaDirecao, INFO_CONDICAO } from '../utils/clima.js';

// Troca de destaque a cada 6 segundos
const INTERVALO_ROTACAO = 6000;

export default function ModoAtrativo({ dados, condicao }) {
  const [indice, setIndice] = useState(0);

  // Lista de destaques que vão se alternando na tela
  // (km/h é calculado de velMS — o firmware novo não envia mais km/h pronto)
  const destaques = dados
    ? [
        { emoji: '🌡️', rotulo: 'Temperatura agora', valor: `${formatarNumero(dados.temp)} °C` },
        { emoji: '💧', rotulo: 'Umidade do ar', valor: `${formatarNumero(dados.umid, 0)} %` },
        { emoji: '💨', rotulo: 'Vento médio', valor: `${formatarNumero((Number(dados.velMS) || 0) * 3.6)} km/h` },
        { emoji: '🌬️', rotulo: 'Rajada de vento', valor: `${formatarNumero(dados.rajada)} m/s` },
        { emoji: '🧭', rotulo: 'Vento vindo de', valor: dados.direcao || grausParaDirecao(dados.dir) },
        { emoji: '🌧️', rotulo: 'Chuva acumulada', valor: `${formatarNumero(dados.chuva)} mm` },
        { emoji: '☀️', rotulo: 'Energia do sol', valor: `${formatarNumero(dados.irrad, 0)} W/m²` },
      ]
    : [{ emoji: '📡', rotulo: 'Estação Meteorológica UFOP', valor: 'Conectando…' }];

  // Gira o carrossel de destaques
  useEffect(() => {
    const relogio = setInterval(
      () => setIndice((i) => (i + 1) % destaques.length),
      INTERVALO_ROTACAO
    );
    return () => clearInterval(relogio);
  }, [destaques.length]);

  const destaque = destaques[indice % destaques.length];
  const info = INFO_CONDICAO[condicao] ?? INFO_CONDICAO.noite;

  return (
    // Qualquer toque é capturado pelo App (que fecha este modo)
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-10 text-center text-white">
      <p className="text-2xl font-bold text-white/80 sm:text-3xl">
        {info.emoji} Agora em Ouro Preto · {info.nome}
      </p>

      {/* Destaque gigante que se alterna — key força a animação a cada troca */}
      <div key={indice} className="animate-pop respirando px-6">
        {/* Emoji com anel de progresso ao redor: mostra quando vem o próximo */}
        <div className="relative mx-auto h-44 w-44 sm:h-52 sm:w-52">
          <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full -rotate-90">
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 54}
              strokeDashoffset={2 * Math.PI * 54}
              style={{
                // O anel "enche" no mesmo tempo da rotação dos destaques
                animation: `anel-enche ${INTERVALO_ROTACAO}ms linear forwards`,
              }}
            />
          </svg>
          <p className="flex h-full w-full items-center justify-center text-8xl sm:text-9xl">
            {destaque.emoji}
          </p>
        </div>
        <p className="mt-4 text-3xl font-bold uppercase tracking-widest text-white/70 sm:text-4xl">
          {destaque.rotulo}
        </p>
        <p className="texto-gradiente numeros-tabulares mt-2 text-7xl font-black sm:text-9xl">
          {destaque.valor}
        </p>
      </div>

      {/* Convite pulsante para tocar na tela */}
      <p className="animate-pulso-suave vidro rounded-full px-8 py-5 text-2xl font-black sm:text-3xl">
        👋 Toque na tela para explorar!
      </p>

      {/* Bolinhas indicando a posição no carrossel */}
      <div className="flex gap-2">
        {destaques.map((_, i) => (
          <span
            key={i}
            className={`h-3 w-3 rounded-full ${i === indice ? 'bg-amber-300' : 'bg-white/30'}`}
          />
        ))}
      </div>
    </div>
  );
}
