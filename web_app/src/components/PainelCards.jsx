// ============================================================
// Painel principal — cards gigantes com os dados dos sensores
// Valores em fonte enorme, legíveis a 3 metros de distância!
// Visual "Aurora Premium": brilho colorido atrás de cada ícone,
// números com gradiente e efeito count-up quando o valor muda.
// ============================================================
import {
  IconeTermometro,
  IconeGota,
  IconePressao,
  IconeChuva,
  IconeCatavento,
  IconeRajada,
  IconeBussola,
  IconeIrradiancia,
} from './IconesAnimados.jsx';
import { useValorAnimado } from '../hooks/useValorAnimado.js';
import {
  formatarNumero,
  grausParaDirecao,
  saneiaVento,
  valorSensor,
  descricaoTemperatura,
  descricaoUmidade,
  descricaoPressao,
  descricaoChuva,
  descricaoVento,
  descricaoRajada,
  descricaoDirecao,
  descricaoIrradiancia,
} from '../utils/clima.js';

/** Número animado: "corre" do valor antigo ao novo (count-up) */
function NumeroAnimado({ valor, casas }) {
  const valorSuave = useValorAnimado(valor);
  return <>{formatarNumero(valorSuave, casas)}</>;
}

/**
 * Card individual de um sensor.
 * - `cor`: cor de destaque da métrica (brilho atrás do ícone)
 * - `indice`: posição do card → entrada escalonada (stagger)
 * - Valores numéricos usam count-up; textuais usam a animação "pop"
 */
function Card({ icone, titulo, valor, casas, valorTexto, unidade, descricao, extra, cor, indice }) {
  return (
    <div
      className="vidro animate-aparecer rounded-3xl p-5 text-white sm:p-6"
      style={{ animationDelay: `${indice * 90}ms`, animationFillMode: 'backwards' }}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-bold uppercase tracking-wider text-white/70 sm:text-xl">
          {titulo}
        </h3>
        {/* "Palco" do ícone: brilho radial na cor da métrica */}
        <div
          className="relative flex h-20 w-20 items-center justify-center rounded-full"
          style={{ background: `radial-gradient(circle, ${cor}33 0%, transparent 70%)` }}
        >
          <span
            className="absolute inset-0 rounded-full"
            style={{ boxShadow: `0 0 36px 6px ${cor}40` }}
          />
          {icone}
        </div>
      </div>

      {/* Valor GIGANTE — o coração do card */}
      {valorTexto !== undefined ? (
        // Valores em texto (ex.: "Leste") trocam com a animação pop
        <p key={valorTexto} className="animate-pop mt-1 leading-none">
          <span className="texto-gradiente text-6xl font-black sm:text-7xl">{valorTexto}</span>
        </p>
      ) : (
        // Valores numéricos correm suavemente até o novo número
        <p className="numeros-tabulares mt-1 leading-none">
          <span className="texto-gradiente text-6xl font-black sm:text-7xl">
            <NumeroAnimado valor={valor} casas={casas} />
          </span>
          <span className="ml-2 text-2xl font-bold text-white/70 sm:text-3xl">{unidade}</span>
        </p>
      )}

      {extra && <p className="numeros-tabulares mt-2 text-xl font-bold text-white/90">{extra}</p>}

      {/* Mini-descrição didática para o visitante */}
      <p className="mt-3 text-sm font-medium leading-snug text-white/70 sm:text-base">
        {descricao}
      </p>
    </div>
  );
}

