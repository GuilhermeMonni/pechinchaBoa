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

## 💡Sua contribuição é bem-vinda!

Se encontrar algum erro, desejar propor melhorias ou tiver ideias de novas funcionalidades, fique à vontade para abrir uma issue neste repositório.  
Sua participação ajuda a deixar o projeto mais robusto e útil para outras pessoas! 
