// ============================================================
// App — componente principal do site
// Organiza a navegação por seções (sem scroll infinito!),
// o fundo dinâmico, o modo atrativo e o botão Início.
// ============================================================
import { useEffect, useState } from 'react';
import Hero from './components/Hero.jsx';
import PainelCards from './components/PainelCards.jsx';
import AvisoDesconectado from './components/AvisoDesconectado.jsx';
import ComoFunciona from './components/ComoFunciona.jsx';
import Meteorinho from './components/Meteorinho.jsx';
import Graficos from './components/Graficos.jsx';
import Rodape from './components/Rodape.jsx';
import ModoAtrativo from './components/ModoAtrativo.jsx';
import ParticulasChuva from './components/ParticulasChuva.jsx';
import CeuEstrelado from './components/CeuEstrelado.jsx';
import AuroraFundo from './components/AuroraFundo.jsx';
import { useEstacao } from './hooks/useEstacao.js';
import { useInatividade } from './hooks/useInatividade.js';
import { condicaoDoCeu } from './utils/clima.js';

// Após 2 minutos sem toques, entra o modo descanso (atrativo)
const TEMPO_PARA_MODO_ATRATIVO = 2 * 60 * 1000;

// Seções navegáveis do site (botões grandes no rodapé da tela)
const SECOES = [
  { id: 'agora', rotulo: '📊 Agora' },
  { id: 'como-funciona', rotulo: '⚙️ Como Funciona' },
  { id: 'meteorinho', rotulo: '💬 Meteorinho' },
  { id: 'graficos', rotulo: '📈 Gráficos' },
];

export default function App() {
  // Dados em tempo real vindos do Firebase
  const { dados, historico, statusSistema, timestampLeitura, agoraEpoch } = useEstacao();

  // Seção visível no momento
  const [secaoAtiva, setSecaoAtiva] = useState('agora');

  // Modo atrativo: ativo quando ninguém toca a tela por 2 minutos
  const inativo = useInatividade(TEMPO_PARA_MODO_ATRATIVO);

  // Condição do céu calculada a partir dos sensores reais
  const condicao = condicaoDoCeu(dados);
  const ehNoite = condicao === 'noite';
  const estaChovendo = condicao === 'chuvoso';

  // Quando o visitante volta do modo atrativo, recomeça do início
  useEffect(() => {
    if (inativo) setSecaoAtiva('agora');
  }, [inativo]);

  // Botão Início: volta para a primeira seção e rola ao topo
  function irParaInicio() {
    setSecaoAtiva('agora');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Troca de seção com rolagem ao topo (cada seção é uma "página")
  function trocarSecao(id) {
    setSecaoAtiva(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    // O fundo muda de cor conforme o clima REAL (dark mode automático à noite)
    <div className={`fundo-clima fundo-${condicao} min-h-screen ${ehNoite ? 'dark' : ''}`}>
      {/* Fundo aurora — blobs de luz que mudam de cor com o clima */}
      <AuroraFundo condicao={condicao} />

      {/* Efeitos de ambiente que reagem ao clima de verdade */}
      {estaChovendo && <ParticulasChuva />}
      {ehNoite && <CeuEstrelado />}

      {/* Modo descanso — cobre tudo; qualquer toque sai dele
          (o useInatividade detecta o toque e "inativo" vira false) */}
      {inativo && <ModoAtrativo dados={dados} condicao={condicao} status={statusSistema} />}

      {/* Botão Início — SEMPRE visível, no canto superior esquerdo */}
      <button
        type="button"
        onClick={irParaInicio}
        className="tocavel vidro fixed left-3 top-3 z-30 flex min-h-[56px] min-w-[56px] items-center gap-2 rounded-2xl px-4 text-lg font-black text-white"
        aria-label="Voltar ao início"
      >
        🏠 <span className="hidden sm:inline">Início</span>
      </button>

      {/* Conteúdo principal */}
      <main className="mx-auto max-w-6xl pb-6">
        <Hero
          statusSistema={statusSistema}
          timestampLeitura={timestampLeitura}
          agoraEpoch={agoraEpoch}
          condicao={condicao}
        />

        <div className="mt-4 space-y-10">
          {secaoAtiva === 'agora' && (
            <div className="animate-aparecer">
              {/* Se o receptor caiu ou os sensores pararam de enviar, mostra
                  um AVISO no lugar dos dados atrasados (nunca "dado velho"
                  disfarçado de atual). Só mostra os cards quando online. */}
              {statusSistema === 'online' ? (
                <PainelCards dados={dados} />
              ) : (
                <AvisoDesconectado
                  status={statusSistema}
                  timestampLeitura={timestampLeitura}
                  agoraEpoch={agoraEpoch}
                />
              )}
            </div>
          )}

          {secaoAtiva === 'como-funciona' && (
            <div className="animate-aparecer">
              <ComoFunciona />
            </div>
          )}

          {secaoAtiva === 'meteorinho' && (
            <div className="animate-aparecer">
              <Meteorinho
                dados={dados}
                statusSistema={statusSistema}
                timestampLeitura={timestampLeitura}
                agoraEpoch={agoraEpoch}
              />
            </div>
          )}

          {secaoAtiva === 'graficos' && (
            <div className="animate-aparecer">
              <Graficos historico={historico} />
            </div>
          )}

          <Rodape />
        </div>
      </main>

      {/* Barra de navegação fixa — botões grandes, fácil para qualquer dedo.
          A "pílula" âmbar DESLIZA suavemente até o botão ativo. */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 px-2 pb-2">
        <div className="vidro relative mx-auto flex max-w-3xl rounded-3xl bg-indigo-950/40 p-2">
          {/* Indicador deslizante: largura de 1 botão, desliza via translateX */}
          <span
            className="absolute bottom-2 top-2 rounded-2xl bg-amber-400 shadow-lg transition-transform duration-300 ease-out"
            style={{
              left: '8px',
              width: `calc((100% - 16px) / ${SECOES.length})`,
              transform: `translateX(${SECOES.findIndex((s) => s.id === secaoAtiva) * 100}%)`,
            }}
            aria-hidden="true"
          />
          {SECOES.map((secao) => (
            <button
              key={secao.id}
              type="button"
              onClick={() => trocarSecao(secao.id)}
              className={`tocavel relative z-10 min-h-[60px] flex-1 rounded-2xl px-1 text-sm font-black transition-colors duration-300 sm:text-lg ${
                secaoAtiva === secao.id ? 'text-indigo-950' : 'text-white'
              }`}
            >
              {secao.rotulo}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
