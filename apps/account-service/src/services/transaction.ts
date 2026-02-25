import { PrismaClient, TransactionType } from '@prisma/client'
import { KafkaClient } from '@fintech/kafka-client'
import { KAFKA_TOPICS } from '@fintech/shared-types'

export class TransactionService {
    constructor(
        private prisma: PrismaClient,
        private kafka: KafkaClient,
    ) { }

    async credit(params: {
        accountId: string
        amount: number
        description?: string
        idempotencyKey?: string
    }) {
        if (params.idempotencyKey) {
            const existing = await this.prisma.transaction.findUnique({
                where: { idempotencyKey: params.idempotencyKey },
            })
            if (existing) return existing
        }

        const result = await this.prisma.$transaction(async (tx) => {
            const account = await tx.account.findUniqueOrThrow({
                where: { id: params.accountId },
            })

            const transaction = await tx.transaction.create({
                data: {
                    accountId: params.accountId,
                    amount: params.amount,
                    type: TransactionType.CREDIT,
                    status: 'COMPLETED',
                    description: params.description,
                    idempotencyKey: params.idempotencyKey,
                    processedAt: new Date(),
                },
            })

            await tx.account.update({
                where: { id: params.accountId },
                data: { balance: { increment: params.amount } },
            })

            return transaction
        })

        await this.kafka.publish(KAFKA_TOPICS.TRANSACTION_EVENTS, {
            eventType: 'TRANSACTION_CREATED',
            aggregateId: result.id,
            version: 1,
            payload: {
                transactionId: result.id,
                accountId: params.accountId,
                amount: String(params.amount),
                currency: 'BRL',
                type: 'CREDIT',
            },
        })

        return result
    }

    async debit(params: {
        accountId: string
        amount: number
        description?: string
        idempotencyKey?: string
    }) {
        const result = await this.prisma.$transaction(async (tx) => {
            const account = await tx.account.findUniqueOrThrow({
                where: { id: params.accountId },
            })

            if (Number(account.balance) < params.amount) {
                throw new Error('Insufficient funds')
            }

            const transaction = await tx.transaction.create({
                data: {
                    accountId: params.accountId,
                    amount: params.amount,
                    type: TransactionType.DEBIT,
                    status: 'COMPLETED',
                    description: params.description,
                    idempotencyKey: params.idempotencyKey,
                    processedAt: new Date(),
                },
            })

            await tx.account.update({
                where: { id: params.accountId },
                data: { balance: { decrement: params.amount } },
            })

            return transaction
        })

        await this.kafka.publish(KAFKA_TOPICS.TRANSACTION_EVENTS, {
            eventType: 'TRANSACTION_CREATED',
            aggregateId: result.id,
            version: 1,
            payload: {
                transactionId: result.id,
                accountId: params.accountId,
                amount: String(params.amount),
                currency: 'BRL',
                type: 'DEBIT',
            },
        })

        return result
    }
}