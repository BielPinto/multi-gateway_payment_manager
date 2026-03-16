# Sistema Gerenciador de Pagamentos Multi-Gateway

API REST em **AdonisJS 5+** para gerenciamento de pagamentos com múltiplos gateways. Realiza cobranças seguindo prioridade configurável e fallback em caso de falha de infraestrutura.

## Requisitos

- **Node.js** 18+
- **MySQL** 8
- **Docker** e **Docker Compose** (opcional, para rodar MySQL e mock dos gateways)

## Instalação

```bash
# Clone e entre na pasta do projeto
cd multi-gateway_payment_manager

# Instale as dependências
npm install --legacy-peer-deps

# Copie o ambiente e ajuste se necessário
cp .env.example .env
# Edite .env: APP_KEY, MYSQL_* etc.
```

### Banco de dados

Crie o banco e rode as migrations e seeds:

```bash
# Com MySQL rodando (local ou Docker)
node ace db:migrate
node ace db:seed
```

O seed cria:
- Usuário ADMIN: `admin@example.com` / `admin123`
- Dois gateways (Gateway 1 e 2) apontando para os mocks
- Três produtos de exemplo

### Rodar a aplicação

```bash
npm run dev
# ou
node ace serve --watch
```

A API fica em `http://localhost:3333` (ou a porta definida em `PORT` no `.env`).

## Docker Compose

O projeto inclui `docker-compose.yml` com:

- **db**: MySQL 8
- **app**: aplicação Adonis (build local, `node ace serve --watch`)
- **gateways-mock**: imagem [matheusprotzen/gateways-mock](https://hub.docker.com/r/matheusprotzen/gateways-mock) nas portas 3001 e 3002

```bash
# Subir todos os serviços
docker compose up -d

# Criar banco, migrations e seeds (na primeira vez, dentro do app ou no host com MySQL exposto)
docker compose exec app node ace db:migrate
docker compose exec app node ace db:seed
```

Com o compose, as variáveis `GATEWAY1_BASE_URL` e `GATEWAY2_BASE_URL` já apontam para o serviço `gateways-mock`. Para rodar o seed **no host** com MySQL em Docker, use as URLs dos mocks em `localhost` (3001/3002) ou, se subir o mock separado, as URLs correspondentes.

## Testes

```bash
# Todos os testes (unit + functional)
node ace test
# ou
npm test

# Apenas testes unitários (não exigem servidor)
node ace test unit

# Apenas testes funcionais (exigem servidor rodando)
node ace test functional
```

Os **resultados** aparecem no **próprio terminal**: cada teste com ✓ (passou) ou ✗ (falhou), seguido de um resumo (total, passed, failed, skipped). Se houver falhas, a lista de testes que falharam é exibida no final.

- **Unitários** (não precisam de servidor nem de gateways):
  - `tests/unit/gateway-fallback.spec.ts`: TDD do fallback (erro infra vs negócio, idempotência do fluxo de cobrança).
  - `tests/unit/purchase-service.spec.ts`: cálculo de amount com múltiplos itens (`computeAmountFromItems`).
  - `tests/unit/refund-service.spec.ts`: validação de reembolso (status PAID, gateway e externalId).
- **Funcionais (API)** (exigem servidor em execução; se não houver servidor, são ignorados sem falhar):
  - Health, login, gateways com token.
  - `POST /purchase` com múltiplos itens (amount e items), produto inválido (400), idempotência com `idempotencyKey`.
  - Roles: GET /api/users e GET /api/products como USER (403), como MANAGER/FINANCE (200); POST refund como USER (403), como FINANCE (200); refund em transação inexistente (404).

Para rodar os testes de API de fato: em um terminal `node ace serve`, em outro `node ace test` ou `node ace test functional`.

- **Com Docker**: use `docker compose run --rm --no-deps app node ace test unit` para só os unitários. Para os funcionais, suba os serviços e rode os testes a partir do host apontando para a API no container.

## Documentação da API (Swagger)

A API é documentada em **OpenAPI 3.0** e pode ser consultada via **Swagger UI**:

| URL | Descrição |
|-----|------------|
| **GET /docs** | Interface Swagger UI no navegador (testar requisições). |
| **GET /openapi.json** | Especificação OpenAPI em JSON. |

Com o servidor rodando (local ou Docker), abra no navegador: `http://localhost:3333/docs`. Para chamadas que exigem autenticação, use **Authorize** e informe o token obtido em `POST /login`.

---

## Detalhamento das rotas

Todas as respostas são **JSON**.

### Rotas públicas

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Health: `{ "hello": "world" }` |
| POST | `/login` | Login. Body: `email`, `password`. Retorna `token` (JWT) e `user` |
| POST | `/purchase` | Compra. Body: `clientName`, `clientEmail`, `items` (array de `{ productId, quantity }`), `cardNumber`, `cvv`, e opcionalmente `idempotencyKey` |

### Rotas privadas (prefixo `/api`)

Requer header: `Authorization: Bearer <token>` (token obtido em `POST /login`).

| Método | Rota | Roles | Descrição |
|--------|------|--------|-----------|
| GET | `/api/gateways` | autenticado | Listar gateways |
| GET | `/api/gateways/:id` | autenticado | Detalhe de um gateway |
| PATCH | `/api/gateways/:id/priority` | ADMIN | Alterar prioridade (body: `priority`) |
| PATCH | `/api/gateways/:id/activate` | ADMIN | Ativar gateway |
| PATCH | `/api/gateways/:id/deactivate` | ADMIN | Desativar gateway |
| GET | `/api/users` | ADMIN, MANAGER | Listar usuários |
| POST | `/api/users` | ADMIN, MANAGER | Criar usuário (body: `email`, `password`, `role`) |
| GET | `/api/users/:id` | ADMIN, MANAGER | Detalhe usuário |
| PATCH | `/api/users/:id` | ADMIN, MANAGER | Atualizar usuário |
| DELETE | `/api/users/:id` | ADMIN, MANAGER | Remover usuário |
| GET | `/api/products` | ADMIN, MANAGER, FINANCE | Listar produtos |
| POST | `/api/products` | ADMIN, MANAGER, FINANCE | Criar produto (body: `name`, `amount` em centavos) |
| GET | `/api/products/:id` | ADMIN, MANAGER, FINANCE | Detalhe produto |
| PATCH | `/api/products/:id` | ADMIN, MANAGER, FINANCE | Atualizar produto |
| DELETE | `/api/products/:id` | ADMIN, MANAGER, FINANCE | Remover produto |
| GET | `/api/clients` | autenticado | Listar clientes |
| GET | `/api/clients/:id` | autenticado | Detalhe do cliente e suas compras |
| GET | `/api/transactions` | autenticado | Listar transações |
| GET | `/api/transactions/:id` | autenticado | Detalhe da transação |
| POST | `/api/transactions/:id/refund` | ADMIN, FINANCE | Reembolso da transação |

### Permissões por role (Nível 3)

| Role | O que pode fazer |
|------|-------------------|
| **ADMIN** | Acesso total: todas as rotas (gateways, usuários, produtos, clientes, transações, reembolso). |
| **MANAGER** | Gerenciar produtos (CRUD) e usuários (CRUD). Listar/detalhar clientes, transações e gateways (sem ativar/desativar nem alterar prioridade). |
| **FINANCE** | Gerenciar produtos (CRUD) e realizar reembolso. Listar/detalhar clientes, transações e gateways (sem ativar/desativar nem alterar prioridade). |
| **USER** | O resto que não foi citado: listar clientes, detalhe do cliente e todas suas compras, listar transações, detalhe de transação, listar e detalhar gateways (sem ativar/desativar nem alterar prioridade). Não pode: CRUD de usuários, CRUD de produtos, reembolso. |

## Exemplos de uso

### Login

```bash
curl -s -X POST http://localhost:3333/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

Resposta: `{ "token": "...", "user": { "id", "email", "role" } }`.

### Compra

```bash
curl -s -X POST http://localhost:3333/purchase \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "Fulano",
    "clientEmail": "fulano@email.com",
    "items": [{"productId": 1, "quantity": 2}],
    "cardNumber": "5569000000006063",
    "cvv": "010"
  }'
