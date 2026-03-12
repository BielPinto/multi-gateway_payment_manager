/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

import Route from '@ioc:Adonis/Core/Route'

Route.get('/', async () => ({ hello: 'world' }))

// ----- Públicas -----
Route.post('/login', 'AuthController.login')
Route.post('/purchase', 'PurchasesController.store')

// ----- Privadas (JWT + role) -----
Route.group(() => {
  // Gateways: list/show qualquer; activate/deactivate/priority só ADMIN
  Route.get('/gateways', 'GatewaysController.index')
  Route.get('/gateways/:id', 'GatewaysController.show')
  Route.patch('/gateways/:id/priority', 'GatewaysController.updatePriority').middleware(['role:ADMIN'])
  Route.patch('/gateways/:id/activate', 'GatewaysController.activate').middleware(['role:ADMIN'])
  Route.patch('/gateways/:id/deactivate', 'GatewaysController.deactivate').middleware(['role:ADMIN'])

  // Users CRUD - ADMIN, MANAGER
  Route.get('/users', 'UsersController.index').middleware(['role:ADMIN,MANAGER'])
  Route.post('/users', 'UsersController.store').middleware(['role:ADMIN,MANAGER'])
  Route.get('/users/:id', 'UsersController.show').middleware(['role:ADMIN,MANAGER'])
  Route.patch('/users/:id', 'UsersController.update').middleware(['role:ADMIN,MANAGER'])
  Route.delete('/users/:id', 'UsersController.destroy').middleware(['role:ADMIN,MANAGER'])

  // Products CRUD - MANAGER, FINANCE
  Route.get('/products', 'ProductsController.index').middleware(['role:ADMIN,MANAGER,FINANCE'])
  Route.post('/products', 'ProductsController.store').middleware(['role:ADMIN,MANAGER,FINANCE'])
  Route.get('/products/:id', 'ProductsController.show').middleware(['role:ADMIN,MANAGER,FINANCE'])
  Route.patch('/products/:id', 'ProductsController.update').middleware(['role:ADMIN,MANAGER,FINANCE'])
  Route.delete('/products/:id', 'ProductsController.destroy').middleware(['role:ADMIN,MANAGER,FINANCE'])

  // Clients - USER+
  Route.get('/clients', 'ClientsController.index')
  Route.get('/clients/:id', 'ClientsController.show')

  // Transactions - USER+
  Route.get('/transactions', 'TransactionsController.index')
  Route.get('/transactions/:id', 'TransactionsController.show')

  // Refund - FINANCE, ADMIN
  Route.post('/transactions/:id/refund', 'RefundsController.store').middleware(['role:ADMIN,FINANCE'])
})
  .middleware(['auth'])
  .prefix('/api')
