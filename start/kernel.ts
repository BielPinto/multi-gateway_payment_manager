/*
|--------------------------------------------------------------------------
| Application middleware
|--------------------------------------------------------------------------
*/

import Server from '@ioc:Adonis/Core/Server'

Server.middleware.register([() => import('@ioc:Adonis/Core/BodyParser')])

Server.middleware.registerNamed({
  auth: () => import('App/Middleware/AuthMiddleware'),
  role: () => import('App/Middleware/RoleMiddleware'),
})
