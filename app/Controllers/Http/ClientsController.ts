import HttpContext from '@ioc:Adonis/Core/HttpContext'
import Client from 'App/Models/Client'

export default class ClientsController {
  async index(ctx: InstanceType<typeof HttpContext>) {
    const clients = await (Client as any).query().orderBy('id', 'asc')
    return ctx.response.ok(
      clients.map((c: any) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        createdAt: c.createdAt,
      }))
    )
  }

  async show(ctx: InstanceType<typeof HttpContext>) {
    const client = await (Client as any).query().where('id', ctx.params.id).preload('transactions').first()
    if (!client) {
      return ctx.response.notFound({ error: 'Client not found' })
    }
    await client.load('transactions', (q: any) => q.preload('transactionProducts'))
    return ctx.response.ok({
      id: client.id,
      name: client.name,
      email: client.email,
      createdAt: client.createdAt,
      transactions: client.transactions.map((t: any) => ({
        id: t.id,
        status: t.status,
        amount: t.amount,
        cardLastNumbers: t.cardLastNumbers,
        createdAt: t.createdAt,
        items: t.transactionProducts?.map((tp: any) => ({ productId: tp.productId, quantity: tp.quantity })) ?? [],
      })),
    })
  }
}
