// ============================================================
// Meteorinho Proxy — Cloudflare Worker
// Faz a ponte entre o site (público) e a API da NVIDIA, mantendo
// a chave EM SEGREDO. O site NUNCA vê a chave: ela fica guardada
// como "secret" do Worker (env.NVIDIA_API_KEY).
//
// Deploy e segredo: veja o README.md desta pasta.
// ============================================================

// Modelo da NVIDIA (troque aqui se quiser outro).
// Rápido e barato: 'meta/llama-3.1-8b-instruct'
// Mais capaz:      'meta/llama-3.3-70b-instruct'
const MODELO = 'meta/llama-3.3-70b-instruct';

// Endpoint compatível com OpenAI da NVIDIA
const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

// Domínios autorizados a chamar este proxy (evita uso por terceiros).
const ORIGENS_PERMITIDAS = [
  'https://estacao-meteorologica-479ce.web.app',
  'https://estacao-meteorologica-479ce.firebaseapp.com',
  'http://localhost:5173',
  'http://localhost:4173',
];

// Persona do Meteorinho (fica no servidor, fácil de ajustar sem
// rebuildar o site).
const SISTEMA = `Você é o Meteorinho, uma nuvem simpática e divertida, mascote da estação meteorológica IoT construída por estudantes de Engenharia de Controle e Automação da UFOP (Ouro Preto, MG, altitude 1.179 m).

Regras:
- Responda em português do Brasil, em até 4 frases curtas.
- Tom divertido e didático, acessível para crianças e adultos.
- Use os dados reais dos sensores quando fizer sentido.
- A velocidade do vento é uma MÉDIA de 2 minutos (norma OMM); a rajada é o pico de 3 s.
- A estação funciona a energia solar e "dorme" entre medições, por isso os dados chegam a cada ~5 min.
- Use no máximo 2 emojis.
- Nunca invente previsões precisas; você observa o presente.`;

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
      const resposta = data?.choices?.[0]?.message?.content?.trim() || '';
      if (!resposta) return json({ erro: 'Resposta vazia da NVIDIA' }, 502, origin);

      return json({ resposta }, 200, origin);
    } catch (e) {
      return json({ erro: 'Erro interno', detalhe: String(e).slice(0, 200) }, 500, origin);
    }
  },
};
