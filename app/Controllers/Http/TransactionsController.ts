import HttpContext from '@ioc:Adonis/Core/HttpContext'
import Transaction from 'App/Models/Transaction'

export default class TransactionsController {
  async index(ctx: InstanceType<typeof HttpContext>) {
    const transactions = await (Transaction as any).query()
      .preload('client')
      .preload('gateway')
      .preload('transactionProducts')
      .orderBy('createdAt', 'desc')
    return ctx.response.ok(
      transactions.map((t: any) => ({
        id: t.id,
        status: t.status,
        amount: t.amount,
        cardLastNumbers: t.cardLastNumbers,
        client: t.client ? { id: t.client.id, name: t.client.name, email: t.client.email } : null,
        gateway: t.gateway ? { id: t.gateway.id, name: t.gateway.name } : null,
        items: t.transactionProducts?.map((tp: any) => ({ productId: tp.productId, quantity: tp.quantity })) ?? [],
        createdAt: t.createdAt,
      }))
    )
  }

  async show(ctx: InstanceType<typeof HttpContext>) {
    const transaction = await (Transaction as any).query()
      .where('id', ctx.params.id)
      .preload('client')
      .preload('gateway')
      .preload('transactionProducts')
      .first()
    if (!transaction) {
      return ctx.response.notFound({ error: 'Transaction not found' })
    }
    return ctx.response.ok({
      id: transaction.id,
      status: transaction.status,
      amount: transaction.amount,
      cardLastNumbers: transaction.cardLastNumbers,
      externalId: transaction.externalId,
      client: transaction.client
        ? { id: transaction.client.id, name: transaction.client.name, email: transaction.client.email }
        : null,
      gateway: transaction.gateway
        ? { id: transaction.gateway.id, name: transaction.gateway.name, type: transaction.gateway.type }
        : null,
      items: transaction.transactionProducts?.map((tp: any) => ({ productId: tp.productId, quantity: tp.quantity })) ?? [],
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    })
  }
}
