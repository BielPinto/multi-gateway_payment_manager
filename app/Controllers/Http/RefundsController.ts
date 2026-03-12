import type { HttpContext } from '@ioc:Adonis/Core/HttpContext'
import { RefundService } from 'App/Services/RefundService'

const refundService = new RefundService()

export default class RefundsController {
  async store(ctx: HttpContext) {
    const transactionId = Number(ctx.params.id)
    if (!Number.isInteger(transactionId) || transactionId < 1) {
      return ctx.response.badRequest({ error: 'Invalid transaction id' })
    }
    try {
      const transaction = await refundService.execute(transactionId)
      await transaction.load('client')
      await transaction.load('transactionProducts')
      return ctx.response.ok({
        id: transaction.id,
        status: transaction.status,
        amount: transaction.amount,
        client: transaction.client ? { id: transaction.client.id, name: transaction.client.name, email: transaction.client.email } : null,
        items: transaction.transactionProducts?.map((tp) => ({ productId: tp.productId, quantity: tp.quantity })) ?? [],
        updatedAt: transaction.updatedAt,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Refund failed'
      if (message.includes('not found')) {
        return ctx.response.notFound({ error: message })
      }
      if (message.includes('not paid') || message.includes('already refunded') || message.includes('no gateway')) {
        return ctx.response.badRequest({ error: message })
      }
      return ctx.response.status(502).json({ error: message })
    }
  }
}
