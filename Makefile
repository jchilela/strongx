.PHONY: dev prod migrate worker test logs shell-db setup ssl

# Start all services in dev mode
dev:
	docker compose up -d

# Start production
prod:
	docker compose -f docker-compose.prod.yml up -d --build

# Stop all services
stop:
	docker compose down

# Run alembic migrations
migrate:
	docker compose exec backend alembic upgrade head

# Create a new alembic migration
migration:
	docker compose exec backend alembic revision --autogenerate -m "$(name)"

# Start ARQ workers
worker:
	docker compose exec backend python -m arq app.workers.settings.WorkerSettings

# Run tests
test:
	docker compose exec backend pytest tests/ -v

# Tail all logs
logs:
	docker compose logs -f

# psql into database
shell-db:
	docker compose exec postgres psql -U strongx -d strongx_db

# Shell into backend
shell-backend:
	docker compose exec backend bash

# Shell into frontend
shell-frontend:
	docker compose exec frontend sh

# Build only
build:
	docker compose build

# Install SSL certs (run once on server)
ssl:
	docker compose -f docker-compose.prod.yml run --rm certbot certonly \
		--webroot --webroot-path=/var/www/certbot \
		--email admin@strongx.it.ao \
		--agree-tos --no-eff-email \
		-d app.strongx.it.ao \
		-d api.strongx.it.ao

# Initial server setup (run once)
setup:
	apt-get update && apt-get install -y docker.io docker-compose-plugin git
	mkdir -p /opt/strongx
	git clone https://github.com/jchilela/strongx.git /opt/strongx
	cd /opt/strongx && cp .env.example .env
	@echo "Edit /opt/strongx/.env with your production values, then run: make prod"

# Prune docker images
prune:
	docker image prune -f
	docker volume prune -f

# View running containers
ps:
	docker compose ps
