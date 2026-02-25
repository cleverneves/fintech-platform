import { Kafka, Producer, Consumer, KafkaConfig } from 'kafkajs'
import { BaseEvent } from '@fintech/shared-types'
import { v4 as uuid } from 'uuid'

export class KafkaClient {
    private kafka: Kafka
    private producer: Producer | null = null

    constructor(config: KafkaConfig) {
        this.kafka = new Kafka(config)
    }

    async getProducer(): Promise<Producer> {
        if (!this.producer) {
            this.producer = this.kafka.producer()
            await this.producer.connect()
        }
        return this.producer
    }

    async publish<T>(topic: string, event: Omit<BaseEvent<T>, 'eventId' | 'timestamp'>): Promise<void> {
        const producer = await this.getProducer()
        const fullEvent: BaseEvent<T> = {
            ...event,
            eventId: uuid(),
            timestamp: new Date().toISOString(),
        }
        await producer.send({
            topic,
            messages: [{ key: fullEvent.aggregateId, value: JSON.stringify(fullEvent) }],
        })
    }

    createConsumer(groupId: string): Consumer {
        return this.kafka.consumer({ groupId })
    }

    async disconnect(): Promise<void> {
        await this.producer?.disconnect()
    }
}