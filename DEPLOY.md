# Production deployment (systemd, no Docker)

Backend runs as a systemd service (Node), frontend is a static build served by nginx,
which also reverse-proxies `/api` and `/ws` to the backend. Postgres is the existing
Docker container already running on the host.

Assumes repo lives at `/opt/chartdb` and domain `chartdb.dolphin.com.np` is already
pointed at this host. Adjust paths/domain as needed.

## 0. Prereqs

- Node 24.x on the host (`node -v`)
- nginx installed, domain's DNS already pointing here
- Postgres container reachable from the host network. Check it publishes a port:
  `docker port <pg_container>` -- if nothing listed, add `-p 127.0.0.1:5432:5432`
  to that container's run config and recreate it.

## 1. Backend

```bash
cd /opt/chartdb/server
npm ci
cp .env.example .env
```

Edit `.env`:
```
NODE_ENV=production
DATABASE_URL=postgresql://<pg_user>:<pg_pass>@localhost:5432/<pg_db>?schema=public
BOOTSTRAP_ADMIN_EMAIL=you@dolphin.com.np
BOOTSTRAP_ADMIN_PASSWORD=<strong one>
COOKIE_SECURE=          # leave blank -- nginx terminates TLS below
```

```bash
npx prisma generate
npm run build            # -> dist/src/index.js
```

Install the service:
```bash
sudo useradd --system --no-create-home chartdb   # if it doesn't exist yet
sudo chown -R chartdb:chartdb /opt/chartdb
sudo cp deploy/chartdb-server.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now chartdb-server
sudo systemctl status chartdb-server
curl http://127.0.0.1:3001/api/health   # {"status":"ok"}
```

`ExecStartPre` runs `prisma migrate deploy` on every start, so schema is always current
before the process comes up.

## 2. Frontend

```bash
cd /opt/chartdb
cp .env.example .env
npm ci
npm run build             # -> dist/
```

## 3. nginx

```bash
sudo cp deploy/chartdb.nginx.conf /etc/nginx/sites-available/chartdb.dolphin.com.np
sudo ln -s /etc/nginx/sites-available/chartdb.dolphin.com.np /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d chartdb.dolphin.com.np
```

Certbot rewrites the `listen` directive to 443 with TLS. Once that's done, visit
`https://chartdb.dolphin.com.np`, log in with the bootstrap admin, and confirm in
DevTools → Application → Cookies that `chartdb_sid` has `Secure` set.

## Updating

```bash
cd /opt/chartdb && git pull

cd server && npm ci && npx prisma generate && npm run build
sudo systemctl restart chartdb-server

cd .. && npm ci && npm run build   # nginx serves the new dist/ immediately
```
