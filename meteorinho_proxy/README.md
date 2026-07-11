# 🌩️ Meteorinho Proxy (Cloudflare Worker)

Backend minúsculo e **gratuito** que faz a ponte entre o site da estação
(público) e a **API da NVIDIA**, mantendo a chave de API **em segredo**.

Por que existe: o site é estático e público. Se a chave da NVIDIA ficasse no
código do site, qualquer visitante poderia lê-la (na aba "Rede" do navegador) e
usá-la. Além disso, a API da NVIDIA bloqueia chamadas diretas do navegador
(CORS). Este Worker resolve os dois problemas: a chave fica guardada nele, e o
site conversa só com o Worker.

```
Site (Meteorinho)  →  Cloudflare Worker  →  API da NVIDIA
     (público)         (chave em segredo)     (integrate.api.nvidia.com)
```

## Pré-requisitos
- Uma conta **Cloudflare** (grátis): https://dash.cloudflare.com/sign-up
- **Node.js** instalado (já usado no site)
- Sua **chave da NVIDIA** (começa com `nvapi-...`), obtida em
  https://build.nvidia.com/ → em qualquer modelo, botão **Get API Key**

## Como publicar (uma vez)

Dentro desta pasta (`meteorinho_proxy/`):

```bash
# 1) Fazer login na Cloudflare (abre o navegador)
npx wrangler login

# 2) Guardar a chave da NVIDIA como SEGREDO (ela NÃO vai para o repositório!)
npx wrangler secret put NVIDIA_API_KEY
#    → cole a chave nvapi-... quando pedir e tecle Enter

# 3) Publicar o Worker
npx wrangler deploy
```

No fim, o comando mostra a URL pública do Worker, algo como:

```
https://meteorinho-proxy.SEU-SUBDOMINIO.workers.dev
```

## Conectar ao site
Copie essa URL e cole em [`web_app/src/config.js`](../web_app/src/config.js):

```js
export const URL_METEORINHO = 'https://meteorinho-proxy.SEU-SUBDOMINIO.workers.dev';
```

Depois rebuilde e publique o site (`npm run build` + `firebase deploy` na
pasta `web_app/`). Pronto — o Meteorinho passa a responder com a NVIDIA. Se o
Worker estiver fora do ar ou a `URL_METEORINHO` estiver vazia, o site usa
automaticamente o "cérebro local" (respostas prontas), então o totem nunca fica
sem resposta.

## Ajustes
- **Modelo**: edite a constante `MODELO` no [`worker.js`](worker.js).
- **Domínios autorizados**: a lista `ORIGENS_PERMITIDAS` no `worker.js` controla
  quais sites podem usar o proxy. Adicione o domínio final do totem se mudar.
- **Trocar a chave**: rode de novo `npx wrangler secret put NVIDIA_API_KEY`.

> ⚠️ A chave da NVIDIA **nunca** deve ser commitada. Ela vive só como *secret*
> do Worker — do mesmo jeito que o `credentials.h` do firmware fica fora do
> repositório.
