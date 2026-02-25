# =============================================================================
# Fintech Platform — Makefile
# =============================================================================

.PHONY: up down restart logs build ps clean nuke \
        up-infra up-services migrate seed

# -----------------------------------------------------------------------------
# Stack completa
# -----------------------------------------------------------------------------

up: ## Sobe tudo (infra + serviços)
	docker-compose up -d
	@echo ""
	@echo "✅  Stack rodando:"
	@echo "   API Gateway   → http://localhost:3000"
	@echo "   Grafana       → http://localhost:3000  (admin / admin)"
	@echo "   Prometheus    → http://localhost:9090"
	@echo "   Jaeger UI     → http://localhost:16686"
	@echo "   Kafka UI      → http://localhost:8085"
	@echo "   Redis UI      → http://localhost:8086"
	@echo ""

down: ## Para e remove containers (mantém volumes)
	docker-compose down

restart: down up ## Reinicia tudo

# -----------------------------------------------------------------------------
# Build
# -----------------------------------------------------------------------------

build: ## Builda todas as imagens
	docker-compose build --parallel

build-service: ## Builda serviço específico: make build-service s=auth-service
	docker-compose build $(s)

# -----------------------------------------------------------------------------
# Infra e serviços separados
# -----------------------------------------------------------------------------

up-infra: ## Sobe apenas infra (postgres, redis, kafka, observabilidade)
	docker-compose up -d postgres redis zookeeper kafka kafka-ui kafka-init \
		otel-collector jaeger prometheus grafana redis-commander

up-services: ## Sobe apenas os microserviços (infra deve já estar rodando)
	docker-compose up -d auth-service account-service wallet-service \
		exchange-service api-gateway

# -----------------------------------------------------------------------------
# Banco de dados
# -----------------------------------------------------------------------------

migrate: ## Roda migrations em todos os serviços
	docker-compose exec auth-service    pnpm db:migrate
	docker-compose exec account-service pnpm db:migrate
	docker-compose exec wallet-service  pnpm db:migrate
	docker-compose exec exchange-service pnpm db:migrate

# -----------------------------------------------------------------------------
# Logs
# -----------------------------------------------------------------------------

logs: ## Logs de todos os serviços
	docker-compose logs -f --tail=50

logs-svc: ## Logs de serviço específico: make logs-svc s=auth-service
	docker-compose logs -f --tail=100 $(s)

# -----------------------------------------------------------------------------
# Utilitários
# -----------------------------------------------------------------------------

ps: ## Status dos containers
	docker-compose ps

clean: ## Para containers e remove volumes (CUIDADO: apaga dados)
	docker-compose down -v

nuke: ## Apaga tudo incluindo imagens buildadas
	docker-compose down -v --rmi local

health: ## Checa health de todos os serviços
	@echo "→ api-gateway"
	@curl -sf http://localhost:3000/health | jq . || echo "❌ offline"
	@echo "→ auth-service"
	@curl -sf http://localhost:3001/health | jq . || echo "❌ offline"
	@echo "→ account-service"
	@curl -sf http://localhost:3002/health | jq . || echo "❌ offline"
	@echo "→ wallet-service"
	@curl -sf http://localhost:3003/health | jq . || echo "❌ offline"
	@echo "→ exchange-service"
	@curl -sf http://localhost:3004/health | jq . || echo "❌ offline"

help: ## Lista todos os comandos
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'