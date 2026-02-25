import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyCors from '@fastify/cors'
import { createLogger } from '@fintech/logger'
import { authRoutes } from './routes/auth.routes'
import { PrismaClient } from '@prisma/client'

const logger = createLogger('auth-service')
const prisma = new PrismaClient()

const app = Fastify({ logger: false })

app.register(fastifyCors, { origin: true })
app.register(fastifyJwt, { secret: process.env.JWT_SECRET ?? 'change-me-in-production' })
app.register(authRoutes, { prefix: '/auth', prisma })

app.get('/health', async () => ({ status: 'ok', service: 'auth-service' }))

const start = async () => {
    try {
        await app.listen({ port: Number(process.env.PORT ?? 3001), host: '0.0.0.0' })
        logger.info('Auth service running on port 3001')
    } catch (err) {
        logger.error(err)
        process.exit(1)
    }
}

start()