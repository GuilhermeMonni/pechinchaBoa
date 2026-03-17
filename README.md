# 🚀 Pechincha Boa

> Bot de ofertas no Telegram que gera anúncios a partir de links de afiliado do Mercado Livre.

O **Pechincha Boa** é um bot pessoal que facilita a criação de anúncios de ofertas a partir de links de afiliado recebidos no Telegram.  

---

## 🎯 Objetivo

- Transformar um **link de afiliado** enviado no Telegram em um **texto de anúncio pronto** (descrição, preço e link).
- Servir como prática de **automação, integração de serviços e uso de webhooks** com Node.js e Telegram.

---

## 📦 Funcionalidades

- Recebe links de afiliado do Mercado Livre (`meli.la/...`) enviados no Telegram.
- Reconhece o ID do produto dentro do link.
- Gera um texto de anúncio já formatado, incluindo:
  - descrição do produto,
  - preço,
  - link de afiliado.
- Devolve o texto na mesma conversa, pronto para ser compartilhado em grupos de WhatsApp ou Telegram.
- Usa **webhook** para conectar o bot Telegram ao servidor web (hosted na **Render**).

---

## ⚙️ Tecnologias utilizadas

- **Node.js** – runtime do servidor.
- **Telegraf** – framework para bots no Telegram.
- **Fastify** – servidor web.
- **Render** – hospedagem do servidor e webhook.
- **Autenticação via webhook** entre o Telegram e o servidor.

---

## 🚀 Como funciona (fluxo)

1. Você envia o link de afiliado no Telegram para o bot.
2. O bot processa a mensagem e reconhece o ID do produto dentro do link.
3. O bot monta um texto de anúncio formatado com dados já conhecidos (descrição, preço, link).
4. O bot responde com o texto pronto, que você pode copiar e enviar em grupos.

---

## 🖥️ Como rodar localmente

1. **Clone o repositório**

   ```bash
   git clone https://github.com/GuilhermeMonni/pechinchaBoa.git
   cd pechinchaBoa
  
2. **Instale as dependências**
Certifique-se de ter o Node.js instalado em seu sistema e depois execute:

   npm install

3. **Configure o arquivo .env**
Na raiz do projeto, crie um arquivo chamado `.env` com o seguinte conteúdo:

   TELEGRAM_TOKEN=123456789:AAHb123456789abcdef123456789
   WEBHOOK_URL=https://seu-tunnel.ngrok.io

•	`TELEGRAM_TOKEN`: token do seu bot, fornecido pelo `@BotFather` no Telegram.
•	`WEBHOOK_URL`: URL pública do seu servidor local (pode ser gerada usando ngrok ou outra ferramenta similar, por exemplo `https://seu-tunnel.ngrok.io`). Essa URL é usada para o Telegram enviar as atualizações (mensagens) para o seu bot em localhost.

4. **Inicie o servidor local**

   node index.js

Isso irá iniciar o servidor Fastify na sua máquina e expor o endpoint para receber atualizações do Telegram via webhook.

5. **Configure o webhook no telegram**
No seu navegador acesse: 

   http://localhost:3000/setWebhook

6. **Teste o bot no telegram**
Envie uma mensagem para o bot no formato:

   URL_PRINCIPAL , URL_AFILIADO

•	`URL_PRINCIPAL`: link direto do produto.
•	`URL_AFILIADO`: link de afiliado (pode ser o mesmo que `URL_PRINCIPAL` se você não for afiliado ou quiser apenas testar).

Caso o bot não responda, verifique:
•	se o servidor está de fato rodando (`node server.js`),
•	se a URL do webhook está correta e acessível,
•	se o token do Telegram está correto.

---

## 💡Sua contribuição é bem-vinda!

Se encontrar algum erro, desejar propor melhorias ou tiver ideias de novas funcionalidades, fique à vontade para abrir uma issue neste repositório.  
Sua participação ajuda a deixar o projeto mais robusto e útil para outras pessoas! 
