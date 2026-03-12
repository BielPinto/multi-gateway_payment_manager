import type { HttpContext } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import { JwtService } from 'App/Services/JwtService'

export default class AuthMiddleware {
  async handle(ctx: HttpContext, next: () => Promise<void>) {
    const authHeader = ctx.request.header('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ctx.response.unauthorized({ error: 'Missing or invalid authorization header' })
    }
    const token = authHeader.slice(7)
    try {
      const payload = await JwtService.verify(token)
      const user = await User.find(payload.sub)
      if (!user) {
        return ctx.response.unauthorized({ error: 'User not found' })
      }
      ctx.auth = { user }
      await next()
    } catch {
      return ctx.response.unauthorized({ error: 'Invalid or expired token' })
    }
  }
}
