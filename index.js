import fastify from 'fastify'

const pino = require('pino')
const logger = pino()
const server = fastify({ logger:true })

server.get('/', () => {
    return logger.info('Servidor rodando.')
})