export default function PainelCards({ dados }) {
  // Enquanto os primeiros dados não chegam, mostra um aviso amigável
  if (!dados) {
    return (
      <div className="vidro mx-4 rounded-3xl p-10 text-center text-white">
        <p className="animate-brilho text-3xl font-bold">📡 Conectando à estação…</p>
        <p className="mt-2 text-lg text-white/70">Os dados chegam pelo rádio LoRa a cada ~5 minutos.</p>
      </div>
    );
  }

  // valorSensor → NaN se for a sentinela -999 (dado ausente) → card mostra "—".
  // saneiaVento → NaN se o vento for implausível (protege até de dados antigos).
  const temp = valorSensor(dados.temp);
  const umid = valorSensor(dados.umid);
  const pres = valorSensor(dados.pres);
  const chuva = valorSensor(dados.chuva);
  const velMS = saneiaVento(dados.velMS); // velocidade MÉDIA (2 min)
  const rajadaMS = saneiaVento(dados.rajada); // pico de 3 s
  const dir = Number(dados.dir) || 0;
  const irrad = valorSensor(dados.irrad);
  const direcaoTexto = dados.direcao || grausParaDirecao(dir);

  // km/h não vem mais pronto do firmware — calculamos a partir de m/s
  // (NaN se o vento for inválido → o card exibe "—")
  const velKMH = velMS * 3.6;
  const rajadaKMH = rajadaMS * 3.6;
  // Valores seguros só para alimentar os ícones SVG (evita NaN no desenho)
  const tempIcone = Number.isFinite(temp) ? temp : 20;
  const presIcone = Number.isFinite(pres) ? pres : 890;
  const velIcone = Number.isFinite(velKMH) ? velKMH : 0;

  return (
    <section className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 xl:grid-cols-3">
      <Card
        indice={0}
        cor="#fb7185"
        titulo="Temperatura"
        icone={<IconeTermometro temperatura={tempIcone} />}
        valor={temp}
        casas={1}
        unidade="°C"
        descricao={Number.isFinite(temp) ? descricaoTemperatura(temp) : 'Sensor sem leitura no momento. 🔧'}
      />
      <Card
        indice={1}
        cor="#38bdf8"
        titulo="Umidade do ar"
        icone={<IconeGota />}
        valor={umid}
        casas={0}
        unidade="%"
        descricao={Number.isFinite(umid) ? descricaoUmidade(umid) : 'Sensor sem leitura no momento. 🔧'}
      />
      <Card
        indice={2}
        cor="#a78bfa"
        titulo="Pressão"
        icone={<IconePressao pressao={presIcone} />}
        valor={pres}
        casas={1}
        unidade="hPa"
        descricao={descricaoPressao()}
      />
      <Card
        indice={3}
        cor="#34d399"
        titulo="Chuva"
        icone={<IconeChuva chovendo={chuva > 0} />}
        valor={chuva}
        casas={1}
        unidade="mm"
        descricao={Number.isFinite(chuva) ? descricaoChuva(chuva) : 'Sensor sem leitura no momento. 🔧'}
      />
      <Card
        indice={4}
        cor="#fbbf24"
        titulo="Vento médio"
        icone={<IconeCatavento velocidadeKMH={velIcone} />}
        valor={velKMH}
        casas={1}
        unidade="km/h"
        extra={`${formatarNumero(velMS)} m/s · média de 2 min`}
        descricao={descricaoVento(Number.isFinite(velKMH) ? velKMH : 0)}
      />
      <Card
        indice={5}
        cor="#f87171"
        titulo="Rajada de vento"
        icone={<IconeRajada />}
        valor={rajadaMS}
        casas={1}
        unidade="m/s"
        extra={`${formatarNumero(rajadaKMH)} km/h · pico de 3 s`}
        descricao={descricaoRajada(rajadaMS)}
      />
      <Card
        indice={6}
        cor="#f472b6"
        titulo="Direção do vento"
        icone={<IconeBussola graus={dir} />}
        valorTexto={direcaoTexto}
        extra={`${formatarNumero(dir, 0)}°`}
        descricao={descricaoDirecao(direcaoTexto)}
      />
      <Card
        indice={7}
        cor="#f97316"
        titulo="Irradiância solar"
        icone={<IconeIrradiancia />}
        valor={irrad}
        casas={0}
        unidade="W/m²"
        descricao={Number.isFinite(irrad) ? descricaoIrradiancia(irrad) : 'Sensor sem leitura no momento. 🔧'}
      />
    </section>
  );
}
