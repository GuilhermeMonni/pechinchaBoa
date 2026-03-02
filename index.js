import crypto from 'crypto'
import fastify from 'fastify'
import pino from 'pino' 

const server = fastify()
const logger = pino()

let codeVerifier

server.get('/auth', (request, reply) => {
  codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')

  const url = `https://auth.mercadolivre.com.br/authorization?response_type=code`
    + `&client_id=${process.env.APP_ID}`
    + `&redirect_uri=${encodeURIComponent(process.env.URI)}`
    + `&code_challenge=${codeChallenge}`
    + `&code_challenge_method=S256`;

  reply.redirect(url);
});

server.get('/', async (request, reply) => {
  const { code } = request.query;

  const response = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.APP_ID,
      client_secret: process.env.KEY,
      code,
      redirect_uri: process.env.URI,
      code_verifier: codeVerifier
    })
  });

  const data = await response.json();
  reply.send(data);
})

server.get('/test', (request, reply) => {
    reply.message('Server online.')
    return logger.info('Server online!')
})

server.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' });