```

### Acesso a rota protegida

```bash
TOKEN="<token_retornado_do_login>"
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3333/api/transactions
```

## Mock dos gateways

Para desenvolvimento e testes locais:

- **Com autenticação** (padrão):  
  `docker run -p 3001:3001 -p 3002:3002 matheusprotzen/gateways-mock`
- **Sem autenticação**:  
  `docker run -p 3001:3001 -p 3002:3002 -e REMOVE_AUTH='true' matheusprotzen/gateways-mock`

- Gateway 1: `http://localhost:3001`  
- Gateway 2: `http://localhost:3002`

O seed já configura os gateways com as URLs e credenciais compatíveis com esse mock. Em ambiente Docker Compose, as variáveis `GATEWAY1_BASE_URL` e `GATEWAY2_BASE_URL` apontam para o serviço `gateways-mock`.

## Implementação – Nível 3 (desafio  Back-end BeTalent)

Esta solução atende ao **Nível 3** do [teste prático  Back-end BeTalent](https://github.com/BeMobile/teste-pratico-backend):

- **Valor da compra**: calculado no back a partir de **múltiplos produtos** e quantidades (`POST /purchase` com `items: [{ productId, quantity }, ...]`).
- **Gateways com autenticação**: Gateway 1 (login + Bearer); Gateway 2 (headers `Gateway-Auth-Token` e `Gateway-Auth-Secret`). Mock rodando com auth no Docker Compose.
- **Roles**: ADMIN (tudo), MANAGER (produtos e usuários), FINANCE (produtos e reembolso), USER (clientes, transações, gateways em leitura). Ver tabela em [Permissões por role](#permissões-por-role-nível-3).
- **TDD**: testes unitários do fallback de gateways (`tests/unit/gateway-fallback.spec.ts`); testes unitários de PurchaseService e RefundService; testes de API para compra com múltiplos itens, reembolso e CRUD por role.
- **Docker Compose**: MySQL, aplicação e mock dos gateways (imagem `matheusprotzen/gateways-mock`).

## Outras informações

- **Validação**: VineJS nos payloads de login, compra, usuários, produtos e gateways.
- **Autenticação**: JWT (header `Authorization: Bearer <token>`). Segredo: `JWT_SECRET` ou `APP_KEY` no `.env`.
- **Valor das compras**: calculado no backend a partir dos produtos e quantidades; `amount` em centavos.
- **Idempotência**: opcional em `POST /purchase` via `idempotencyKey` (janela de ~5 minutos).
- **Novos gateways**: a API foi pensada para adicionar gateways de forma **simples e modular**: interface `PaymentGateway`, fábrica centralizada (`GatewayFactory`) e registro por tipo no banco. Passo a passo em [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) (seção 9.1).
- Documentação de uso interno (seeds, comandos Ace, serviços): ver [USAGE.md](./USAGE.md).  
- Plano de implementação por fases: ver [PLAN.md](./PLAN.md).

---

## Considerações finais

O que foi construído está em funcionamento (local e Docker). Abaixo: como a solução atende aos critérios de avaliação, o que foi implementado, o que ficou pendente e as principais dificuldades encontradas.

---

## Critérios de avaliação (atendimento)

| Critério | Atendimento |
|----------|-------------|
| **Lógica de programação** | Serviços de compra, reembolso e seleção de gateway com fallback por prioridade; idempotência por chave; classificação de erros (negócio vs infra) para não fazer fallback em erro de regra. |
| **Organização do projeto** | Estrutura Adonis (Models, Controllers, Services, Middleware, Validators); domínio em camadas; rotas em `start/routes.ts`; configuração em `config/` e `.env`. |
| **Legibilidade do código** | Nomes claros, funções enxutas, comentários onde necessário (ex.: roles no RoleMiddleware); tipos TypeScript. |
| **Validação dos dados** | VineJS em login, compra, usuário, produto e prioridade de gateway; regex para cartão (16 dígitos) e CVV; validação de role (enum). |
| **Uso adequado dos recursos** | Lucid ORM, JWT (jose), bcrypt para senha, fetch para gateways; middleware de auth e role; handler de exceções para respostas JSON. |
| **Padrões especificados** | Rotas públicas/privadas e roles (ADMIN, MANAGER, FINANCE, USER) conforme enunciado; MySQL; JSON; multi-gateway com prioridade e fallback; **facilidade de adicionar novos gateways** (interface + GatewayFactory + doc em ARCHITECTURE). |
| **Dados sensíveis** | Senha: nunca retornada (User com `serializeAs: null` no campo password); sempre hasheada com bcrypt. Cartão: apenas últimos 4 dígitos persistidos (`card_last_numbers`); número completo só em memória para envio ao gateway. JWT com segredo de env (`JWT_SECRET` ou `APP_KEY`). |
| **Clareza na documentação** | README com requisitos, instalação, rotas, exemplos curl e Docker; USAGE.md com seeds e comandos; PLAN.md com fases e resumos. |

---

## O que foi implementado

- **Fase 1–5 do PLAN.md** (setup, domínio, gateways, rotas/validação, testes e Docker).
- **Rotas públicas**: `POST /login`, `POST /purchase`.
- **Rotas privadas** (JWT + roles): CRUD usuários (ADMIN/MANAGER), CRUD produtos (ADMIN/MANAGER/FINANCE), listar/detalhar clientes e transações, ativar/desativar e prioridade de gateways (ADMIN), reembolso (ADMIN/FINANCE).
- **Validação** (VineJS) e **respostas JSON** padronizadas no handler de exceções.
- **Testes**: smoke; testes de API (health, login, gateways, compra com múltiplos itens, idempotência, roles, reembolso); **TDD** em testes unitários: fallback (`gateway-fallback.spec.ts`), cálculo de compra (`purchase-service.spec.ts`), validação de reembolso (`refund-service.spec.ts`). Testes de API são ignorados se o servidor não estiver rodando.
- **Docker Compose**: MySQL, app e gateways-mock; seed com suporte a URLs dos gateways via env.

## O que ficou pendente / limitações

- **Build de produção (`npm run build`)**: o compilador TypeScript do `ace build` não resolve módulos `@ioc:` e alguns tipos do Lucid/VineJS no ambiente de build; por isso o **Dockerfile** não executa `npm run build` e o container sobe com `node ace serve --watch` (TypeScript em tempo de execução). Para produção compilada seria necessário integrar o assembler/ioc-transformer ao fluxo de build ou ajustar declarações de tipos.
- **Testes de API**: dependem do servidor rodando; não há bootstrap que suba o servidor automaticamente nos testes.
- **Testes unitários** para JwtService e para fluxo completo de PurchaseService/RefundService com DB não foram adicionados; a lógica de fallback, cálculo de amount e validação de reembolso têm suites TDD em `tests/unit/`; o comportamento de compra e reembolso é coberto pelos testes de API.

## Dificuldades encontradas

1. **Adonis 5 + IoC no build**: o comando `node ace build --production` usa o compilador TypeScript sem o transformer de IoC em parte do fluxo, gerando erros para `@ioc:Adonis/Core/*` e `@ioc:Adonis/Lucid/*`. Contornado no Docker com execução via `ace serve` (sem etapa de build).
2. **HttpContext como tipo**: o módulo exporta o valor (classe), não o tipo; foi usado `InstanceType<typeof HttpContext>` nos controllers e middlewares.
3. **Conflito de peer deps**: `npm install` sem `--legacy-peer-deps` falha por causa de versões do Japa; documentado o uso de `--legacy-peer-deps`.
4. **Testes com servidor**: não foi usado o bootstrap completo do Adonis que sobe o HTTP server nos testes; os testes de API usam `fetch` e, em caso de ECONNREFUSED, são ignorados para não falhar o `node ace test`.

## Garantia de funcionamento

- **Local**: `npm run dev`, `node ace db:migrate`, `node ace db:seed`; mock dos gateways em 3001/3002. Login, compra e rotas privadas com token testados via curl (exemplos no README).
- **Docker**: `docker compose up -d` sobe db, app e gateways-mock; em seguida `docker compose exec app node ace db:migrate` e `docker compose exec app node ace db:seed`. A aplicação responde na porta 3333.
- **Testes**: `node ace test` executa o smoke e os testes de API (se o servidor estiver rodando).
