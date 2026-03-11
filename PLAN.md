# Sistema Gerenciador de Pagamentos Multi-Gateway (Adonis 5+)

Plano de implementação em fases. Validação do usuário antes de cada fase.

## Fases

### Fase 1 – Setup do projeto e infra básica (concluída)
- Projeto Adonis 5+ na raiz
- MySQL configurado via env (config/database.ts, env.ts, .env.example)
- Scripts: dev, build, start, test. Teste de fumaça (node ace test)
- Dockerfile e docker-compose.yml (app, db; gateways-mock comentado)

### Fase 2 – Domínio e persistência
- Models: User, Gateway, Client, Product, Transaction, TransactionProduct
- Migrations e seeds (ADMIN, gateways mock, produtos)
- Registrar Lucid e usar MySQL

### Fase 3 – Gateways e serviços de pagamento
- Interface PaymentGateway; tipos success/type (business|infra)
- Gateway1AuthService (singleton, token + retry em 401)
- Gateway1Service, Gateway2Service, GatewaySelectorService (fallback só em erro infra)
- PurchaseService (cálculo, idempotency_key, card_last_numbers só últimos 4)
- RefundService

### Fase 4 – Rotas, controllers e validação
- Rotas públicas: POST /login, POST /purchase
- Rotas privadas (JWT + roles): gateways, users, products, clients, transactions, refund
- Validators (VineJS ou equivalente), handler de exceções JSON

### Fase 5 – TDD, Docker e documentação
- Testes unitários e de integração; gateways-mock no compose
- README com requisitos, instalação, rotas e exemplos

## Ajustes de engenharia
- Resiliência Gateway 1: retry único em 401 após renovar token
- card_last_numbers: nunca persistir número completo; masking no PurchaseService
- Fallback: só em erro de infraestrutura; erro de negócio não tenta próximo gateway
- Idempotência: idempotency_key opcional na compra (janela ~5 min)
