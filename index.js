import crypto from 'crypto'
import fastify from 'fastify'

const server = fastify()
const verifiers = new Map()

server.get('/auth', (request, reply) => {
  const codeVerifier = crypto.randomBytes(32).toString('base64url')
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url')
  const state = crypto.randomBytes(16).toString('base64url')

  verifiers.set(state, codeVerifier)
  console.log('Verifiers map:', [...verifiers.entries()]) // ← debug

  const url = `https://auth.mercadolivre.com.br/authorization?response_type=code`
    + `&client_id=${process.env.APP_ID}`
    + `&redirect_uri=${encodeURIComponent(process.env.URI)}`
    + `&code_challenge=${codeChallenge}`
    + `&code_challenge_method=S256`
    + `&state=${state}`

  reply.redirect(url)
})

server.get('/', async (request, reply) => {
  const { code, state } = request.query
  console.log('State recebido:', state)
  console.log('Verifiers disponíveis:', [...verifiers.keys()])

  const codeVerifier = verifiers.get(state)

  if (!codeVerifier) {
    return reply.status(400).send({ error: 'codeVerifier não encontrado — servidor reiniciou?' })
  }

  verifiers.delete(state)

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
  })

  const data = await response.json()
  reply.send(data)
})

server.listen({ port: process.env.PORT || 8000, host: '0.0.0.0' })