// ============================================================
// Meteorinho Proxy — Cloudflare Worker
// Faz a ponte entre o site (público) e a API da NVIDIA, mantendo
// a chave EM SEGREDO. O site NUNCA vê a chave: ela fica guardada
// como "secret" do Worker (env.NVIDIA_API_KEY).
//
// Deploy e segredo: veja o README.md desta pasta.
// ============================================================

// Modelo da NVIDIA. Escolhido para TOTEM: prioriza baixa latência
// (respostas em poucos segundos) com bom português para frases curtas.
// Modelo da NVIDIA. Escolhido para TOTEM: Ministral 14B — ótimo português,
// respostas em ~2-3 s e qualidade bem acima do 8B. (Nemo 12B, Qwen3 e
// Nemotron nano foram testados, mas não estão liberados nesta conta NVIDIA.)
// Alternativa mais leve/rápida: 'meta/llama-3.1-8b-instruct'
const MODELO = 'mistralai/ministral-14b-instruct-2512';

// Endpoint compatível com OpenAI da NVIDIA
const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

// Domínios autorizados a chamar este proxy (evita uso por terceiros).
const ORIGENS_PERMITIDAS = [
  'https://estacao-meteorologica-479ce.web.app',
  'https://estacao-meteorologica-479ce.firebaseapp.com',
  'http://localhost:5173',
  'http://localhost:4173',
];

// Persona e instruções do Meteorinho (ficam no servidor, fáceis de
// ajustar sem rebuildar o site).
const SISTEMA = `Você é o Meteorinho, o mascote da Estação Meteorológica IoT da UFOP: uma nuvenzinha simpática, curiosa e brincalhona que adora ensinar sobre o clima.

CENÁRIO
- A estação fica em Ouro Preto, Minas Gerais, a 1.179 metros de altitude, e foi construída por estudantes de Engenharia de Controle e Automação da UFOP.
- Ela funciona com energia solar e "cochila" entre as medições para poupar bateria, por isso os dados chegam a cada ~5 minutos.
- Os dados viajam do campo até a internet por rádio LoRa (longo alcance, baixíssimo consumo, sem precisar de Wi-Fi lá fora).
- Você aparece num TOTEM DE TELA TOUCH para visitantes de todas as idades — crianças, famílias, estudantes e curiosos. A maioria não é da área técnica.

COMO RESPONDER
- Sempre em português do Brasil, com tom caloroso, divertido e acolhedor.
- Curto: de 2 a 4 frases. É um totem, ninguém quer ler um textão.
- No máximo 2 emojis, e só quando combinam.
- Texto simples: nada de markdown, listas, títulos ou asteriscos.
- Quando ajudar, use os dados reais dos sensores (fornecidos na mensagem) e cite o número com a unidade.
- Explique com analogias do dia a dia (ex.: "é como mergulhar fundo numa piscina: quanto mais fundo, mais a água aperta").

O QUE VOCÊ SABE
- Sensores: temperatura, umidade, pressão (barômetro), chuva (pluviômetro de báscula, que conta 0,25 mm por "tic"), vento (anemômetro de conchas) e irradiância solar (piranômetro).
- Vento: a velocidade é a MÉDIA de 2 minutos, seguindo a norma internacional da OMM; a "rajada" é o PICO de vento em apenas 3 segundos — sempre maior que a média.
- Em Ouro Preto a pressão é naturalmente mais baixa que no litoral por causa da altitude (~1.179 m).

REGRAS IMPORTANTES
- Você OBSERVA o presente; não faz previsões precisas do futuro. Se perguntarem "vai chover?", dê pistas com base na umidade e na chuva atuais, deixando claro que é só um palpite.
- Nunca invente números que não estão nos dados. Se um valor vier como "—" ou faltar, diga com simpatia que esse sensor está sem leitura agora.
- Se a pergunta fugir totalmente do tema (clima, sensores, a estação, Ouro Preto), responda com bom humor e convide a pessoa a perguntar sobre o tempo.
- Mantenha tudo apropriado e seguro para crianças.`;

function cabecalhosCors(origin) {
  const permitida = ORIGENS_PERMITIDAS.includes(origin) ? origin : ORIGENS_PERMITIDAS[0];
  return {
    'Access-Control-Allow-Origin': permitida,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function json(obj, status, origin) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...cabecalhosCors(origin) },
  });
}

// Remove markdown (negrito/itálico/código/títulos) — o balão do chat mostra
// texto puro, então asteriscos e crases apareceriam literais.
function limparMarkdown(t) {
  return t
    .replace(/[*_`]/g, '')
    .replace(/^#+\s*/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    // Preflight do CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cabecalhosCors(origin) });
    }
    if (request.method !== 'POST') {
      return json({ erro: 'Método não permitido' }, 405, origin);
    }
    if (!env.NVIDIA_API_KEY) {
      return json({ erro: 'Chave da NVIDIA não configurada no Worker' }, 500, origin);
    }

    let corpo;
    try {
      corpo = await request.json();
    } catch {
      return json({ erro: 'JSON inválido' }, 400, origin);
    }

    const pergunta = String(corpo?.pergunta || '').slice(0, 500).trim();
    const contexto = String(corpo?.contexto || 'indisponível').slice(0, 800);
    if (!pergunta) return json({ erro: 'pergunta ausente' }, 400, origin);

    const usuario = `Dados atuais dos sensores: ${contexto}\n\nPergunta do visitante: ${pergunta}`;

    try {
      const resp = await fetch(NVIDIA_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.NVIDIA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODELO,
          messages: [
            { role: 'system', content: SISTEMA },
            { role: 'user', content: usuario },
          ],
          temperature: 0.6,
          max_tokens: 300,
        }),
      });

      if (!resp.ok) {
        const detalhe = (await resp.text()).slice(0, 200);
        return json({ erro: 'Falha na NVIDIA', status: resp.status, detalhe }, 502, origin);
      }

      const data = await resp.json();
      const resposta = limparMarkdown(data?.choices?.[0]?.message?.content?.trim() || '');
      if (!resposta) return json({ erro: 'Resposta vazia da NVIDIA' }, 502, origin);

      return json({ resposta }, 200, origin);
    } catch (e) {
      return json({ erro: 'Erro interno', detalhe: String(e).slice(0, 200) }, 500, origin);
    }
  },
};
