import type { HttpContext } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import { createUserValidator, updateUserValidator } from 'App/Validators/UserValidator'
import bcrypt from 'bcrypt'

export default class UsersController {
  async index(ctx: HttpContext) {
    const users = await User.query().select('id', 'email', 'role', 'createdAt', 'updatedAt')
    return ctx.response.ok(users.map((u) => u.serialize()))
  }

  async store(ctx: HttpContext) {
    const body = await createUserValidator.validate(ctx.request.body())
    const existing = await User.findBy('email', body.email)
    if (existing) {
      return ctx.response.conflict({ error: 'Email already registered' })
    }
    const hashedPassword = await bcrypt.hash(body.password, 10)
    const user = await User.create({
      email: body.email,
      password: hashedPassword,
      role: body.role,
    })
    return ctx.response.created({
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    })
  }

  async show(ctx: HttpContext) {
    const user = await User.find(ctx.params.id)
    if (!user) {
      return ctx.response.notFound({ error: 'User not found' })
    }
    return ctx.response.ok({
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
  }

  async update(ctx: HttpContext) {
    const user = await User.find(ctx.params.id)
    if (!user) {
      return ctx.response.notFound({ error: 'User not found' })
    }
    const body = await updateUserValidator.validate(ctx.request.body())
    if (body.email !== undefined) {
      const existing = await User.query().where('email', body.email).whereNot('id', user.id).first()
      if (existing) {
        return ctx.response.conflict({ error: 'Email already in use' })
      }
      user.email = body.email
    }
    if (body.password !== undefined) {
      user.password = await bcrypt.hash(body.password, 10)
    }
    if (body.role !== undefined) {
      user.role = body.role
    }
    await user.save()
    return ctx.response.ok({
      id: user.id,
      email: user.email,
      role: user.role,
      updatedAt: user.updatedAt,
    })
  }

  async destroy(ctx: HttpContext) {
    const user = await User.find(ctx.params.id)
    if (!user) {
      return ctx.response.notFound({ error: 'User not found' })
    }
    await user.delete()
    return ctx.response.noContent()
  }
}
