// ============================================================
// Gráficos em tempo real — histórico da sessão
// O seletor de variável usa BOTÕES GRANDES (nada de dropdown,
// que é ruim de usar em tela touch!)
// ============================================================
import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Variáveis disponíveis para o gráfico
// (vento e rajada em m/s — o firmware novo não envia mais km/h pronto)
const VARIAVEIS = [
  { campo: 'temp', nome: '🌡️ Temperatura', unidade: '°C', cor: '#fb7185' },
  { campo: 'umid', nome: '💧 Umidade', unidade: '%', cor: '#38bdf8' },
  { campo: 'pres', nome: '⏱️ Pressão', unidade: 'hPa', cor: '#a78bfa' },
  { campo: 'chuva', nome: '🌧️ Chuva', unidade: 'mm', cor: '#34d399' },
  { campo: 'velMS', nome: '💨 Vento médio', unidade: 'm/s', cor: '#fbbf24' },
  { campo: 'rajada', nome: '🌬️ Rajada', unidade: 'm/s', cor: '#f87171' },
  { campo: 'irrad', nome: '☀️ Irradiância', unidade: 'W/m²', cor: '#f97316' },
];

export default function Graficos({ historico }) {
  // Variável selecionada (começa pela temperatura)
  const [selecionada, setSelecionada] = useState(VARIAVEIS[0]);

  return (
    <section className="px-4 text-white">
      <h2 className="mb-2 text-center text-3xl font-black sm:text-4xl">📈 Gráficos ao Vivo</h2>
      <p className="mb-4 text-center text-lg font-medium text-white/80">
        Leituras recebidas desde que esta tela foi ligada (a cada 5 minutos).
      </p>

      {/* Seletor por botões grandes — fácil de tocar! */}
      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {VARIAVEIS.map((variavel) => (
          <button
            key={variavel.campo}
            type="button"
            onClick={() => setSelecionada(variavel)}
            className={`tocavel min-h-[52px] rounded-2xl px-5 text-base font-bold sm:text-lg ${
              selecionada.campo === variavel.campo
                ? 'bg-amber-400 text-indigo-950 shadow-lg'
                : 'vidro text-white'
            }`}
          >
            {variavel.nome}
          </button>
        ))}
      </div>

      {/* Área do gráfico */}
      <div className="vidro mx-auto max-w-4xl rounded-3xl p-4 sm:p-6">
        {historico.length < 2 ? (
          // Ainda não há pontos suficientes para desenhar uma linha
          <div className="py-16 text-center">
            <p className="animate-brilho text-2xl font-bold">⏳ Coletando leituras…</p>
            <p className="mt-2 text-white/70">
              O gráfico aparece após a segunda leitura (elas chegam a cada 5 minutos).
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={historico} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
              <XAxis dataKey="hora" stroke="rgba(255,255,255,0.7)" fontSize={13} />
              <YAxis
                stroke="rgba(255,255,255,0.7)"
                fontSize={13}
                domain={['auto', 'auto']}
                width={56}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(30, 27, 75, 0.95)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  borderRadius: '14px',
                  color: '#fff',
                  fontWeight: 600,
                }}
                formatter={(valor) => [`${valor} ${selecionada.unidade}`, selecionada.nome]}
              />
              <Line
                type="monotone"
                dataKey={selecionada.campo}
                stroke={selecionada.cor}
                strokeWidth={4}
                dot={{ r: 4, fill: selecionada.cor }}
                activeDot={{ r: 8 }}
                // Animação suave quando novos pontos entram
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        <p className="mt-2 text-center text-sm font-semibold text-white/60">
          {selecionada.nome} ({selecionada.unidade}) — {historico.length} leitura(s) nesta sessão
        </p>
      </div>
    </section>
  );
}
