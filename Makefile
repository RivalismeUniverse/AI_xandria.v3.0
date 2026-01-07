.PHONY: help
help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development
.PHONY: install
install: ## Install all dependencies
	pnpm install

.PHONY: dev
dev: ## Start development servers
	pnpm run dev

.PHONY: build
build: ## Build all packages
	pnpm run build

.PHONY: clean
clean: ## Clean build artifacts and node_modules
	pnpm run clean
	find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
	find . -name ".next" -type d -prune -exec rm -rf '{}' +
	find . -name "dist" -type d -prune -exec rm -rf '{}' +
	find . -name "target" -type d -prune -exec rm -rf '{}' +

# Testing
.PHONY: test
test: ## Run all tests
	pnpm run test

.PHONY: test-watch
test-watch: ## Run tests in watch mode
	pnpm run test --watch

.PHONY: test-coverage
test-coverage: ## Run tests with coverage
	pnpm run test --coverage

.PHONY: test-e2e
test-e2e: ## Run end-to-end tests
	cd apps/web && pnpm run test:e2e

# Linting & Formatting
.PHONY: lint
lint: ## Run linters
	pnpm run lint

.PHONY: lint-fix
lint-fix: ## Fix linting issues
	pnpm run lint --fix

.PHONY: format
format: ## Format code with prettier
	pnpm run format

.PHONY: type-check
type-check: ## Run TypeScript type checking
	pnpm run type-check

# Database
.PHONY: db-migrate
db-migrate: ## Run database migrations
	cd apps/api && pnpm run db:migrate

.PHONY: db-seed
db-seed: ## Seed database with initial data
	cd apps/api && pnpm run db:seed

.PHONY: db-reset
db-reset: ## Reset database (drop + migrate + seed)
	cd apps/api && pnpm run db:reset

.PHONY: db-studio
db-studio: ## Open Prisma Studio
	cd apps/api && pnpm run db:studio

# Solana Programs
.PHONY: build-programs
build-programs: ## Build Solana programs
	cd programs/persona-nft && anchor build
	cd programs/marketplace && anchor build
	cd programs/battle-arena && anchor build

.PHONY: test-programs
test-programs: ## Test Solana programs
	cd programs/persona-nft && anchor test
	cd programs/marketplace && anchor test
	cd programs/battle-arena && anchor test

.PHONY: deploy-programs-devnet
deploy-programs-devnet: ## Deploy programs to devnet
	cd programs/persona-nft && anchor deploy --provider.cluster devnet
	cd programs/marketplace && anchor deploy --provider.cluster devnet
	cd programs/battle-arena && anchor deploy --provider.cluster devnet

.PHONY: deploy-programs-mainnet
deploy-programs-mainnet: ## Deploy programs to mainnet
	@echo "⚠️  WARNING: Deploying to mainnet!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		cd programs/persona-nft && anchor deploy --provider.cluster mainnet; \
		cd programs/marketplace && anchor deploy --provider.cluster mainnet; \
		cd programs/battle-arena && anchor deploy --provider.cluster mainnet; \
	fi

# Docker
.PHONY: docker-up
docker-up: ## Start Docker containers
	docker-compose up -d

.PHONY: docker-down
docker-down: ## Stop Docker containers
	docker-compose down

.PHONY: docker-logs
docker-logs: ## Show Docker logs
	docker-compose logs -f

.PHONY: docker-rebuild
docker-rebuild: ## Rebuild and restart Docker containers
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d

# Deployment
.PHONY: deploy-dev
deploy-dev: ## Deploy to development environment
	./scripts/deploy-all.sh dev

.PHONY: deploy-staging
deploy-staging: ## Deploy to staging environment
	./scripts/deploy-all.sh staging

.PHONY: deploy-prod
deploy-prod: ## Deploy to production environment
	@echo "⚠️  WARNING: Deploying to production!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		./scripts/deploy-all.sh production; \
	fi

# Setup
.PHONY: setup-dev
setup-dev: install docker-up db-migrate db-seed ## Complete development setup
	@echo "✅ Development environment ready!"
	@echo "Run 'make dev' to start development servers"

.PHONY: setup-env
setup-env: ## Copy example environment files
	cp .env.example .env
	cp apps/web/.env.example apps/web/.env.local
	cp apps/api/.env.example apps/api/.env
	@echo "✅ Environment files created. Please update with your credentials."

# Monitoring
.PHONY: logs-api
logs-api: ## Show API logs
	docker-compose logs -f api

.PHONY: logs-web
logs-web: ## Show web logs
	docker-compose logs -f web

.PHONY: logs-db
logs-db: ## Show database logs
	docker-compose logs -f postgres
