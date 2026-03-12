/*
|--------------------------------------------------------------------------
| Validating Environment Variables
|--------------------------------------------------------------------------
*/

import Env from '@ioc:Adonis/Core/Env'

export default Env.rules({
  HOST: Env.schema.string({ format: 'host' }),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  APP_NAME: Env.schema.string(),
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),

  DB_CONNECTION: Env.schema.string.optional({ default: 'mysql' }),
  MYSQL_HOST: Env.schema.string.optional({ format: 'host', default: 'localhost' }),
  MYSQL_PORT: Env.schema.number.optional({ default: 3306 }),
  MYSQL_USER: Env.schema.string.optional({ default: 'root' }),
  MYSQL_PASSWORD: Env.schema.string.optional({ default: '' }),
  MYSQL_DB_NAME: Env.schema.string.optional({ default: 'multi_gateway_payments' }),

  JWT_SECRET: Env.schema.string.optional(),
})
