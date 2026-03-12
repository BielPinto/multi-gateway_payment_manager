# Uso: Seeds e serviços (Ace / script)

## Comandos dos seeds

Rodar **todas** as migrations e depois **todos** os seeders:

```bash
# 1. Subir o MySQL (local ou Docker)
# Docker: docker compose up -d db
# Ou use seu MySQL local (crie o banco: CREATE DATABASE multi_gateway_payments;)

# 2. Migrations
node ace db:migrate
# ou
npm run db:migrate

# 3. Seeders (usuário ADMIN, gateways 1 e 2, produtos)
node ace db:seed
# ou
npm run db:seed
```

O que cada seeder faz:

| Seeder              | Conteúdo |
|---------------------|----------|
| `01_user_seeder`    | Usuário ADMIN: `admin@example.com` / `admin123` |
| `02_gateway_seeder` | Gateway 1 (localhost:3001) e Gateway 2 (localhost:3002) com credenciais do mock |
| `03_product_seeder`| 3 produtos de exemplo (valores em centavos) |

---

## Usar os serviços via Ace (demo)

Depois de rodar migrations + seeds e **subir o mock dos gateways**:

```bash
# Mock dos gateways (em outro terminal)
docker run -p 3001:3001 -p 3002:3002 matheusprotzen/gateways-mock
```

Regenerar o manifest para os comandos de demo aparecerem:

```bash
node ace generate:manifest
```

Comandos de demonstração:

```bash
# Faz uma compra de exemplo (produto 1, cartão que aprova no mock)
node ace demo:purchase

# Reembolsa a última transação paga
node ace demo:refund
```

---

## Usar os serviços em código (script ou controller)

### PurchaseService

```ts
import { PurchaseService } from 'App/Services/PurchaseService'

const purchase = new PurchaseService()
const transaction = await purchase.execute({
  clientName: 'Nome do Cliente',
  clientEmail: 'cliente@email.com',
  items: [
    { productId: 1, quantity: 2 },
    { productId: 2, quantity: 1 },
  ],
  cardNumber: '5569000000006063',
  cvv: '010',
  idempotencyKey: 'opcional-uuid-ou-string', // evita cobrança duplicada
})
// transaction.status === 'PAID' ou transação anterior se idempotencyKey repetido
```

### RefundService

```ts
import { RefundService } from 'App/Services/RefundService'

const refund = new RefundService()
const transaction = await refund.execute(transactionId) // ID da transação no seu banco
// transaction.status === 'REFUNDED'
```

### Script Node puro (fora do Ace)

Para rodar fora do Ace (ex.: `node scripts/purchase.js`), é preciso **inicializar o app Adonis** antes (carregar env, DB, etc.). O jeito recomendado é usar um **comando Ace** como os `demo:purchase` e `demo:refund`, ou chamar esses serviços a partir de **controllers** na Fase 4.

Resumo: use **Ace** para testes rápidos (`demo:purchase`, `demo:refund`) e, quando existirem rotas, use **controllers** que chamam `PurchaseService` e `RefundService`.
