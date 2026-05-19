# StrongX — SaaS Notification Platform

StrongX is a multi-channel notification API platform for Angolan businesses. It lets clients send SMS, Email, and WhatsApp messages through a unified REST API, manage budgets via an integrated wallet (topped up via AppyPay/GPO), and monitor delivery in a real-time dashboard.

---

## Architecture

```
                         Internet
                            |
                     [Nginx :80/:443]
                    /               \
        app.strongx.it.ao     api.strongx.it.ao
                |                     |
         [Next.js :3000]      [FastAPI :8000]
                                      |
                         +-----------+-----------+
                         |           |           |
                   [PostgreSQL]   [Redis]   [ARQ Worker]
                      :5432        :6379         |
                                           +-----+------+
                                           |            |
                                      TelcoSMS      Twilio
                                    (SMS/Angola)  (WA/Email)
                                                       |
                                                  AppyPay API
                                                (Wallet top-up)
```

### Services

| Service    | Image / Stack         | Port  | Role                                      |
|------------|-----------------------|-------|-------------------------------------------|
| nginx      | nginx:alpine          | 80/443| Reverse proxy, TLS termination, rate limit|
| frontend   | Next.js 14            | 3000  | Dashboard SPA (React + Tailwind)          |
| backend    | FastAPI (Python 3.11) | 8000  | REST API, WebSocket, auth, billing        |
| worker     | ARQ (Python)          | —     | Async task queue (send notifications)     |
| postgres   | PostgreSQL 15         | 5432  | Primary database                          |
| redis      | Redis 7               | 6379  | Task queue broker, cache, rate limiter    |
| certbot    | certbot/certbot       | —     | Auto-renew Let's Encrypt TLS certs        |

---

## Prerequisites

### Local Development
- Docker >= 24 and Docker Compose plugin (`docker compose`)
- Git
- VS Code with REST Client extension (optional, for `requests.http`)
- Node.js 20+ (only if running frontend outside Docker)
- Python 3.11+ (only if running backend outside Docker)

### Production Server
- Ubuntu 22.04 VPS (89.167.47.13)
- Root or sudo access
- DNS A records pointing:
  - `app.strongx.it.ao` → 89.167.47.13
  - `api.strongx.it.ao` → 89.167.47.13

---

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/jchilela/strongx.git
cd strongx
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in the required secrets. At minimum for local dev you need:

| Variable | What to set |
|---|---|
| `SECRET_KEY` | Any random 32+ char string |
| `JWT_SECRET_KEY` | Another random 32+ char string |
| `TELCOSMS_USERNAME` | Your TelcoSMS account username |
| `TELCOSMS_PASSWORD` | Your TelcoSMS account password |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `TWILIO_SENDGRID_API_KEY` | SendGrid API key (via Twilio) |
| `TWILIO_WHATSAPP_FROM` | Twilio WhatsApp sender number |

Database and Redis values are pre-filled for local Docker use — do not change them unless you run Postgres/Redis externally.

### 3. Start all services

```bash
make dev
# equivalent to: docker compose up -d
```

This starts Postgres, Redis, the FastAPI backend (with hot-reload), the ARQ worker, and the Next.js frontend (with hot-reload).

### 4. Run database migrations

```bash
make migrate
# equivalent to: docker compose exec backend alembic upgrade head
```

### 5. Verify services are running

```bash
make ps
curl http://localhost:8000/health
# Open http://localhost:3000 in your browser
```

### 6. Tail logs

```bash
make logs
# or for a specific service:
docker compose logs -f backend
```

---

## Production Deployment (Ubuntu 22.04)

### Step 1 — Provision the server

SSH into your VPS as root:

```bash
ssh root@89.167.47.13
```

### Step 2 — Install Docker and dependencies

```bash
apt-get update
apt-get install -y docker.io docker-compose-plugin git curl
systemctl enable docker
systemctl start docker
```

### Step 3 — Clone the repository

```bash
mkdir -p /opt/strongx
git clone https://github.com/jchilela/strongx.git /opt/strongx
cd /opt/strongx
```

### Step 4 — Configure the production environment file

```bash
cp .env.example .env
nano .env   # or use your preferred editor
```

Set every variable. Key production overrides:

```env
APP_ENV=production
DEBUG=false
SECRET_KEY=<generate with: openssl rand -hex 32>
JWT_SECRET_KEY=<generate with: openssl rand -hex 32>
POSTGRES_PASSWORD=<strong random password>
APPYPAY_WEBHOOK_TOKEN=<generate with: openssl rand -hex 32>
FRONTEND_URL=https://app.strongx.it.ao
API_URL=https://api.strongx.it.ao
```

