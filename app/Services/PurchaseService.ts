import Client from 'App/Models/Client'
import Product from 'App/Models/Product'
import Transaction from 'App/Models/Transaction'
import TransactionProduct from 'App/Models/TransactionProduct'
import { GatewaySelectorService } from './Gateways/GatewaySelectorService'
import { computeAmountFromItems, type PurchaseItem } from './PurchaseAmount'

export type { PurchaseItem, ProductForAmount } from './PurchaseAmount'
export { computeAmountFromItems } from './PurchaseAmount'

const IDEMPOTENCY_WINDOW_MINUTES = 5
const STATUS_PENDING = 'PENDING'
const STATUS_PAID = 'PAID'
const STATUS_FAILED = 'FAILED'

export interface PurchaseInput {
  clientName: string
  clientEmail: string
  items: PurchaseItem[]
  cardNumber: string
  cvv: string
  idempotencyKey?: string
}

export class PurchaseService {
  private selector = new GatewaySelectorService()

  async execute(input: PurchaseInput): Promise<Transaction> {
    const { clientName, clientEmail, items, cardNumber, cvv, idempotencyKey } = input

    const products = await (Product as any).query().whereIn('id', items.map((i) => i.productId))
    if (products.length !== items.length) {
      throw new Error('Invalid product id(s)')
    }

    const amount = computeAmountFromItems(
      items,
      products.map((p: any) => ({ id: p.id, amount: p.amount }))
    )

    let client = await (Client as any).findBy('email', clientEmail)
    if (!client) {
      client = await (Client as any).create({ name: clientName, email: clientEmail })
    }

    if (idempotencyKey) {
      const windowStart = new Date(Date.now() - IDEMPOTENCY_WINDOW_MINUTES * 60 * 1000)
      const existing = await (Transaction as any).query()
        .where('client_id', client.id)
        .where('idempotency_key', idempotencyKey)
        .where('created_at', '>=', windowStart)
        .first()
      if (existing) {
        await (existing as any).load('transactionProducts')
        return existing
      }
    }

    const cardLastNumbers = cardNumber.slice(-4)

    const trx = await (Transaction as any).create({
      clientId: client.id,
      gatewayId: null,
      externalId: null,
      status: STATUS_PENDING,
      amount,
      cardLastNumbers,
      idempotencyKey: idempotencyKey || null,
    })

    for (const item of items) {
      await (TransactionProduct as any).create({
        transactionId: trx.id,
        productId: item.productId,
        quantity: item.quantity,
      })
    }

    try {
      const result = await this.selector.charge({
        amount,
        name: clientName,
        email: clientEmail,
        cardNumber,
        cvv,
      })
      trx.gatewayId = result.gatewayId
      trx.externalId = result.externalId
      trx.status = STATUS_PAID
      await trx.save()
      await (trx as any).load('transactionProducts')
      return trx
    } catch (err) {
      trx.status = STATUS_FAILED
      await trx.save()
      throw err
    }
  }
}
