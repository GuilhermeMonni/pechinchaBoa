import fastify from 'fastify'
import pino from 'pino'

const logger = pino()
const server = fastify({ logger:true })

server.get('/', () => {
    return logger.info('Servidor rodando.')
})