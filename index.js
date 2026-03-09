import 'dotenv/config'
import crypto from "crypto";
import fastify from "fastify";
import pino from "pino";
import fs from "fs";
import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';

const server = fastify();
const logger = pino();
const FIVE_HOURS = 5 * 60 * 60 * 1000

const tokenBot = process.env.TOKEN_BOT 
const bot = new Telegraf(tokenBot) //bot telegram

server.get("/test", (request, reply) => {
  reply.send("Server online!")
});

//state and code verifier meli
server.get("/auth", (request, reply) => {
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  const state = crypto.randomBytes(16).toString("base64url");

  const codes = {
    state: state,
    codeVerifier: codeVerifier,
  };
  fs.writeFileSync("./codes.json", JSON.stringify(codes, null, 2));

  const url =
    `https://auth.mercadolivre.com.br/authorization?response_type=code` +
    `&client_id=${process.env.APP_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.URI)}` +
    `&code_challenge=${codeChallenge}` +
    `&code_challenge_method=S256` +
    `&state=${state}`;

  reply.redirect(url);
  logger.info("Code verifier and state ok!");
  console.log("codes.json created.");
});

//acess token meli and refresh code
server.get("/", async (request, reply) => {
  const { code, state } = request.query;

  //validation state e codeverifier
  if (!fs.existsSync('./codes.json')) {
    return reply.status(400).send({ error: "codeVerifier não encontrado" });
  }
  
  const codesJSON = JSON.parse(fs.readFileSync("./codes.json", "utf-8"));

  const response = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: { 
      "accept": "application/json",
      "Content-Type": "application/x-www-form-urlencoded" 
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.APP_ID,
      client_secret: process.env.KEY,
      code,
      redirect_uri: process.env.URI,
      code_verifier: codesJSON.codeVerifier,
    }),
  });

  fs.unlinkSync("./codes.json");
  const data = await response.json();

  const tokens = {
    token: data.access_token,
    refreshToken: data.refresh_token,
  };
  fs.writeFileSync("./tokens.json", JSON.stringify(tokens, null, 2));

  if (!data.access_token) {
    logger.error("Error generating token");
    return console.error(data);
  }

  logger.info("Token successfully generated!");
  reply.send({ message: "Token successfully generated!" })
});

//get product meli
async function getProduct(itemId) {
  const url = `https://api.mercadolibre.com/items/${itemId}`;
  const { token } = JSON.parse(fs.readFileSync("./tokens.json", "utf-8"))

  try {
    const resp = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return await resp.json();
  } catch (error) {
    console.error("Erro ao buscar ML:", error);
    return null;
  }
}

//bot read and return message
bot.on(message("text"), async (ctx) => {
  const text = ctx.message.text.trim();
  const chatId = ctx.chat.id;

  //validation meli
  if (!text.includes("meli.la")) return;

  //get id 
  const itemMatches = text.match(/MLB\d{9}/);
  const itemId = itemMatches ? itemMatches[0] : null;
  if (!itemId) {
    return ctx.reply("Não consegui identificar o ID do produto.");
  }

  //search product
  const product = await getProduct(itemId);
  if (!product) {
    return ctx.reply("Não consegui buscar o produto no Mercado Livre.");
  }

  //discount verify
  const hasDiscount = product.original_price && product.original_price > product.price

  //text announcement
  const msg = `
🚀 <b>${product.title}</b>

  ${hasDiscount 
    ? `💰 De <s>R$ ${product.original_price.toLocaleString("pt-BR")}</s> por apenas <b>R$ ${product.price.toLocaleString("pt-BR")}</b>` 
    : `💰 <b>R$ ${product.price.toLocaleString("pt-BR")}</b>`
  }

  🔗 ${product.permalink}?matt_tool=${process.env.ID_MELI}`
  
  ctx.reply(msg, { parse_mode: "HTML" });
});

//route for bot on
server.post('/telegram-webhook', async (request, reply) => {
  await bot.handleUpdate(request.body)
  reply.send ({ ok: true })
})

//config webhook
server.get('/setWebhook', async (request, reply) => {
  const webhookUrl = `${process.env.URI}/telegram-webhook`
  await bot.telegram.setWebhook(webhookUrl)
  return reply.status(200).send('Webhook configured!')
})

server.listen({ port: 3000, host: "0.0.0.0" });

//refresh token
setInterval(async () => {
  if (!fs.existsSync("./tokens.json")) return

  const tokens = JSON.parse(fs.readFileSync("./tokens.json", "utf-8"))

  const response = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.APP_ID,
      client_secret: process.env.KEY,
      refresh_token: tokens.refreshToken,
    }),
  })

  const data = await response.json()

  const updatedTokens = {
    token: data.access_token,
    refreshToken: data.refresh_token || tokens.refreshToken,
  }

  fs.writeFileSync("./tokens.json", JSON.stringify(updatedTokens, null, 2))
  logger.info("Token atualizado automaticamente!")

}, FIVE_HOURS)
