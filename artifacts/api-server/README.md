## API Server (Express + Postgres/Drizzle)

This package is the backend API for RecycleRight Pakistan.

### What’s implemented (current “final” feature set)

- **Health**: `GET /api/healthz`
- **Auth (bcrypt + 24h JWT)**:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
- **Pickups (household)**:
  - `POST /api/pickups`
  - `GET /api/pickups/mine`
  - `GET /api/pickups/:id`
- **Jobs (collector)**:
  - `GET /api/jobs/nearby?lat&lng&radiusKm`
  - `POST /api/pickups/:id/accept`
  - `POST /api/pickups/:id/weight`
  - `POST /api/pickups/:id/complete` (generates receipt + deletes pickup location for privacy)
- **Receipts**: `GET /api/receipts/:pickupId`
- **Collector earnings**: `GET /api/collectors/me/earnings?range=daily|weekly`

All request/response shapes are validated using Zod schemas generated from the OpenAPI spec (`@workspace/api-zod`).

---

### Prerequisites

- **Node.js**: 24+
- **pnpm**: 9+
- **PostgreSQL**: running locally (or a hosted instance)

---

### Environment variables

Create a repo-root `.env` (not inside this folder). Start by copying:

```bash
cp .env.example .env
```

Required values:

- **`DATABASE_URL`**: used by `@workspace/db`
- **`PORT`**: the HTTP port this server listens on
- **`JWT_SECRET`**: used to sign/verify JWTs (required for any auth-protected route)

---

### Setup (first time)

From the repo root:

```bash
pnpm install
```

Push the database schema (dev workflow):

```bash
pnpm --filter @workspace/db run push
```

---

### Start the backend server

From the repo root:

```bash
pnpm --filter @workspace/api-server run dev
```

Server base URL:

- `http://localhost:$PORT/api`

---

### Quick test (curl)

Health:

```bash
curl -sS "http://localhost:$PORT/api/healthz"
```

Register + login:

```bash
curl -sS -X POST "http://localhost:$PORT/api/auth/register" \
  -H "content-type: application/json" \
  -d '{"name":"Collector 1","email":"collector1@example.com","password":"password123","role":"collector"}'

curl -sS -X POST "http://localhost:$PORT/api/auth/login" \
  -H "content-type: application/json" \
  -d '{"email":"collector1@example.com","password":"password123"}'
```

Use the returned token:

```bash
TOKEN="paste_token_here"
curl -sS "http://localhost:$PORT/api/auth/me" -H "authorization: Bearer $TOKEN"
```

RUN THE SERVER IN FOLLOWING WAY
cp .env.example .env
pnpm install
pnpm --filter @workspace/db run push
pnpm --filter @workspace/api-server run dev
