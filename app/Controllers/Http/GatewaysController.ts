import type { HttpContext } from '@ioc:Adonis/Core/HttpContext'
import Gateway from 'App/Models/Gateway'
import { gatewayPriorityValidator, gatewayActiveValidator } from 'App/Validators/GatewayValidator'

export default class GatewaysController {
  async index(ctx: HttpContext) {
    const gateways = await Gateway.query().orderBy('priority', 'asc')
    return ctx.response.ok(
      gateways.map((g) => ({
        id: g.id,
        name: g.name,
        isActive: g.isActive,
        priority: g.priority,
        type: g.type,
        baseUrl: g.baseUrl,
      }))
    )
  }

  async show(ctx: HttpContext) {
    const gateway = await Gateway.find(ctx.params.id)
    if (!gateway) {
      return ctx.response.notFound({ error: 'Gateway not found' })
    }
    return ctx.response.ok({
      id: gateway.id,
      name: gateway.name,
      isActive: gateway.isActive,
      priority: gateway.priority,
      type: gateway.type,
      baseUrl: gateway.baseUrl,
    })
  }

  async updatePriority(ctx: HttpContext) {
    const gateway = await Gateway.find(ctx.params.id)
    if (!gateway) {
      return ctx.response.notFound({ error: 'Gateway not found' })
    }
    const body = await gatewayPriorityValidator.validate(ctx.request.body())
    gateway.priority = body.priority
    await gateway.save()
    return ctx.response.ok({
      id: gateway.id,
      name: gateway.name,
      isActive: gateway.isActive,
      priority: gateway.priority,
      type: gateway.type,
    })
  }

  async activate(ctx: HttpContext) {
    const gateway = await Gateway.find(ctx.params.id)
    if (!gateway) {
      return ctx.response.notFound({ error: 'Gateway not found' })
    }
    gateway.isActive = true
    await gateway.save()
    return ctx.response.ok({
      id: gateway.id,
      name: gateway.name,
      isActive: gateway.isActive,
      priority: gateway.priority,
    })
  }

  async deactivate(ctx: HttpContext) {
    const gateway = await Gateway.find(ctx.params.id)
    if (!gateway) {
      return ctx.response.notFound({ error: 'Gateway not found' })
    }
    gateway.isActive = false
    await gateway.save()
    return ctx.response.ok({
      id: gateway.id,
      name: gateway.name,
      isActive: gateway.isActive,
      priority: gateway.priority,
    })
  }
}
