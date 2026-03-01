import fastify from 'fastify'
import pino from 'pino'

const logger = pino()
const server = fastify({ logger:true })

server.get('/test', () => {
    logger.info('Servidor rodando.')
    return { message: "Servidor on." }
})

server.listen({ port: 8000, host: '0.0.0.0' }, (err) => {
    if (err) {
        logger.error(err)
        process.exit(1)
    }
})