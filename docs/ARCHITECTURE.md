# Arquitetura e padrões – Multi-Gateway Payment Manager

Este documento descreve os **padrões implementados** e a **comunicação entre componentes** da aplicação.

---

## 1. Visão geral

A aplicação é uma API REST em **AdonisJS 5**, com autenticação JWT, autorização por roles e integração a múltiplos gateways de pagamento com fallback.

```
Cliente HTTP
    → Middleware (BodyParser → Auth [opcional] → Role [opcional])
    → Controller
    → Validator (VineJS) [quando há body]
    → Service (regra de negócio)
    → Model (Lucid) / Gateway (HTTP externo)
    → Resposta JSON
```

---

## 2. Camadas e responsabilidades

| Camada        | Localização              | Responsabilidade |
|---------------|--------------------------|------------------|
| **Rotas**     | `start/routes.ts`        | Define método, path, controller e middlewares (auth, role). |
| **Middleware**| `app/Middleware/`        | BodyParser (global), Auth (JWT), Role (permissão por perfil). |
| **Controller**| `app/Controllers/Http/`  | Recebe a requisição, valida (VineJS), chama Service, monta resposta. |
| **Validator** | `app/Validators/`         | Validação de entrada com VineJS (login, purchase, user, product, gateway). |
| **Service**   | `app/Services/`          | Lógica de negócio (compra, reembolso, JWT, seleção de gateway). |
| **Model**     | `app/Models/`            | Persistência com Lucid (User, Gateway, Product, Client, Transaction, etc.). |
| **Exception** | `app/Exceptions/Handler.ts` | Trata ValidationError (422) e erros HTTP; respostas em JSON. |

---

## 3. Fluxo da requisição

### 3.1 Rotas públicas (sem auth)

