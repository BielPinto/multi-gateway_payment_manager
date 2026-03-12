import HttpContext from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import { JwtService } from 'App/Services/JwtService'
import { loginValidator } from 'App/Validators/LoginValidator'
import bcrypt from 'bcrypt'

export default class AuthController {
  async login(ctx: InstanceType<typeof HttpContext>) {
    const body = await loginValidator.validate(ctx.request.body())
    const user = await (User as any).findBy('email', body.email)
    if (!user) {
      return ctx.response.unauthorized({ error: 'Invalid credentials' })
    }
    const valid = await bcrypt.compare(body.password, user.password)
    if (!valid) {
      return ctx.response.unauthorized({ error: 'Invalid credentials' })
    }
    const token = await JwtService.sign({ sub: user.id, role: user.role })
    return ctx.response.ok({ token, user: { id: user.id, email: user.email, role: user.role } })
  }
}
