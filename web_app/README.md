# 🌦️ Estação Meteorológica IoT — UFOP

Site de visualização em tempo real dos dados da estação meteorológica IoT
desenvolvida por estudantes de **Engenharia de Controle e Automação da UFOP**.

Projetado para rodar em **totem interativo com tela touch** (orientação
vertical), além de TVs e dispositivos móveis.

> Desenvolvido por **Altamiro Marcos Ferreira Neto** e **Túlio Leandro de Castro**
> Departamento de Engenharia de Controle e Automação — UFOP

---

## 🚀 Como rodar

```bash
npm install        # instala as dependências (só na primeira vez)
npm run dev        # servidor de desenvolvimento → http://localhost:5173
npm run build      # gera a versão final na pasta dist/
npm run preview    # testa a versão final localmente
```

Para o totem, gere o build (`npm run build`) e sirva a pasta `dist/` em
qualquer servidor estático. Abra o navegador em **modo quiosque**:

```bash
chrome --kiosk --noerrdialogs --disable-pinch http://localhost:5173
```

## 🧱 Stack

| Tecnologia | Uso |
|---|---|
| React + Vite | interface e empacotamento |
| Firebase Realtime Database | leitura dos dados em tempo real (`onValue`) |
| Tailwind CSS | estilização (glassmorphism, animações) |
| Recharts | gráficos das leituras |

## 📡 Dados

Conectado a `https://estacao-meteorologica-479ce-default-rtdb.firebaseio.com`,
caminho `/estacao/leituras`. Campos: `temp` (°C), `pres` (hPa), `umid` (%),
`pulsos`, `chuva` (mm), `rpm`, `velMS` (m/s), `velKMH` (km/h), `dir` (graus),
`direcao` (texto), `irrad` (W/m²). As leituras chegam a cada ~2 minutos.

## 🗂️ Estrutura do código (tudo comentado em português!)

```
src/
├── main.jsx                  → entrada + proteções de quiosque + auto-recuperação
├── App.jsx                   → navegação por seções, fundo dinâmico, modo atrativo
├── firebase.js               → conexão com o Firebase + reconexão forçada
├── index.css                 → estilos globais, animações CSS, fundos por clima
├── hooks/
│   ├── useEstacao.js         → escuta o Firebase, histórico, vigia de reconexão
│   └── useInatividade.js     → detecta inatividade (modo atrativo / limpeza do chat)
├── utils/
│   └── clima.js              → condição do céu, frases didáticas, formatação
└── components/
    ├── Hero.jsx              → título + status "🟢 Ao vivo"
    ├── PainelCards.jsx       → cards gigantes com os dados dos sensores
    ├── IconesAnimados.jsx    → SVGs animados (cata-vento gira com o vento real!)
    ├── ComoFunciona.jsx      → diagrama interativo sensores→LoRa→Firebase→site
    ├── Meteorinho.jsx        → chatbot (Claude API + cérebro local de reserva)
    ├── TecladoVirtual.jsx    → teclado na tela para o totem
    ├── Graficos.jsx          → gráficos Recharts com seletor por botões
    ├── ModoAtrativo.jsx      → descanso de tela após 2 min sem toque
    ├── ParticulasChuva.jsx   → chuva na tela quando chove de verdade 🌧️
    ├── CeuEstrelado.jsx      → estrelas no modo noite ✨
    ├── Rodape.jsx            → créditos e logos (placeholders)
    └── ErrorBoundary.jsx     → tela de erro com reinício automático
```

## ⚙️ Comportamentos importantes do totem

- **Modo atrativo**: após 2 min sem toque, mostra os dados em fonte gigante
  com o convite "👋 Toque na tela para explorar!". Qualquer toque sai.
- **Chat com privacidade**: a conversa do Meteorinho é apagada após 1 min
  sem interação.
- **Quiosque**: zoom por pinça/duplo toque bloqueado, seleção de texto
  desativada, sem links externos, botão 🏠 Início sempre visível.
- **Resiliência**: se o Firebase cair, mostra os últimos dados com aviso
  discreto; se nenhuma leitura chegar em 10 min, força reconexão; se o site
  quebrar, recarrega sozinho em 10 s.
- **Fundo dinâmico**: ensolarado / nublado / chuvoso / noite conforme
  `irrad` e `chuva` reais (limiares em `src/utils/clima.js`).

## 🤖 Chatbot Meteorinho

Se `window.claude.complete` (API da Anthropic) estiver disponível no
ambiente, as perguntas vão para o Claude com os dados atuais como contexto.
Caso contrário, um **cérebro local** responde com base em palavras-chave e
nos dados reais — o totem nunca fica sem resposta.

## 🖼️ Logos

Os quadrados "UFOP" e "DECAT" no rodapé ([Rodape.jsx](src/components/Rodape.jsx))
são placeholders — basta substituí-los por `<img>` com os arquivos oficiais.