- **GET /**  
  Handler inline: retorna `{ hello: 'world' }` (health).
- **POST /login**  
  `AuthController.login` → `LoginValidator` → busca User, bcrypt.compare → `JwtService.sign` → retorna `{ token, user }`.
- **POST /purchase**  
  `PurchasesController.store` → `PurchaseValidator` → `PurchaseService.execute` → resposta com transação (sem número completo do cartão).

### 3.2 Rotas privadas (prefixo `/api`)

Todas passam por:

1. **auth**  
   Lê `Authorization: Bearer <token>`, `JwtService.verify`, carrega User e preenche `ctx.auth = { user }`.  
   Em falha: 401 com `{ error: '...' }`.

2. **role** (quando configurado na rota)  
   Verifica se `ctx.auth.user.role` está em uma lista permitida (ex.: `ADMIN`, `MANAGER,FINANCE`).  
   ADMIN passa em qualquer rota; demais só nas rotas que incluem seu role.  
   Em falha: 403 com `{ error: 'Insufficient permissions' }`.

3. **Controller**  
   Valida body (se houver) com o validator correspondente e chama o service ou o model.

---

## 4. Comunicação entre componentes

### 4.1 Controller ↔ Validator

- O controller chama `await someValidator.validate(ctx.request.body())`.
- Em sucesso: recebe objeto tipado.
- Em falha: VineJS lança `ValidationError`; o `ExceptionHandler` responde 422 com `{ error: 'Validation failed', messages: [...] }`.

### 4.2 Controller ↔ Service

- O controller instancia (ou reutiliza) o service e chama métodos que devolvem dados ou lançam erro.
- Ex.: `PurchaseService.execute(input)` retorna uma transação ou lança `Error` com mensagem; o controller traduz em 400/402 e JSON.

### 4.3 Service ↔ Model

- Services usam os models Lucid (ex.: `User.findBy`, `Gateway.query()`, `Transaction.create()`).
- Acesso por import direto (ex.: `App/Models/Gateway`). Sem injeção de repositório; padrão atual é uso direto do model.

### 4.4 Service ↔ Gateway externo

- **GatewayFactory** é o único ponto que cria instâncias de gateway a partir do registro no banco (`type`, `base_url`, `config_json`). Tanto **GatewaySelectorService** (cobrança) quanto **RefundService** (reembolso) usam a factory; assim, adicionar um novo gateway exige alteração em um só lugar.
- **GatewaySelectorService** carrega gateways ativos do banco (ordenados por `priority`), obtém cada instância via `GatewayFactory.createFromGateway(gateway)` e delega a **chargeWithFallback**.
- A lógica de “tentar em ordem e fazer fallback em erro de infra” está em **chargeWithFallback** (módulo puro em `app/Services/Gateways/chargeWithFallback.ts`).
- **PurchaseService** chama `GatewaySelectorService.charge(payload)`; o selector usa `chargeWithFallback` com a lista de gateways (ou lista injetada em testes).
- Comunicação com o gateway externo é HTTP via **HttpClient** (`app/Services/Http/HttpClient.ts`), usado por Gateway1Service e Gateway2Service.

### 4.5 Auth e contexto

- **AuthMiddleware** após validar o JWT preenche `ctx.auth = { user }` (objeto User do Lucid).
- **RoleMiddleware** lê `ctx.auth.user.role` e a lista de roles permitidos (string no registro do middleware, ex.: `role:ADMIN,FINANCE`).
- Controllers e middlewares não acessam request/response diretamente de um “contexto global”; tudo passa por `ctx` (HttpContext).

---

## 5. Padrões implementados

### 5.1 Validação na entrada

- Todo body que influencia regra de negócio é validado com **VineJS** em um validator dedicado (LoginValidator, PurchaseValidator, UserValidator, ProductValidator, GatewayValidator).
- Erros de validação são tratados de forma uniforme em JSON (422 + messages).

### 5.2 Respostas JSON uniformes

- Sucesso: `ctx.response.ok()`, `ctx.response.created()` etc. com objeto JSON.
- Erro: `ctx.response.unauthorized()`, `ctx.response.forbidden()`, `ctx.response.badRequest()`, `ctx.response.notFound()` com `{ error: '...' }` (e, no caso de validação, `messages`).
- O **ExceptionHandler** garante que ValidationError e erros com `status` numérico viram resposta JSON.

### 5.3 Multi-gateway com fallback (extensível e modular)

- **PaymentGateway**: interface comum (`charge`, `refund`). Qualquer novo gateway implementa apenas essa interface.
- **GatewayFactory**: fábrica centralizada que, dado um registro de gateway (tabela `gateways`), retorna a instância do serviço correspondente. **Um único ponto** para registrar novos tipos.
- **Gateway1Service** / **Gateway2Service**: implementam a interface e chamam os gateways externos via HTTP.
- **GatewaySelectorService** e **RefundService**: usam `GatewayFactory.createFromGateway(gateway)`; não conhecem os tipos concretos.
- **chargeWithFallback** (módulo puro):
  - Sucesso em um gateway → retorna resultado.
  - Erro de **negócio** (ex.: cartão recusado) → lança; não tenta próximo.
  - Erro de **infra** (ex.: timeout, 5xx) → tenta o próximo gateway na ordem; se todos falharem, lança com a mensagem do último erro.

### 5.4 Dados sensíveis

- **Senha**: apenas hash (bcrypt) no banco; nunca retornada (campo com `serializeAs: null` no model User).
- **Cartão**: apenas últimos 4 dígitos persistidos; número completo só em memória para envio ao gateway.
- **JWT**: assinado com segredo de ambiente (`JWT_SECRET` ou `APP_KEY`).

### 5.5 Idempotência de compra

- **PurchaseService** aceita `idempotencyKey` opcional.
- Dentro de uma janela de tempo (ex.: 5 minutos), se já existir transação com a mesma chave para o mesmo cliente, retorna a transação existente em vez de criar nova cobrança.

---

## 6. Diagrama de comunicação (compra)

```
Cliente
  POST /purchase (body: clientName, clientEmail, items, cardNumber, cvv, idempotencyKey?)
    → BodyParser
    → PurchasesController.store
        → PurchaseValidator.validate(body)
        → PurchaseService.execute(...)
            → Product (Lucid) – validar produtos
            → Client (Lucid) – buscar ou criar cliente
            → Transaction (Lucid) – idempotência, criar PENDING
            → TransactionProduct (Lucid) – itens
            → GatewaySelectorService.charge(payload)
                → Gateway (Lucid) – listar ativos por prioridade
                → chargeWithFallback(lista, payload)
                    → Gateway1Service.charge() ou Gateway2Service.charge()
                        → HttpClient (HTTP ao gateway externo)
                    [se infra error] → próximo gateway
                    [se business error] → throw
            → Transaction (Lucid) – atualizar PAID/FAILED
        → ctx.response.created(transaction)
```

---

## 7. Estrutura de pastas relevante

```
app/
  Controllers/Http/     # Um controller por recurso (Auth, Purchases, Gateways, Users, ...)
  Middleware/           # AuthMiddleware, RoleMiddleware
  Models/               # User, Gateway, Product, Client, Transaction, TransactionProduct
  Services/             # JwtService, PurchaseService, RefundService
  Services/Gateways/    # PaymentGateway, Types, GatewayFactory, chargeWithFallback, GatewaySelectorService, Gateway1Service, Gateway2Service, Gateway1AuthService
  Services/Http/       # HttpClient
  Validators/           # LoginValidator, PurchaseValidator, UserValidator, ...
  Exceptions/Handler.ts
start/
  routes.ts             # Definição de rotas e middlewares
  kernel.ts             # Registro de middlewares (bodyParser, auth, role)
```

---

## 8. Documentação da API (Swagger / OpenAPI)

- **GET /docs** — Swagger UI (HTML) para consultar e testar a API no navegador.
- **GET /openapi.json** — Especificação OpenAPI 3.0 em JSON.
- A spec está em `config/openapi.ts`; o controller `SwaggerController` serve a UI e o JSON.
- Na Swagger UI é possível informar o JWT em **Authorize** (Bearer) e executar as rotas privadas.

---

## 9. Extensibilidade

### 9.1 Como adicionar um novo gateway (modular e simples)

1. **Criar o serviço** em `app/Services/Gateways/`, por exemplo `Gateway3Service.ts`, implementando a interface **PaymentGateway**:
   - `charge(payload: ChargePayload): Promise<ChargeResult>` — converter payload para o formato da API do gateway, chamar HTTP, converter resposta para `ChargeResult` (com `success`, `externalId`, e em erro `type: 'business' | 'infra'`).
   - `refund(payload: RefundPayload): Promise<RefundResult>` — chamar o endpoint de reembolso do gateway com `externalId`.

2. **Registrar na fábrica** em `app/Services/Gateways/GatewayFactory.ts`: adicionar um `case 'gateway3':` (ou o tipo escolhido) em `createFromGateway`, instanciando o novo serviço com `baseUrl` e parâmetros lidos de `config` (parse de `configJson`).

3. **Cadastrar no banco**: inserir (ou incluir em um seeder) um registro na tabela `gateways` com `name`, `is_active`, `priority`, `type` (ex.: `'gateway3'`), `base_url` e `config_json` (credenciais ou opções específicas em JSON).

Nenhuma alteração é necessária em **GatewaySelectorService**, **RefundService** ou **chargeWithFallback**: eles já usam a interface e a factory. O fallback por prioridade e a distinção erro negócio/infra continuam valendo para o novo gateway.

### 9.2 Outras extensões

- **Nova rota**: adicionar em `start/routes.ts`; se privada, usar `.middleware(['auth'])` e opcionalmente `role:ADMIN,MANAGER,...`.
- **Nova validação**: criar validator com VineJS em `app/Validators/` e chamar no controller.