### Step 5 — Obtain SSL certificates

The certbot container needs port 80 available and DNS to resolve before issuing certs.

First, start only Nginx in HTTP-only mode (temporarily comment out the HTTPS server blocks if needed), then:

```bash
make ssl
```

This runs:
```
certbot certonly --webroot --webroot-path=/var/www/certbot \
  --email admin@strongx.it.ao --agree-tos --no-eff-email \
  -d app.strongx.it.ao -d api.strongx.it.ao
```

Certs are stored in the `certbot_conf` Docker volume (mapped to `/etc/letsencrypt` inside containers). Certbot auto-renews every 12 hours.

### Step 6 — Start production stack

```bash
make prod
# equivalent to: docker compose -f docker-compose.prod.yml up -d --build
```

### Step 7 — Run migrations

```bash
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

### Step 8 — Verify

```bash
curl -f https://api.strongx.it.ao/health
# Should return: {"status": "ok"}
```

Open `https://app.strongx.it.ao` in a browser.

---

## SSL Setup — Detailed

SSL is handled by Let's Encrypt via the `certbot` service in `docker-compose.prod.yml`.

### First-time certificate issuance

Ensure DNS is pointing to the server and port 80 is open, then:

```bash
cd /opt/strongx
make ssl
```

### Certificate renewal

The certbot container runs an infinite loop renewing every 12 hours automatically. Nginx reloads the updated certificates without downtime.

To force manual renewal:

```bash
docker compose -f docker-compose.prod.yml run --rm certbot renew
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

### Certificate paths inside Nginx container

| Domain | Certificate | Key |
|---|---|---|
| `app.strongx.it.ao` | `/etc/letsencrypt/live/app.strongx.it.ao/fullchain.pem` | `/etc/letsencrypt/live/app.strongx.it.ao/privkey.pem` |
| `api.strongx.it.ao` | `/etc/letsencrypt/live/api.strongx.it.ao/fullchain.pem` | `/etc/letsencrypt/live/api.strongx.it.ao/privkey.pem` |

---

## GitHub Actions — CI/CD

The workflow in `.github/workflows/deploy.yml` runs on every push to `main`:

1. **test** — spins up Postgres + Redis service containers, installs Python deps, runs `pytest`
2. **build-frontend** — installs Node deps, runs `npm run build`
3. **deploy** (only if test + build pass):
   - SSHes into the server
   - Writes `.env` from GitHub Secrets
   - Pulls latest code, rebuilds Docker images, runs migrations
   - Performs a health check against `https://api.strongx.it.ao/health`

### GitHub Secrets to configure

Go to `https://github.com/jchilela/strongx/settings/secrets/actions` and add:

| Secret | Description |
|---|---|
| `SERVER_SSH_KEY` | Private SSH key for root@89.167.47.13 (contents of `~/.ssh/id_rsa`) |
| `SERVER_HOST` | `89.167.47.13` |
| `SERVER_USER` | `root` |
| `SECRET_KEY` | App secret key (random 32+ hex string) |
| `JWT_SECRET_KEY` | JWT signing key (random 32+ hex string) |
| `DATABASE_URL` | `postgresql+asyncpg://strongx:<pass>@postgres:5432/strongx_db` |
| `REDIS_URL` | `redis://redis:6379` |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `TELCOSMS_USERNAME` | TelcoSMS account username |
| `TELCOSMS_PASSWORD` | TelcoSMS account password |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `TWILIO_SENDGRID_API_KEY` | SendGrid API key |
| `TWILIO_WHATSAPP_FROM` | Twilio WhatsApp from number |
| `APPYPAY_TOKEN_URL` | AppyPay OAuth2 token URL |
| `APPYPAY_CLIENT_ID` | AppyPay client ID |
| `APPYPAY_CLIENT_SECRET` | AppyPay client secret |
| `APPYPAY_RESOURCE` | AppyPay resource ID |
| `APPYPAY_BASE_URL` | AppyPay gateway base URL |
| `APPYPAY_PAYMENT_METHOD_GPO` | AppyPay GPO payment method ID |
| `APPYPAY_PAYMENT_METHOD_REFERENCE` | AppyPay reference payment method ID |
| `APPYPAY_WEBHOOK_TOKEN` | Secret for validating AppyPay webhook calls |
| `NEXT_PUBLIC_API_URL` | `https://api.strongx.it.ao` |
| `NEXT_PUBLIC_WS_URL` | `https://api.strongx.it.ao` |

