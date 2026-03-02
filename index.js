import fastify from 'fastify'
import pino from 'pino'
import crypto from 'crypto'

const logger = pino()
const server = fastify({ logger: true })

// Guarda o verifier em memória (gerado uma vez)
let codeVerifier = ''

// Rota pra gerar a URL de autenticação
server.get('/auth', (req, res) => {
  codeVerifier = crypto.randomBytes(32).toString('base64url')
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url')

  const url = `https://auth.mercadolivre.com.br/authorization`
    + `?response_type=code`
    + `&client_id=${process.env.APP_ID}`
    + `&redirect_uri=${encodeURIComponent(process.env.URI)}`
    + `&code_challenge=${codeChallenge}`
    + `&code_challenge_method=S256`

  return { url }
})

// Rota de callback — ML redireciona aqui com o code
server.get('/', async (req, res) => {
  const { code } = req.query

  if (!code) return { error: 'Sem código' }

  const response = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.APP_ID,
      client_secret: process.env.KEY,
      code,
      redirect_uri: process.env.URI,
      code_verifier: codeVerifier,
    })
  })

  const data = await response.json()
  logger.info(data)
  return data
})

server.get('/test', () => {
  return { message: 'Servidor on.' }
})

server.listen({ port: 8000, host: '0.0.0.0' }, (err) => {
  if (err) {
    logger.error(err)
    process.exit(1)
  }
})