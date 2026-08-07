# Minhas Finanças

Personal finance tracker — expenses, income, investments, recurring bills,
and a small dashboard. Go API + React (Vite) frontend + Postgres.

## Local development

Prerequisites: Go, Node.js, and a Postgres database (a free
[Supabase](https://supabase.com) project works, or run one locally —
`docker run -e POSTGRES_PASSWORD=devpassword -e POSTGRES_DB=finance_app -p 5432:5432 postgres:16-alpine`).

```bash
cd backend
cp .env.example .env        # fill in DATABASE_URL
go run ./cmd/migrate up     # create the schema
go run ./cmd/api            # http://localhost:9080
```

```bash
cd frontend
cp .env.example .env        # defaults already point at localhost:9080
npm install
npm run dev                 # http://localhost:5173
```

Leave `APP_PASSWORD` blank in `backend/.env` for zero-friction local dev —
every request is allowed through unchecked and the frontend skips the
login screen entirely. See `backend/.env.example` for what each variable
does.

## Deploy your own copy

Everything below runs on tiers that don't ask for a credit card — if you
outgrow them the app just pauses, it never surprise-bills you.

1. **Database — [Supabase](https://supabase.com)**
   Create a free project. Under Project Settings → Database → Connection
   string, copy the URI (the "Transaction pooler" variant if offered).
   That's your `DATABASE_URL`.

2. **API — [Render](https://render.com)**, free Web Service
   - Root directory: `backend`
   - Build command: `go build -o bin/api ./cmd/api`
   - Start command: `./bin/api`
   - Environment variables: `DATABASE_URL` (from step 1), `FRONTEND_URL`
     (the Cloudflare Pages URL from step 3 — circle back and set this
     after step 3 exists), and optionally `APP_PASSWORD` +
     `APP_TOKEN_SECRET` (generate the latter with `openssl rand -hex 32`)
     to require a password. Leave `PORT` unset — Render provides it.
   - Once it's deployed, run the migration once against the live database:
     locally, `DATABASE_URL=<the Render one> go run ./cmd/migrate up`.

3. **Frontend — [Cloudflare Pages](https://pages.cloudflare.com)**
   - Root directory: `frontend`
   - Build command: `npm run build`
   - Output directory: `dist`
   - Environment variable: `VITE_API_URL` = your Render service's URL
     (from step 2).

4. Go back to Render and set `FRONTEND_URL` to the Cloudflare Pages URL
   from step 3, so CORS allows it.

Every push to `main` redeploys both automatically — open the app from
your phone or your computer and you're always looking at the same,
already-current data.
