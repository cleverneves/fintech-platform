import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { KafkaClient } from '@fintech/kafka-client'
import { KAFKA_TOPICS } from '@fintech/shared-types'

const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    tenantSlug: z.string().min(3),
    tenantName: z.string().min(2),
})

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
})

const kafka = new KafkaClient({ clientId: 'auth-service', brokers: [process.env.KAFKA_BROKERS ?? 'localhost:9092'] })

export async function authRoutes(app: FastifyInstance, { prisma }: { prisma: PrismaClient }) {
    app.post('/register', async (request, reply) => {
        const body = RegisterSchema.parse(request.body)

        const existing = await prisma.user.findUnique({ where: { email: body.email } })
        if (existing) return reply.status(409).send({ error: 'Email already in use' })

        let tenant = await prisma.tenant.findUnique({ where: { slug: body.tenantSlug } })
        if (!tenant) {
            tenant = await prisma.tenant.create({
                data: { name: body.tenantName, slug: body.tenantSlug },
            })
        }

        const passwordHash = await bcrypt.hash(body.password, 12)
        const user = await prisma.user.create({
            data: { email: body.email, passwordHash, tenantId: tenant.id },
        })

        await kafka.publish(KAFKA_TOPICS.USER_EVENTS, {
            eventType: 'USER_CREATED',
            aggregateId: user.id,
            version: 1,
            payload: { userId: user.id, email: user.email, tenantId: tenant.id },
        })

        return reply.status(201).send({ userId: user.id, tenantId: tenant.id })
    })

    app.post('/login', async (request, reply) => {
        const body = LoginSchema.parse(request.body)

        const user = await prisma.user.findUnique({
            where: { email: body.email },
            include: { tenant: true },
        })

        if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
            return reply.status(401).send({ error: 'Invalid credentials' })
        }

        const token = app.jwt.sign({
            sub: user.id,
            email: user.email,
            tenantId: user.tenantId,
            role: user.role,
        }, { expiresIn: '24h' })

        return { token, userId: user.id, tenantId: user.tenantId }
    })
}