### Generating a deploy SSH key

On your local machine:

```bash
ssh-keygen -t ed25519 -C "strongx-deploy" -f ~/.ssh/strongx_deploy
# Copy public key to server:
ssh-copy-id -i ~/.ssh/strongx_deploy.pub root@89.167.47.13
# Add private key contents to GitHub Secret SERVER_SSH_KEY:
cat ~/.ssh/strongx_deploy
```

---

## API Documentation Overview

Interactive docs are available at `https://api.strongx.it.ao/docs` (Swagger UI) and `/redoc`.

### Authentication

StrongX uses two authentication schemes:

| Scheme | Header | Used for |
|---|---|---|
| JWT Bearer | `Authorization: Bearer <jwt_token>` | Dashboard / user-facing endpoints |
| API Key | `Authorization: Bearer strx_<api_key>` | Sending notifications (server-to-server) |

### Core Endpoints

#### Health

```bash
curl https://api.strongx.it.ao/health
# Response: {"status": "ok", "version": "1.0.0"}
```

#### Register

```bash
curl -X POST https://api.strongx.it.ao/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "João Silva",
    "email": "joao@example.com",
    "phone": "+244923456789",
    "password": "Secure@Pass123!"
  }'
```

#### Login

```bash
curl -X POST https://api.strongx.it.ao/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "joao@example.com", "password": "Secure@Pass123!"}'
# Response: {"access_token": "...", "refresh_token": "...", "token_type": "bearer"}
```

#### Send SMS

```bash
curl -X POST https://api.strongx.it.ao/v1/sms/send \
  -H "Authorization: Bearer strx_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "244923456789",
    "message": "Hello from StrongX!",
    "applicationId": "YOUR_APPLICATION_UUID"
  }'
# Response: {"success": true, "data": {"messageId": "...", "status": "queued"}}
```

The `applicationId` field is optional. If omitted, the application bound to the API key is used automatically. Each application has its own TelcoSMS API key — the worker resolves the correct key at send time. Both `applicationId` (camelCase) and `application_id` (snake_case) are accepted.

#### Send Email

```bash
curl -X POST https://api.strongx.it.ao/v1/email/send \
  -H "Authorization: Bearer strx_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "recipient@example.com",
    "subject": "Hello",
    "body_html": "<p>Hello from <strong>StrongX</strong>!</p>",
    "body_text": "Hello from StrongX!",
    "applicationId": "YOUR_APPLICATION_UUID"
  }'
```

#### Send WhatsApp

```bash
curl -X POST https://api.strongx.it.ao/v1/whatsapp/send \
  -H "Authorization: Bearer strx_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+244923456789",
    "message": "Hello via WhatsApp!",
    "applicationId": "YOUR_APPLICATION_UUID"
  }'
```

#### Wallet Balance

```bash
curl https://api.strongx.it.ao/wallet/balance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
# Response: {"balance": 4500.00, "currency": "AOA"}
```

#### Top Up Wallet (AppyPay Reference)

```bash
curl -X POST https://api.strongx.it.ao/wallet/topup \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 5000.00, "method": "reference", "name": "João Silva", "email": "joao@example.com"}'
# Response: {"reference": "REF123456789", "amount": 5000.00, "expires_at": "..."}
```

#### Create API Key

```bash
curl -X POST https://api.strongx.it.ao/developer/keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Production Key"}'
# Response: {"key": "strx_...", "name": "Production Key", "created_at": "..."}
```

### Per-Application TelcoSMS Keys

Each application on the platform has its own TelcoSMS API key set by the admin at approval time. When a message is sent:

1. If `applicationId` is provided in the request body → that application's key is used.
2. If `applicationId` is omitted → the key bound to the authenticating API key's application is used.
3. If neither resolves → falls back to the global `TELCOSMS_API_KEY` setting.

Resolution is logged in the `sms_send_logs` table and visible in the admin panel at `/admin/sms-logs`.

