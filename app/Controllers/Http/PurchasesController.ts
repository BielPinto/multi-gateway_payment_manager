import HttpContext from '@ioc:Adonis/Core/HttpContext'
import { PurchaseService } from 'App/Services/PurchaseService'
import { purchaseValidator } from 'App/Validators/PurchaseValidator'

const purchaseService = new PurchaseService()

export default class PurchasesController {
  async store(ctx: InstanceType<typeof HttpContext>) {
    const body = await purchaseValidator.validate(ctx.request.body())
    try {
      const transaction = await purchaseService.execute({
        clientName: body.clientName,
        clientEmail: body.clientEmail,
        items: body.items,
        cardNumber: body.cardNumber,
        cvv: body.cvv,
        idempotencyKey: body.idempotencyKey,
      })
      await (transaction as any).load('transactionProducts')
      await (transaction as any).load('client')
      return ctx.response.created({
        id: transaction.id,
        status: transaction.status,
        amount: transaction.amount,
        cardLastNumbers: transaction.cardLastNumbers,
        client: transaction.client ? { id: transaction.client.id, name: transaction.client.name, email: transaction.client.email } : null,
        items: transaction.transactionProducts?.map((tp: any) => ({ productId: tp.productId, quantity: tp.quantity })) ?? [],
        createdAt: transaction.createdAt,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Purchase failed'
      if (message.includes('Invalid product')) {
        return ctx.response.badRequest({ error: message })
      }
      return ctx.response.status(402).json({ error: message }) // 402 Payment Required
    }
  }
}
