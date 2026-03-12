import type { HttpContext } from '@ioc:Adonis/Core/HttpContext'

export type Role = 'ADMIN' | 'MANAGER' | 'FINANCE' | 'USER'

/**
 * Allowed roles per route. ADMIN can do everything.
 * MANAGER: products, users
 * FINANCE: products, refund
 * USER: clients, transactions (list/detail), gateways (read/activate/priority)
 */
export default class RoleMiddleware {
  async handle(ctx: HttpContext, next: () => Promise<void>, allowedRolesParam?: string) {
    if (!ctx.auth?.user) {
      return ctx.response.unauthorized({ error: 'Authentication required' })
    }
    const allowedRoles: Role[] = allowedRolesParam
      ? (allowedRolesParam.split(',').map((r) => r.trim()) as Role[])
      : []
    const role = ctx.auth.user.role as Role
    if (role === 'ADMIN' || allowedRoles.includes(role)) {
      await next()
      return
    }
    return ctx.response.forbidden({ error: 'Insufficient permissions' })
  }
}
