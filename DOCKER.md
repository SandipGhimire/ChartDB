# Production Docker deployment

Two images: `app` (nginx + built frontend, reverse-proxies `/api` and `/ws`) and `server`
(Node/Express API + WebSocket, runs Prisma migrations on boot). No Postgres container is
included here — point `DATABASE_URL` at your existing one.

## Setup

```bash
cp .env.example .env
# edit .env: DATABASE_URL, BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD
```

If your Postgres container is on its own Docker network, uncomment the `postgres_net`
block in `docker-compose.yml` (both under `server.networks` and top-level `networks`),
set it to that network's name, and reference the Postgres container by name in
`DATABASE_URL` (e.g. `postgresql://user:pass@postgres:5432/chartdb`). Otherwise point
`DATABASE_URL` at whatever host:port already reaches it (e.g. `host.docker.internal`).

```bash
docker compose up -d --build
```

`server` runs `prisma migrate deploy` before starting, so schema is applied automatically
on first boot and every subsequent deploy. The first user is created from
`BOOTSTRAP_ADMIN_EMAIL`/`BOOTSTRAP_ADMIN_PASSWORD` only when the users table is empty.

App is served on `${HTTP_PORT:-80}`.

## HTTPS

The session cookie is `Secure` by default in production, so it only survives over HTTPS.
Put a TLS-terminating reverse proxy (Caddy, Traefik, existing nginx, etc.) in front of the
`app` container. If you genuinely have no TLS anywhere in front of this (e.g. purely
internal network), set `COOKIE_SECURE=false` in `.env` or login will silently fail
(the browser drops the cookie).

## Updating

```bash
git pull
docker compose up -d --build
```

Migrations run automatically on `server` startup; no manual step needed.
