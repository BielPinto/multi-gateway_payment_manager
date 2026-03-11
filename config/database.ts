import Env from '@ioc:Adonis/Core/Env'

export default {
  connection: Env.get('DB_CONNECTION', 'mysql'),
  connections: {
    mysql: {
      client: 'mysql2',
      connection: {
        host: Env.get('MYSQL_HOST', 'localhost'),
        port: Env.get('MYSQL_PORT', 3306),
        user: Env.get('MYSQL_USER', 'root'),
        password: Env.get('MYSQL_PASSWORD', ''),
        database: Env.get('MYSQL_DB_NAME', 'multi_gateway_payments'),
      },
      migrations: {
        naturalSort: true,
      },
      healthCheck: false,
      debug: false,
    },
  },
}
