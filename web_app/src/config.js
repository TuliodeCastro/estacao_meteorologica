// ============================================================
// Configurações do site que NÃO são segredo
// ============================================================

// URL do proxy do Meteorinho (Cloudflare Worker que fala com a NVIDIA).
// Preencha DEPOIS de publicar o Worker (veja meteorinho_proxy/README.md), ex.:
//   'https://meteorinho-proxy.SEU-SUBDOMINIO.workers.dev'
// Deixe vazio ('') para o Meteorinho usar só o "cérebro local" (respostas
// prontas, sem IA). O site nunca fica sem resposta de qualquer forma.
export const URL_METEORINHO = 'https://meteorinho-proxy.estacao-ufop.workers.dev';
