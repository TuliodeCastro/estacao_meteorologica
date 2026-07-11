// ============================================================
// Gráficos — histórico da sessão OU do banco (24 h / 7 dias)
// Seletores por BOTÕES GRANDES (nada de dropdown, ruim no touch!):
//  - variável (temperatura, vento, ...)
//  - período (sessão atual, últimas 24 h, últimos 7 dias)
// O histórico de 24 h / 7 dias vem de /estacao/historico (gravado
// pelo gateway), consultado sob demanda.
// ============================================================
import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { buscarHistorico } from '../historico.js';

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

// Períodos: "sessão" usa o histórico em memória; os outros consultam o banco
const PERIODOS = [
  { id: 'sessao', rotulo: '⏱️ Sessão', janela: null, incluirData: false },
  { id: '24h', rotulo: '📅 24 horas', janela: 24 * 3600, incluirData: false },
  { id: '7d', rotulo: '🗓️ 7 dias', janela: 7 * 24 * 3600, incluirData: true },
];

export default function Graficos({ historico }) {
  // Variável e período selecionados
  const [selecionada, setSelecionada] = useState(VARIAVEIS[0]);
  const [periodo, setPeriodo] = useState(PERIODOS[0]);

  // Dados vindos do banco (para 24 h / 7 dias) + estado de carregamento
  const [dadosBanco, setDadosBanco] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(false);

  // Quando o período muda para 24 h / 7 dias, busca o histórico no banco
  useEffect(() => {
    if (periodo.id === 'sessao') return;

    let cancelado = false;
    setCarregando(true);
    setErro(false);

    buscarHistorico(periodo.janela, periodo.incluirData)
      .then((pontos) => {
        if (!cancelado) setDadosBanco(pontos);
      })
      .catch(() => {
        if (!cancelado) setErro(true);
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [periodo]);

  // Fonte de dados conforme o período
  const dados = periodo.id === 'sessao' ? historico : dadosBanco;
  const muitosPontos = dados.length > 40; // esconde os pontinhos em séries longas

  return (
    <section className="px-4 text-white">
      <h2 className="mb-2 text-center text-3xl font-black sm:text-4xl">📈 Gráficos</h2>
      <p className="mb-4 text-center text-lg font-medium text-white/80">
        {periodo.id === 'sessao'
          ? 'Leituras recebidas desde que esta tela foi ligada (a cada 5 minutos).'
          : `Histórico ${periodo.id === '24h' ? 'das últimas 24 horas' : 'dos últimos 7 dias'}, guardado no banco.`}
      </p>

      {/* Seletor de PERÍODO */}
      <div className="mb-3 flex flex-wrap justify-center gap-2">
        {PERIODOS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriodo(p)}
            className={`tocavel min-h-[52px] rounded-2xl px-5 text-base font-bold sm:text-lg ${
              periodo.id === p.id ? 'bg-emerald-400 text-indigo-950 shadow-lg' : 'vidro text-white'
            }`}
          >
            {p.rotulo}
          </button>
        ))}
      </div>

      {/* Seletor de VARIÁVEL */}
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
        {carregando ? (
          <div className="py-16 text-center">
            <p className="animate-brilho text-2xl font-bold">⏳ Carregando histórico…</p>
          </div>
        ) : erro ? (
          <div className="py-16 text-center">
            <p className="text-2xl font-bold">😕 Não consegui carregar o histórico</p>
            <p className="mt-2 text-white/70">Toque de novo no período em alguns segundos.</p>
          </div>
        ) : dados.length < 2 ? (
          <div className="py-16 text-center">
            {periodo.id === 'sessao' ? (
              <>
                <p className="animate-brilho text-2xl font-bold">⏳ Coletando leituras…</p>
                <p className="mt-2 text-white/70">
                  O gráfico aparece após a segunda leitura (elas chegam a cada 5 minutos).
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold">📭 Ainda sem registros neste período</p>
                <p className="mt-2 text-white/70">
                  O histórico é guardado conforme as medições chegam. Volte mais tarde!
                </p>
              </>
            )}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={dados} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
              <XAxis
                dataKey="hora"
                stroke="rgba(255,255,255,0.7)"
                fontSize={13}
                minTickGap={24}
              />
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
                dot={muitosPontos ? false : { r: 4, fill: selecionada.cor }}
                activeDot={{ r: 8 }}
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        <p className="mt-2 text-center text-sm font-semibold text-white/60">
          {selecionada.nome} ({selecionada.unidade}) — {dados.length} leitura(s)
          {periodo.id === 'sessao' ? ' nesta sessão' : ` (${periodo.rotulo.replace(/^[^ ]+ /, '')})`}
        </p>
      </div>
    </section>
  );
}
