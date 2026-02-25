export interface BaseEvent<T = unknown> {
    eventId: string
    eventType: string
    aggregateId: string
    timestamp: string
    version: number
    payload: T
}

export interface UserCreatedEvent extends BaseEvent<{
    userId: string
    email: string
    tenantId: string
}> {
    eventType: 'USER_CREATED'
}

export interface TransactionCreatedEvent extends BaseEvent<{
    transactionId: string
    accountId: string
    amount: string
    currency: string
    type: 'DEBIT' | 'CREDIT'
}> {
    eventType: 'TRANSACTION_CREATED'
}

export interface WalletUpdatedEvent extends BaseEvent<{
    walletId: string
    asset: string
    balance: string
}> {
    eventType: 'WALLET_UPDATED'
}

export type DomainEvent =
    | UserCreatedEvent
    | TransactionCreatedEvent
    | WalletUpdatedEvent

export const KAFKA_TOPICS = {
    USER_EVENTS: 'user.events',
    TRANSACTION_EVENTS: 'transaction.events',
    WALLET_EVENTS: 'wallet.events',
    EXCHANGE_EVENTS: 'exchange.events',
    AUDIT_EVENTS: 'audit.events',
} as const