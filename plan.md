# Sistema Gerenciador de Pagamentos Multi-Gateway (Adonis 5+)

Este plano descreve a implementação de uma API RESTful em AdonisJS 5+ para gerenciar pagamentos multi-gateway, integrada a MySQL e a dois gateways externos, com TDD e Docker Compose. O foco é garantir extensibilidade para novos gateways, segurança de dados sensíveis e regras claras de fallback entre gateways.

## Fases do Projeto

### Fase 1 – Setup do projeto e infra básica
- Criar um projeto AdonisJS 5+ (preferencialmente em um subdiretório dedicado, como `api/`).
- Configurar TypeScript e linting básicos.
- Configurar conexão com MySQL via variáveis de ambiente (`.env` e `env.ts`).
- Preparar estrutura de testes (Japa/Jest) e scripts npm para `dev`, `test` e `lint`.
- Esboçar `docker-compose.yml` com serviços de app e MySQL (e deixar previsto o mock de gateways).

### Fase 2 – Domínio e persistência
- Modelar entidades:
  - `User` (`users`): `email`, `password`, `role` (enum: ADMIN, MANAGER, FINANCE, USER).
  - `Gateway` (`gateways`): `name`, `is_active`, `priority`, `type`, `base_url`, `auth_type`, `config_json`.
  - `Client` (`clients`): `name`, `email`.
  - `Product` (`products`): `name`, `amount` (centavos).
  - `Transaction` (`transactions`): `client_id`, `gateway_id`, `external_id`, `status`, `amount`, `card_last_numbers`, `idempotency_key`.
  - `TransactionProduct` (`transaction_products`): `transaction_id`, `product_id`, `quantity`.
- Criar migrations com índices e constraints necessárias (e.g. `users.email` único, enum de `status`).
- Criar seeds para:
  - Usuário ADMIN padrão.
  - Gateways mock (Gateway 1 e Gateway 2) com URLs e configurações iniciais.
  - Produtos de exemplo.

### Fase 3 – Gateways e serviços de pagamento
- Definir interface `PaymentGateway` com métodos:
  - `charge(payload: ChargePayload): Promise<ChargeResult>`.
  - `refund(payload: RefundPayload): Promise<RefundResult>`.
- Criar tipos de resultado com distinção clara de erros:
  - `success: boolean`.
  - `type: 'business' | 'infra'`.
  - `code` (e.g. `CARD_DECLINED`, `INVALID_CVV`, `TIMEOUT`, `CONNECTION_ERROR`).
- Implementar:
  - `Gateway1AuthService` singleton:
    - Mantém token em memória.
    - Antes de cada chamada, garante token válido via `/login`.
    - Em `401 Unauthorized`, invalida token, renova e **re-tenta a chamada uma única vez**.
  - `Gateway1Service` (usa `Gateway1AuthService` e converte respostas do mock para o modelo `ChargeResult`/`RefundResult`).
  - `Gateway2Service` (usa headers fixos configuráveis via env).
- Implementar `GatewaySelectorService`:
  - Busca gateways ativos ordenados por `priority`.
  - Para cada gateway:
    - Se `ChargeResult.success = true`: retorna sucesso.
    - Se `success = false` e `type = 'infra'`: loga erro e tenta o **próximo gateway**.
    - Se `success = false` e `type = 'business'`: **não tenta o próximo gateway**, retorna erro de negócio.
- Implementar `PurchaseService`:
  - Recebe cliente (novo ou existente), lista de produtos + quantidades, dados de cartão e opcionalmente `idempotency_key`.
  - Calcula valor total com base na tabela `products`.
  - Aplica idempotência:
    - Se `idempotency_key` informado:
      - Busca transação recente para aquele cliente e chave (janela de tempo configurável, ex. 5 minutos).
      - Se encontrada, retorna o mesmo resultado sem reprocessar cobrança.
  - Inicia transação de banco:
    - Cria/associa `Client`.
    - Cria `Transaction` com status `PENDING` e valor total.
    - Persiste `TransactionProducts`.
  - **Segurança do cartão**:
    - `PurchaseValidator` recebe o número completo (`cardNumber`).
    - Dentro do `PurchaseService`, antes de persistir ou logar:
      - Extrai `cardLastNumbers = cardNumber.slice(-4)`.
      - Persiste apenas `card_last_numbers`.
      - Usa o número completo somente na chamada ao gateway, sem salvar ou logar.
  - Usa `GatewaySelectorService.charge` e atualiza `Transaction` com `status`, `gateway_id`, `external_id`.
- Implementar `RefundService`:
  - Garante que apenas roles autorizadas (e.g. FINANCE) possam reembolsar.
  - Verifica se a transação está `PAID` e ainda não foi `REFUNDED`.
  - Usa gateway original para reembolso (com `external_id` e formato do mock).
  - Atualiza status para `REFUNDED` em caso de sucesso.

### Fase 4 – Rotas, controllers e validação
- Rotas públicas:
  - `POST /login` (autenticação de usuários, retorna token).
  - `POST /purchase` (processa compra com produtos, cliente, cartão e opcional `idempotency_key`).
- Rotas privadas (JWT + middleware de roles):
  - Gateways:
    - `PATCH /gateways/:id/activate` / `:id/deactivate`.
    - `PATCH /gateways/:id/priority`.
  - Usuários:
    - CRUD completo com validação de roles (e.g. ADMIN/ MANAGER).
  - Produtos:
    - CRUD com validação de roles (MANAGER/FINANCE).
  - Clientes:
    - `GET /clients` e `GET /clients/:id` (detalhes + compras).
  - Transações:
    - `GET /transactions` e `GET /transactions/:id`.
    - `POST /transactions/:id/refund` (apenas FINANCE).
- Criar validators (VineJS ou equivalente) para:
  - Login.
  - Purchase (incluindo `idempotency_key` opcional).
  - CRUDs de usuário, produto, gateway.
- Configurar handler global de exceções para retornar JSON padronizado e não expor dados sensíveis.

### Fase 5 – TDD, Docker e documentação
- Testes:
  - Unitários para `PurchaseService`, `RefundService`, `GatewaySelectorService`, implementações de gateway e `Gateway1AuthService`.
  - Integração para rotas principais (`/login`, `/purchase`, CRUDs, reembolso).
  - Testes específicos para:
    - Fallback por erro de infraestrutura.
    - Não fallback em erro de negócio (cartão recusado/CVV inválido).
    - Idempotência com mesma `idempotency_key`.
- Docker:
  - `Dockerfile` da aplicação.
  - `docker-compose.yml` com:
    - `app` (Adonis).
    - `db` (MySQL).
    - `gateways-mock` (`matheusprotzen/gateways-mock`).
- Documentação:
  - Atualizar `README.md` do projeto com:
    - Requisitos.
    - Setup local e via Docker.
    - Rotas (públicas/privadas) e exemplos de payloads/respostas.
    - Explicação de autenticação, roles, idempotência e estratégia de fallback de gateways.

