# WishWall

Group greeting cards on the web. Create a board for someone (birthday, farewell,
get well soon…), share a link so friends can post messages, photos and GIFs,
then reveal it as an animated card or download it as a PDF.

**Stack:** Next.js 16 (App Router, Cache Components) · TypeScript (strict) ·
Tailwind CSS 4 + shadcn/ui · Framer Motion · Auth.js v5 (Google) · Prisma 7 +
PostgreSQL · Zod · Vitest + Playwright.

> Status: **Phase 1 (project setup)** complete. See [PROJECT-BRIEF.md](PROJECT-BRIEF.md)
> for the full plan.

## Prerequisites

- Node.js 20.9+ (developed on 24)
- pnpm 10+ (`corepack enable` or `npm i -g pnpm`)
- A PostgreSQL database: a free [Neon](https://neon.tech) project (recommended),
  or Docker for a local one

## Getting started

### 1. Install

```bash
pnpm install          # also runs `prisma generate`
cp .env.example .env
```

### 2. Create a database

**Neon (recommended, free):**

The project uses a Neon project called `wishwall` (AWS London, Postgres 18)
with the default `neondb` database and two branches: `production` (for the
deployed app) and `development` (for local work, so experiments never touch
production data). Both fit in the free tier.

To get the connection strings for a fresh checkout, either:

- **Dashboard:** open the project → select the `development` branch →
  **Connect**. Copy the **pooled** string (host contains `-pooler`) into
  `DATABASE_URL`, then turn off "Connection pooling" and copy that string into
  `DIRECT_URL`.
- **CLI:** `pnpm dlx neonctl auth`, then
  `pnpm dlx neonctl connection-string development --pooled` (and again without
  `--pooled` for `DIRECT_URL`).

Change `sslmode=require` to `sslmode=verify-full` in both strings; the `pg`
driver warns otherwise and keeps full certificate checks this way.

Starting from scratch? Create a project at [neon.tech](https://neon.tech), then
add a `development` branch under Branches → New branch.

**Or local Docker:**

```bash
docker compose up -d
# in .env, set both DATABASE_URL and DIRECT_URL to:
# postgresql://wishwall:wishwall@localhost:5432/wishwall
```

### 3. Create the tables

```bash
pnpm db:deploy        # applies prisma/migrations to the database
```

### 4. Run

```bash
pnpm dev
```

Open <http://localhost:3000>. Check the database connection at
<http://localhost:3000/api/health>; it should return
`{"status":"ok","database":"ok"}`.

The `AUTH_*` values in `.env` can stay as placeholders until Phase 2 adds
Google sign-in.

## Scripts

| Command            | What it does                                            |
| ------------------ | ------------------------------------------------------- |
| `pnpm dev`         | Dev server (Turbopack) on port 3000                     |
| `pnpm build`       | Production build                                        |
| `pnpm start`       | Serve the production build                              |
| `pnpm lint`        | ESLint                                                  |
| `pnpm typecheck`   | Generate Next route types, then `tsc --noEmit`          |
| `pnpm format`      | Prettier (writes); `pnpm format:check` to verify only   |
| `pnpm test`        | Vitest unit tests (`pnpm test:watch` for watch mode)    |
| `pnpm db:migrate`  | Create + apply a new migration after editing the schema |
| `pnpm db:deploy`   | Apply pending migrations (CI / production)              |
| `pnpm db:studio`   | Browse the database in Prisma Studio                    |
| `pnpm db:generate` | Regenerate the Prisma client                            |

## Environment variables

Every variable is documented in [.env.example](.env.example) and validated at
startup by [src/lib/env.ts](src/lib/env.ts), so a missing value fails with a
clear message instead of a runtime surprise.

## Project structure

```
prisma/
  schema.prisma          database schema (Auth.js models + Board, Message, RateLimit)
  migrations/            SQL migrations (committed)
prisma.config.ts         Prisma CLI config (connection URL, migrations path)
src/
  app/                   routes (App Router)
    api/health/          DB connectivity check
  components/ui/         shadcn/ui primitives
  generated/prisma/      generated Prisma client (git-ignored)
  lib/                   shared helpers: env validation, slugs, utils
  server/                server-only code: db client (more in later phases)
tests/unit/              Vitest tests
```

Later phases add `src/templates/` (one config file per card template),
`src/server/{actions,services,storage}`, and the `dashboard` / `board/[slug]`
routes.

## Notes

- **Privacy:** boards are reachable only by their 32-character random links.
  `/board/*`, `/dashboard/*` and `/api/*` send `X-Robots-Tag: noindex`.
- **Schema changes:** edit `prisma/schema.prisma`, then `pnpm db:migrate --name
<change>`; commit the generated migration folder.
- **`AGENTS.md`** is maintained by Next.js (`next dev` re-creates it). It points
  coding agents at the docs bundled with the installed Next version.
