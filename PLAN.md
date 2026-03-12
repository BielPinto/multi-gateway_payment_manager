# Sistema Gerenciador de Pagamentos Multi-Gateway (Adonis 5+)

Plano de implementação em fases. Validação do usuário antes de cada fase.

## Fases

### Fase 1 – Setup do projeto e infra básica (concluída)
- Projeto Adonis 5+ na raiz
- MySQL configurado via env (config/database.ts, env.ts, .env.example)
- Scripts: dev, build, start, test. Teste de fumaça (node ace test)
- Dockerfile e docker-compose.yml (app, db; gateways-mock comentado)

### Fase 2 – Domínio e persistência (concluída)
- Models: User, Gateway, Client, Product, Transaction, TransactionProduct
- Migrations e seeds (ADMIN, gateways mock, produtos)
- Lucid 18 registrado; MySQL em config/database.ts. Comandos locais: db:migrate, db:seed (npm run db:migrate / db:seed). Rodar generate:manifest após alterar commands no .adonisrc.

#### Resumo da Fase 2
- **Lucid 18**: ORM registrado; `config/database.ts` com connection `mysql` e variáveis em `env.ts`/`.env`.
- **Migrations** (`database/migrations/`): 6 tabelas — `users` (email, password, role), `gateways` (name, is_active, priority, type, base_url, config_json), `clients`, `products` (amount em centavos), `transactions` (client_id, gateway_id, external_id, status, amount, card_last_numbers, idempotency_key), `transaction_products`.
- **Models** (`app/Models/`): User, Gateway, Client, Product, Transaction, TransactionProduct com relações (belongsTo/hasMany).
- **Seeders** (`database/seeders/`): 01_user_seeder (ADMIN: admin@example.com / admin123), 02_gateway_seeder (Gateway 1 e 2 com URLs e config), 03_product_seeder (3 produtos exemplo).
- **Comandos Ace**: `db:migrate` e `db:seed` em `commands/`; uso de `ace-manifest.json` (gerado com `node ace generate:manifest`). Assembler removido do array `commands` do `.adonisrc.json` para o manifest gerar sem erro.
- **Uso**: MySQL em `.env` (MYSQL_HOST, MYSQL_PASSWORD, etc.). Rodar `node ace db:migrate` e `node ace db:seed` com o banco ativo.

### Fase 3 – Gateways e serviços de pagamento (concluída)
- Interface PaymentGateway; tipos success/type (business|infra)
- Gateway1AuthService (singleton, token + retry em 401)
- Gateway1Service, Gateway2Service, GatewaySelectorService (fallback só em erro infra)
- PurchaseService (cálculo, idempotency_key, card_last_numbers só últimos 4)
- RefundService

#### Resumo da Fase 3
- **Tipos** (`app/Services/Gateways/Types.ts`): ChargePayload, ChargeResult, RefundPayload, RefundResult; `GatewayErrorType`: business | infra.
- **PaymentGateway** (`PaymentGateway.ts`): interface com charge e refund.
- **HttpClient** (`app/Services/Http/HttpClient.ts`): fetch encapsulado para chamadas aos mocks.
- **Gateway1AuthService**: singleton com getToken(), clearToken(), configure(); retry em 401 feito no Gateway1Service (uma vez).
- **Gateway1Service**: POST /login (via auth), POST /transactions, POST /transactions/:id/charge_back; classifica 4xx como business, 5xx/timeout como infra.
- **Gateway2Service**: headers fixos Gateway-Auth-Token/Secret; POST /transacoes, POST /transacoes/reembolso; mesma classificação business/infra.
- **GatewaySelectorService**: carrega gateways ativos por prioridade do banco; monta serviço por type (gateway1/gateway2); tenta charge em ordem; em erro infra tenta próximo, em erro business lança.
- **PurchaseService**: valida produtos, calcula amount, idempotency_key (janela 5 min), cria cliente se não existir, cria Transaction (PENDING) e TransactionProducts, mascara cartão (só últimos 4), chama selector.charge, atualiza para PAID ou FAILED.
- **RefundService**: valida transação PAID e não REFUNDED, chama gateway original para reembolso, atualiza status para REFUNDED.

### Fase 4 – Rotas, controllers e validação (concluída)
- Rotas públicas: POST /login, POST /purchase
- Rotas privadas (JWT + roles): gateways, users, products, clients, transactions, refund
- Validators (VineJS ou equivalente), handler de exceções JSON

#### Resumo da Fase 4
- **JWT**: `JwtService` (jose), `AuthMiddleware` (Bearer), `RoleMiddleware` (ADMIN, MANAGER, FINANCE, USER). Contrato `contracts/auth.ts` estende `HttpContext` com `auth.user`.
- **Rotas públicas**: `POST /login` (email, password → token + user), `POST /purchase` (clientName, clientEmail, items, cardNumber, cvv, idempotencyKey opcional).
- **Rotas privadas** (prefixo `/api`, middleware `auth`): gateways (list, show, priority/activate/deactivate com role ADMIN), users CRUD (ADMIN, MANAGER), products CRUD (ADMIN, MANAGER, FINANCE), clients list/show, transactions list/show, `POST /api/transactions/:id/refund` (ADMIN, FINANCE).
- **Validators** (VineJS): LoginValidator, PurchaseValidator, UserValidator (create/update), ProductValidator (create/update), GatewayValidator (priority). Validação no controller com `validator.validate(ctx.request.body())`.
- **Exception handler**: `ValidationError` → 422 + messages; respostas JSON padronizadas.

### Fase 5 – TDD, Docker e documentação
- Testes unitários e de integração; gateways-mock no compose
- README com requisitos, instalação, rotas e exemplos

## Ajustes de engenharia
- Resiliência Gateway 1: retry único em 401 após renovar token
- card_last_numbers: nunca persistir número completo; masking no PurchaseService
- Fallback: só em erro de infraestrutura; erro de negócio não tenta próximo gateway
- Idempotência: idempotency_key opcional na compra (janela ~5 min)
