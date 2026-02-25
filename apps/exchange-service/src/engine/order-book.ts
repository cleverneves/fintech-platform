import { v4 as uuid } from 'uuid'

export type OrderSide = 'BUY' | 'SELL'
export type OrderStatus = 'OPEN' | 'FILLED' | 'PARTIAL' | 'CANCELLED'

export interface Order {
    id: string
    userId: string
    pair: string       // BTC-BRL, ETH-BRL
    side: OrderSide
    price: number      // limit price
    quantity: number
    filled: number
    status: OrderStatus
    createdAt: Date
}

export interface Trade {
    id: string
    pair: string
    buyOrderId: string
    sellOrderId: string
    price: number
    quantity: number
    executedAt: Date
}

export class OrderBook {
    private bids: Order[] = []  // BUY orders - sorted DESC by price
    private asks: Order[] = []  // SELL orders - sorted ASC by price
    private trades: Trade[] = []

    addOrder(params: Omit<Order, 'id' | 'filled' | 'status' | 'createdAt'>): { order: Order; trades: Trade[] } {
        const order: Order = {
            ...params,
            id: uuid(),
            filled: 0,
            status: 'OPEN',
            createdAt: new Date(),
        }

        const newTrades: Trade[] = []
        this.match(order, newTrades)

        if (order.status !== 'FILLED') {
            if (order.side === 'BUY') {
                this.bids.push(order)
                this.bids.sort((a, b) => b.price - a.price)
            } else {
                this.asks.push(order)
                this.asks.sort((a, b) => a.price - b.price)
            }
        }

        return { order, trades: newTrades }
    }

    private match(incoming: Order, trades: Trade[]) {
        const opposites = incoming.side === 'BUY' ? this.asks : this.bids
        const canMatch = (o: Order) =>
            incoming.side === 'BUY' ? o.price <= incoming.price : o.price >= incoming.price

        for (const resting of [...opposites]) {
            if (incoming.status === 'FILLED') break
            if (!canMatch(resting)) break

            const qty = Math.min(incoming.quantity - incoming.filled, resting.quantity - resting.filled)
            const price = resting.price // maker price

            const trade: Trade = {
                id: uuid(),
                pair: incoming.pair,
                buyOrderId: incoming.side === 'BUY' ? incoming.id : resting.id,
                sellOrderId: incoming.side === 'SELL' ? incoming.id : resting.id,
                price,
                quantity: qty,
                executedAt: new Date(),
            }
            trades.push(trade)
            this.trades.push(trade)

            incoming.filled += qty
            resting.filled += qty

            incoming.status = incoming.filled >= incoming.quantity ? 'FILLED' : 'PARTIAL'
            resting.status = resting.filled >= resting.quantity ? 'FILLED' : 'PARTIAL'

            if (resting.status === 'FILLED') {
                const idx = opposites.indexOf(resting)
                if (idx !== -1) opposites.splice(idx, 1)
            }
        }
    }

    getOrderBook(pair: string) {
        return {
            bids: this.bids.filter(o => o.pair === pair && o.status !== 'FILLED').slice(0, 20),
            asks: this.asks.filter(o => o.pair === pair && o.status !== 'FILLED').slice(0, 20),
        }
    }

    getRecentTrades(pair: string, limit = 50) {
        return this.trades.filter(t => t.pair === pair).slice(-limit).reverse()
    }
}