Every new user automatically gets a default **APP-TESTE** application (pre-approved, using the platform's default TelcoSMS key) so they can start sending immediately.

### Notification Pricing

| Channel  | Cost per unit |
|----------|--------------|
| SMS      | 5.00 AOA     |
| Email    | 1.00 AOA     |
| WhatsApp | 8.00 AOA     |

Costs are deducted from the user's wallet in real time. If balance is insufficient, the API returns `402 Payment Required`.

### Admin Panel

The admin panel is accessible at `/admin` for users with `isAdmin = true`. Super admins (`isSuperAdmin = true`) additionally have delete access.

| Page | URL | Description |
|---|---|---|
| Users | `/admin/users` | List all users, manage roles, pricing, wallet funds, API keys, reset passwords |
| Applications | `/admin/applications` | Review, approve (with TelcoSMS key), reject, edit keys for all applications |
| Earnings | `/admin/earnings` | Revenue charts (daily/monthly/yearly) and top users |
| SMS Logs | `/admin/sms-logs` | Per-message log of which TelcoSMS key was used and how it was resolved |

#### Roles

| Role | `isAdmin` | `isSuperAdmin` | Capabilities |
|---|---|---|---|
| User | false | false | Send messages, manage own applications and API keys |
| Admin | true | false | Full admin panel: approve/reject apps, manage users, view earnings and SMS logs |
| Super Admin | true | true | All admin capabilities + delete users and applications |

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `APP_NAME` | No | `StrongX` | Application name |
| `APP_ENV` | No | `development` | `development`, `production`, or `testing` |
| `SECRET_KEY` | Yes | — | Flask/FastAPI secret key for session signing |
| `DEBUG` | No | `true` | Enable debug mode (disable in production) |
| `DATABASE_URL` | Yes | — | Async PostgreSQL DSN (`postgresql+asyncpg://...`) |
| `REDIS_URL` | Yes | — | Redis DSN (`redis://host:port`) |
| `JWT_SECRET_KEY` | Yes | — | HMAC key for signing JWT tokens |
| `JWT_ALGORITHM` | No | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `15` | Access token TTL in minutes |
| `REFRESH_TOKEN_EXPIRE_DAYS` | No | `7` | Refresh token TTL in days |
| `TELCOSMS_URL` | Yes | — | TelcoSMS API endpoint |
| `TELCOSMS_USERNAME` | Yes | — | TelcoSMS account username |
| `TELCOSMS_PASSWORD` | Yes | — | TelcoSMS account password |
| `TELCOSMS_FROM` | No | `StrongX` | SMS sender name |
| `TWILIO_ACCOUNT_SID` | Yes | — | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Yes | — | Twilio Auth Token |
| `TWILIO_SENDGRID_API_KEY` | Yes | — | SendGrid API key for email delivery |
| `TWILIO_WHATSAPP_FROM` | Yes | — | Twilio WhatsApp sender (e.g. `whatsapp:+14155238886`) |
| `APPYPAY_TOKEN_URL` | Yes | — | AppyPay OAuth2 token endpoint |
| `APPYPAY_CLIENT_ID` | Yes | — | AppyPay client ID |
| `APPYPAY_CLIENT_SECRET` | Yes | — | AppyPay client secret |
| `APPYPAY_RESOURCE` | Yes | — | AppyPay resource UUID |
| `APPYPAY_BASE_URL` | Yes | — | AppyPay gateway base URL |
| `APPYPAY_PAYMENT_METHOD_GPO` | Yes | — | AppyPay GPO payment method ID |
| `APPYPAY_PAYMENT_METHOD_REFERENCE` | Yes | — | AppyPay reference payment method ID |
| `APPYPAY_WEBHOOK_TOKEN` | Yes | — | Secret to validate AppyPay webhooks |
| `FRONTEND_URL` | Yes | — | Public URL of the dashboard |
| `API_URL` | Yes | — | Public URL of the API |
| `SMS_COST_PER_UNIT` | No | `5.00` | Cost per SMS in AOA |
| `EMAIL_COST_PER_UNIT` | No | `1.00` | Cost per email in AOA |
| `WHATSAPP_COST_PER_UNIT` | No | `8.00` | Cost per WhatsApp message in AOA |
| `ADMIN_PASSWORD` | No | — | Password for the seeded admin user |
| `NEXT_PUBLIC_API_URL` | Yes | — | API URL exposed to Next.js browser bundle |
| `NEXT_PUBLIC_WS_URL` | Yes | — | WebSocket URL exposed to Next.js browser bundle |
| `NEXT_PUBLIC_APP_NAME` | No | `StrongX` | App name shown in the browser UI |
| `POSTGRES_USER` | No | `strongx` | PostgreSQL username (used in prod compose) |
| `POSTGRES_PASSWORD` | Yes (prod) | — | PostgreSQL password (used in prod compose) |
| `POSTGRES_DB` | No | `strongx_db` | PostgreSQL database name |

---

## Makefile Commands Reference

| Command | Description |
|---|---|
| `make dev` | Start all services in development mode (hot-reload) |
| `make prod` | Build and start all services in production mode |
| `make stop` | Stop and remove all containers |
| `make build` | Build Docker images without starting |
| `make migrate` | Run pending Alembic migrations |
| `make migration name=<msg>` | Generate a new Alembic migration |
| `make worker` | Start ARQ worker inside the backend container |
| `make test` | Run pytest inside the backend container |
| `make logs` | Tail logs from all containers |
| `make shell-db` | Open a psql session in the database |
| `make shell-backend` | Open a bash session in the backend container |
| `make shell-frontend` | Open a sh session in the frontend container |
| `make ssl` | Issue/renew Let's Encrypt certificates via certbot |
| `make setup` | One-time server bootstrap (installs Docker, clones repo) |
| `make prune` | Remove unused Docker images and volumes |
| `make ps` | Show running containers and their status |

---

## Troubleshooting

### Containers fail to start — port already in use

```
Error: Bind for 0.0.0.0:5432 failed: port is already allocated
```

Stop any local Postgres/Redis/Node instances:

```bash
sudo systemctl stop postgresql redis-server
# Then retry:
make dev
```

### Backend cannot connect to database

Check that the `postgres` service is healthy:

```bash
docker compose ps
docker compose logs postgres
```

If Postgres is healthy but backend still fails, verify `DATABASE_URL` in `.env` uses the Docker service hostname (`postgres`), not `localhost`.

### Migrations fail with "relation already exists"

The database has a partial schema from a failed run. Reset it (dev only — data will be lost):

```bash
docker compose down -v   # removes volumes
make dev
make migrate
```

### SSL certificate issuance fails

1. Verify DNS has propagated: `dig app.strongx.it.ao` should return `89.167.47.13`.
2. Ensure port 80 is accessible from the internet (no firewall blocking it).
3. Check certbot logs: `docker compose -f docker-compose.prod.yml logs certbot`.

### Nginx returns 502 Bad Gateway

The upstream service (backend or frontend) is not healthy. Check:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs backend
```

### ARQ worker is not processing tasks

Verify Redis is running and the `REDIS_URL` is correct:

```bash
docker compose exec redis redis-cli ping   # should return PONG
docker compose logs worker
```

### GitHub Actions deploy fails at SSH step

1. Ensure `SERVER_SSH_KEY` secret contains the **private** key (starts with `-----BEGIN OPENSSH PRIVATE KEY-----`).
2. The corresponding public key must be in `/root/.ssh/authorized_keys` on the server.
3. Check if `ssh-keyscan` can reach the server from GitHub runners (no firewall blocking port 22).

### SMS not sending

1. Check TelcoSMS credentials in `.env`.
2. Look at the ARQ worker logs for error messages: `docker compose logs worker`.
3. Verify the phone number format — TelcoSMS expects numbers without the leading `+` (e.g. `244923456789`).

### AppyPay webhook not received

1. Ensure `APPYPAY_WEBHOOK_TOKEN` matches what is configured in the AppyPay portal.
2. Verify the webhook URL is set to `https://api.strongx.it.ao/webhooks/appypay` in the AppyPay dashboard.
3. Check Nginx logs for incoming webhook POST requests: `docker compose logs nginx`.

### Out of disk space on the server

Clean up unused Docker artifacts:

```bash
make prune
# or manually:
docker system prune -af --volumes
```

---

## Project Structure

```
strongx/
├── .env.example                  # Environment variable template
├── .gitignore
├── .github/
│   └── workflows/
│       └── deploy.yml            # CI/CD pipeline
├── Makefile                      # Dev/ops shortcuts
├── docker-compose.yml            # Development stack
├── docker-compose.prod.yml       # Production stack
├── requests.http                 # VS Code REST Client samples
├── nginx/
│   └── nginx.conf                # Reverse proxy config
├── backend/                      # FastAPI application
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/
│   └── app/
│       ├── main.py
│       ├── models/
│       ├── routers/
│       ├── services/
│       ├── workers/
│       └── core/
└── frontend/                     # Next.js dashboard
    ├── Dockerfile
    ├── Dockerfile.dev
    ├── package.json
    └── src/
```

---

## License

Proprietary — all rights reserved. Contact admin@strongx.it.ao.
