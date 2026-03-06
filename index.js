import crypto from "crypto";
import fastify from "fastify";
import pino from "pino";
import fs from "fs";

const server = fastify();
const logger = pino();

//state and code verifier
server.get("/auth", (request, reply) => {
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  const state = crypto.randomBytes(16).toString("base64url");

  const codes ={
    state: state,
    codeVerifier: codeVerifier
  }
  fs.writeFileSync('./codes.json', JSON.stringify(codes, null, 2))

  const url =
    `https://auth.mercadolivre.com.br/authorization?response_type=code` +
    `&client_id=${process.env.APP_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.URI)}` +
    `&code_challenge=${codeChallenge}` +
    `&code_challenge_method=S256` +
    `&state=${state}`;

  logger.info("Code verifier and state ok!");
  console.log("codes.json created.");
  reply.redirect(url);
});

//acess token and refresh code
server.get("/", async (request, reply) => {
  const {code, state} = request.query
  const codes = JSON.parse(fs.readFileSync('./codes.json', 'utf-8'))

  //validation state e codeverifier
  if (!codes) { 
    return reply.status(400).send({ error: "codeVerifier não encontrado" });
  }

  const response = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.APP_ID,
      client_secret: process.env.KEY,
      code,
      redirect_uri: process.env.URI,
      code_verifier: codes.codeVerifier,
    }),
  });

  fs.unlinkSync('./codes.json') 
  logger.info("Tokens created.")
  const data = await response.json();

  if (data.access_token) {
    logger.info("Token successfully generated!")
    const tokens ={
      token: data.access_token,
      refreshToken: data.refresh_token
    }
    fs.writeFileSync('./tokens.json', JSON.stringify(tokens, null, 2))
  } else {
    logger.error("Error generating token")
    logger.error(data) 
  }

  //const tokenObj = JSON.parse(fs.readFileSync('./tokens.json', 'utf-8'))
});

server.listen({ port: 3000, host: "0.0.0.0" });
