/**
 * OpenAPI 3.0 spec para a API Multi-Gateway Payment Manager.
 * Acessível em GET /openapi.json e visualizado em GET /docs (Swagger UI).
 */
export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Multi-Gateway Payment Manager API',
    description: 'API REST para gestão de pagamentos com múltiplos gateways, usuários, produtos, clientes e transações.',
    version: '1.0.0',
  },
  servers: [{ url: '/', description: 'Servidor atual' }],
  tags: [
    { name: 'Health', description: 'Health check' },
    { name: 'Auth', description: 'Autenticação' },
    { name: 'Purchase', description: 'Compra (pública)' },
    { name: 'Gateways', description: 'Gateways de pagamento' },
    { name: 'Users', description: 'Usuários do sistema' },
    { name: 'Products', description: 'Produtos' },
    { name: 'Clients', description: 'Clientes' },
    { name: 'Transactions', description: 'Transações' },
    { name: 'Refunds', description: 'Reembolsos' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token obtido em POST /login',
      },
    },
    schemas: {
      Health: {
        type: 'object',
        properties: { hello: { type: 'string', example: 'world' } },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@example.com' },
          password: { type: 'string', example: 'admin123' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', description: 'JWT' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              email: { type: 'string' },
              role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'FINANCE', 'USER'] },
            },
          },
        },
      },
      PurchaseItem: {
        type: 'object',
        required: ['productId', 'quantity'],
        properties: {
          productId: { type: 'integer', minimum: 1 },
          quantity: { type: 'integer', minimum: 1 },
        },
      },
      PurchaseRequest: {
        type: 'object',
        required: ['clientName', 'clientEmail', 'items', 'cardNumber', 'cvv'],
        properties: {
          clientName: { type: 'string' },
          clientEmail: { type: 'string', format: 'email' },
          items: { type: 'array', items: { $ref: '#/components/schemas/PurchaseItem' }, minItems: 1 },
          cardNumber: { type: 'string', pattern: '^\\d{16}$', description: '16 dígitos' },
          cvv: { type: 'string', pattern: '^\\d{3,4}$' },
          idempotencyKey: { type: 'string', description: 'Opcional; evita cobrança duplicada' },
        },
      },
      PurchaseResponse: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          status: { type: 'string', enum: ['PENDING', 'PAID', 'FAILED'] },
          amount: { type: 'number' },
          cardLastNumbers: { type: 'string', description: 'Últimos 4 dígitos' },
          client: { type: 'object', properties: { id: {}, name: {}, email: {} } },
          items: { type: 'array', items: { type: 'object', properties: { productId: {}, quantity: {} } } },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Gateway: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          isActive: { type: 'boolean' },
          priority: { type: 'integer' },
          type: { type: 'string', enum: ['gateway1', 'gateway2'] },
          baseUrl: { type: 'string' },
        },
      },
      GatewayPriority: {
        type: 'object',
        required: ['priority'],
        properties: { priority: { type: 'integer', minimum: 0 } },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          email: { type: 'string' },
          role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'FINANCE', 'USER'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateUser: {
        type: 'object',
        required: ['email', 'password', 'role'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
          role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'FINANCE', 'USER'] },
        },
      },
      UpdateUser: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
          role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'FINANCE', 'USER'] },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          amount: { type: 'number' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateProduct: {
        type: 'object',
        required: ['name', 'amount'],
        properties: {
          name: { type: 'string' },
          amount: { type: 'number', minimum: 0 },
        },
      },
      UpdateProduct: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          amount: { type: 'number', minimum: 0 },
        },
      },
      Client: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          email: { type: 'string' },
        },
      },
      Transaction: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          status: { type: 'string', enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'] },
          amount: { type: 'number' },
          cardLastNumbers: { type: 'string' },
          client: { $ref: '#/components/schemas/Client' },
          items: { type: 'array' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Error: {
        type: 'object',
        properties: { error: { type: 'string' } },
      },
      ValidationError: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          messages: { type: 'object' },
        },
      },
    },
  },
  paths: {
    '/': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          '200': {
            description: 'OK',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Health' } } },
          },
        },
      },
    },
    '/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: {
          '200': {
            description: 'Token e usuário',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } },
          },
          '401': { description: 'Credenciais inválidas', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '422': { description: 'Validação', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
        },
      },
    },
    '/purchase': {
      post: {
        tags: ['Purchase'],
        summary: 'Realizar compra',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/PurchaseRequest' } } },
        },
        responses: {
          '201': {
            description: 'Compra criada',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PurchaseResponse' } } },
          },
          '400': { description: 'Dados inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '402': { description: 'Pagamento recusado ou falha no gateway', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '422': { description: 'Validação', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
        },
      },
    },
    '/api/gateways': {
      get: {
        tags: ['Gateways'],
        summary: 'Listar gateways',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de gateways',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Gateway' } } } },
          },
          '401': { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/gateways/{id}': {
      get: {
        tags: ['Gateways'],
        summary: 'Detalhar gateway',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Gateway', content: { 'application/json': { schema: { $ref: '#/components/schemas/Gateway' } } } },
          '401': { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      patch: {
        tags: ['Gateways'],
        summary: 'Atualizar prioridade (ADMIN)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/GatewayPriority' } } } },
        responses: {
          '200': { description: 'Gateway atualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Gateway' } } } },
          '401': { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Sem permissão', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/gateways/{id}/activate': {
      patch: {
        tags: ['Gateways'],
        summary: 'Ativar gateway (ADMIN)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Gateway ativado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Gateway' } } } },
          '401': { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Sem permissão', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/gateways/{id}/deactivate': {
      patch: {
        tags: ['Gateways'],
        summary: 'Desativar gateway (ADMIN)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Gateway desativado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Gateway' } } } },
          '401': { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Sem permissão', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/users': {
      get: {
        tags: ['Users'],
        summary: 'Listar usuários (ADMIN, MANAGER)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Lista de usuários', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } } },
          '401': { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Sem permissão', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      post: {
        tags: ['Users'],
        summary: 'Criar usuário (ADMIN, MANAGER)',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateUser' } } } },
        responses: {
          '201': { description: 'Usuário criado', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          '401': { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Sem permissão', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '409': { description: 'Email já registrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '422': { description: 'Validação', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
        },
      },
    },
    '/api/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Detalhar usuário (ADMIN, MANAGER)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Usuário', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          '401': { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Sem permissão', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Atualizar usuário (ADMIN, MANAGER)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateUser' } } } },
        responses: {
          '200': { description: 'Usuário atualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          '401': { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Sem permissão', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '422': { description: 'Validação', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Excluir usuário (ADMIN, MANAGER)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Excluído' },
          '401': { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Sem permissão', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/products': {
      get: {
        tags: ['Products'],
        summary: 'Listar produtos (ADMIN, MANAGER, FINANCE)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Lista de produtos', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Product' } } } } },
          '401': { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Sem permissão', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      post: {
        tags: ['Products'],
        summary: 'Criar produto (ADMIN, MANAGER, FINANCE)',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateProduct' } } } },
        responses: {
          '201': { description: 'Produto criado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } },
          '401': { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Sem permissão', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '422': { description: 'Validação', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
        },
      },
    },
    '/api/products/{id}': {
      get: {
        tags: ['Products'],
        summary: 'Detalhar produto (ADMIN, MANAGER, FINANCE)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Produto', content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } },
          '401': { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Sem permissão', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      patch: {
        tags: ['Products'],
        summary: 'Atualizar produto (ADMIN, MANAGER, FINANCE)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateProduct' } } } },
        responses: {
          '200': { description: 'Produto atualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } },
          '401': { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Sem permissão', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '422': { description: 'Validação', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
        },
      },
      delete: {
        tags: ['Products'],
        summary: 'Excluir produto (ADMIN, MANAGER, FINANCE)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Excluído' },
          '401': { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Sem permissão', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/clients': {
      get: {
        tags: ['Clients'],
        summary: 'Listar clientes',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Lista de clientes', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Client' } } } } },
          '401': { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/clients/{id}': {
      get: {
        tags: ['Clients'],
        summary: 'Detalhar cliente',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Cliente', content: { 'application/json': { schema: { $ref: '#/components/schemas/Client' } } } },
          '401': { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/transactions': {
      get: {
        tags: ['Transactions'],
        summary: 'Listar transações',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Lista de transações', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Transaction' } } } } },
          '401': { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/transactions/{id}': {
      get: {
        tags: ['Transactions'],
        summary: 'Detalhar transação',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Transação', content: { 'application/json': { schema: { $ref: '#/components/schemas/Transaction' } } } },
          '401': { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/transactions/{id}/refund': {
      post: {
        tags: ['Refunds'],
        summary: 'Reembolsar transação (ADMIN, FINANCE)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Transação reembolsada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Transaction' } } } },
          '400': { description: 'Transação não paga ou já reembolsada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '401': { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Sem permissão', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Transação não encontrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '502': { description: 'Falha no gateway', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
  },
}
