/*
|--------------------------------------------------------------------------
| Http Exception Handler
|--------------------------------------------------------------------------
*/

import Logger from '@ioc:Adonis/Core/Logger'
import HttpExceptionHandler from '@ioc:Adonis/Core/HttpExceptionHandler'
import type { HttpContext } from '@ioc:Adonis/Core/HttpContext'
import { ValidationError } from '@vinejs/vine'

export default class ExceptionHandler extends HttpExceptionHandler {
  constructor() {
    super(Logger)
  }

  async handle(error: unknown, ctx: HttpContext) {
    if (error instanceof ValidationError) {
      return ctx.response.status(422).json({
        error: 'Validation failed',
        messages: error.messages,
      })
    }

    if (error && typeof error === 'object' && 'status' in error && typeof (error as { status: number }).status === 'number') {
      const status = (error as { status: number }).status
      const message = (error as { message?: string }).message ?? 'Request failed'
      return ctx.response.status(status).json({ error: message })
    }

    return super.handle(error, ctx)
  }

  async report(error: unknown, ctx: HttpContext) {
    if (error instanceof ValidationError) {
      return
    }
    return super.report(error, ctx)
  }
}
