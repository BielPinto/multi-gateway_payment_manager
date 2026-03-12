import HttpContext from '@ioc:Adonis/Core/HttpContext'
import Product from 'App/Models/Product'
import { createProductValidator, updateProductValidator } from 'App/Validators/ProductValidator'

export default class ProductsController {
  async index(ctx: InstanceType<typeof HttpContext>) {
    const products = await (Product as any).all()
    return ctx.response.ok(products.map((p: any) => ({ id: p.id, name: p.name, amount: p.amount, createdAt: p.createdAt })))
  }

  async store(ctx: InstanceType<typeof HttpContext>) {
    const body = await createProductValidator.validate(ctx.request.body())
    const product = await (Product as any).create({ name: body.name, amount: body.amount })
    return ctx.response.created({ id: product.id, name: product.name, amount: product.amount, createdAt: product.createdAt })
  }

  async show(ctx: InstanceType<typeof HttpContext>) {
    const product = await (Product as any).find(ctx.params.id)
    if (!product) {
      return ctx.response.notFound({ error: 'Product not found' })
    }
    return ctx.response.ok({ id: product.id, name: product.name, amount: product.amount, createdAt: product.createdAt, updatedAt: product.updatedAt })
  }

  async update(ctx: InstanceType<typeof HttpContext>) {
    const product = await (Product as any).find(ctx.params.id)
    if (!product) {
      return ctx.response.notFound({ error: 'Product not found' })
    }
    const body = await updateProductValidator.validate(ctx.request.body())
    if (body.name !== undefined) product.name = body.name
    if (body.amount !== undefined) product.amount = body.amount
    await product.save()
    return ctx.response.ok({ id: product.id, name: product.name, amount: product.amount, updatedAt: product.updatedAt })
  }

  async destroy(ctx: InstanceType<typeof HttpContext>) {
    const product = await (Product as any).find(ctx.params.id)
    if (!product) {
      return ctx.response.notFound({ error: 'Product not found' })
    }
    await product.delete()
    return ctx.response.noContent()
  }
}
