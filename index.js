import crypto from 'crypto'
import fastify from 'fastify';

const server = fastify()

let codeVerifier;

//gera a URL e redireciona
server.get('/auth', (req, res) => {
  codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

  const url = `https://auth.mercadolivre.com.br/authorization?response_type=code`
    + `&client_id=${process.env.APP_ID}`
    + `&redirect_uri=${encodeURIComponent(process.env.URI)}`
    + `&code_challenge=${codeChallenge}`
    + `&code_challenge_method=S256`;

  res.redirect(url);
});

// callback 
server.get('/', async (req, res) => {
  const { code } = req.query;

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
  res.json(data);
});