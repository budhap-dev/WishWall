# WishWall

Group greeting cards on the web. Create a board for someone (birthday, farewell,
get well soon…), share a link so friends can post messages, photos and GIFs,
then reveal it as an animated card or download it as a PDF.

**Stack:** Next.js 16 (App Router, Cache Components) · TypeScript (strict) ·
Tailwind CSS 4 + shadcn/ui · Framer Motion · Auth.js v5 (Google) · Prisma 7 +
PostgreSQL · Zod · Vitest + Playwright.

> Status: **Phase 4 (templates + recipient reveal view with animations)**
> complete. See [PROJECT-BRIEF.md](PROJECT-BRIEF.md)
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

### 4. Set up Google sign-in

1. Generate `AUTH_SECRET`: `pnpm dlx auth secret` (or
   `openssl rand -base64 32`) and put it in `.env`.
2. In [Google Cloud Console](https://console.cloud.google.com), create a
   project (e.g. "WishWall").
3. **Google Auth Platform → Get started:** app name, support email, audience
   **External**, contact email.
4. **Audience → Test users:** add the Google accounts that will sign in while
   the app is in testing mode. (Before launch, click **Publish app**; the
   basic `openid email profile` scopes don't need Google verification.)
5. **Clients → Create client → Web application:**
   - Authorised JavaScript origin: `http://localhost:3000`
   - Authorised redirect URI: `http://localhost:3000/api/auth/callback/google`
   - For production, add your deployed URL in both lists too, e.g.
     `https://wishwall.example.com` and
     `https://wishwall.example.com/api/auth/callback/google`.
6. Copy the client ID and secret into `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`.

### 5. Run

```bash
pnpm dev
```

Open <http://localhost:3000>. Check the database connection at
<http://localhost:3000/api/health>; it should return
`{"status":"ok","database":"ok"}`.

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
| `pnpm test:e2e`    | Playwright tests against a production build (see below) |
| `pnpm clean`       | Delete `.next` (build output and dev cache)             |
| `pnpm db:migrate`  | Create + apply a new migration after editing the schema |
| `pnpm db:deploy`   | Apply pending migrations (CI / production)              |
| `pnpm db:studio`   | Browse the database in Prisma Studio                    |
| `pnpm db:generate` | Regenerate the Prisma client                            |

## Image uploads (parked)

**Off by default.** Photo/GIF uploads are switched off until storage and
privacy (consent, retention, deletion requests) are decided. While
`UPLOADS_ENABLED` isn't `"true"`, upload buttons are hidden, `/api/uploads`
refuses requests, and the server rejects image attachments. The code stays in
place and the end-to-end tests run with uploads on, so it keeps working.

When enabled, images go through `POST /api/uploads`, which identifies files by their bytes
(not their name), re-encodes photos to WebP (dropping EXIF data such as GPS
location), keeps GIFs animated, and signs the result so only real uploads can
be attached to messages. Browsers shrink large photos before uploading, to stay
under Vercel's 4.5 MB request limit.

- **Development:** `STORAGE_DRIVER="local"` saves files to `./uploads`, served
  at `/files/...`.
- **Production:** `STORAGE_DRIVER="cloudinary"` (free tier). Create an account
  at [cloudinary.com](https://cloudinary.com), then copy **Cloud name**,
  **API key** and **API secret** from the dashboard's _API Keys_ page into
  `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET`.
  Images are delivered resized by Cloudinary's CDN.

## Abuse protection

- **Rate limits** (per hour, stored in Postgres so they hold across serverless
  instances): new messages per IP (`RATE_LIMIT_PER_IP`, default 10) and per
  board (`RATE_LIMIT_PER_BOARD`, 200); uploads per IP
  (`RATE_LIMIT_UPLOADS_PER_IP`, 30). IPs are stored only as salted hashes.
- **CAPTCHA (optional):** set `CAPTCHA_ENABLED="true"` plus
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` from Cloudflare
  Turnstile (free) to require an "I'm human" check on guest posts.
- **Guest edits:** posting as a guest stores a random edit token in that
  browser; the database keeps only its SHA-256 hash.

## Link previews

Board links unfurl as rich cards in WhatsApp, iMessage, Slack and others:
`generateMetadata` sets `og:` / `twitter:` tags and `opengraph-image.tsx`
draws a 1200×630 image in the board's template (title, recipient, "Add your
message"). The recipient's link previews as a sealed envelope, without the
board title. `metadataBase` comes from `APP_URL`, so set it to the public URL.
Messaging apps cache previews per link.

## Message styling

Contributors can pick a font (Handwritten, Marker, Script, Serif, Rounded,
Playful, or the template's) and a text colour. Colours that aren't readable
(WCAG AA) on the chosen card colour are disabled, and if a stored colour stops
being readable (e.g. the owner switches template) the card falls back to the
template's text colour. Choices are stored as ids defined in
`src/lib/message-style.ts`.

## Recipient view

`/board/<revealSlug>/reveal` shows an opener (envelope, gift box or curtain,
per template), then the title and every non-hidden message in a masonry grid
with the template's entrance animation and ambient decorations (confetti,
balloons, hearts, …). Clicking a card enlarges it (← / → to move, Esc to
close). Large boards render in batches as you scroll. With the OS
"reduce motion" setting, openers and entrances are skipped and decorations
are frozen or left out.

## Testing

- **Unit tests** (`pnpm test`): validation, slugs, redirects, and every
  template (registered, complete palette, WCAG AA colour contrast).
- **End-to-end tests** (`pnpm test:e2e`): build the app, start it on port 3100,
  and drive Chromium (desktop and mobile). They need the database in `.env`;
  point it at your **development** branch. Tests sign in by inserting a
  throwaway user and session straight into the database (no Google round
  trip), and delete everything they create. First run:
  `pnpm exec playwright install chromium`.

## Deployment (Vercel + Neon)

Production: <https://wishwall-psi.vercel.app> (Vercel project `wishwall`,
region `lhr1` next to the Neon database in London).

- **Database:** the Neon `production` branch. Apply migrations before deploying
  a schema change, using that branch's direct connection string:
  `DIRECT_URL="postgresql://…" pnpm db:deploy`.
- **Environment variables** (Vercel → Project → Settings → Environment
  Variables, Production): `DATABASE_URL` (Neon production, pooled),
  `APP_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, and
  `ENABLE_EXPERIMENTAL_COREPACK=1` (so Vercel builds with the pnpm version
  pinned in `package.json`).
- **Deploy:** `pnpm dlx vercel deploy --prod` from the repo root.
  `.vercelignore` keeps `.env` and build output from being uploaded.
- The build script runs `prisma generate` itself, because Vercel's dependency
  cache can skip `postinstall`.

Local-only demo sign-in: set `DEV_LOGIN="true"` in `.env` to get a
"Continue as demo user" button on `/signin` under `pnpm dev`. It is ignored
by production builds.

## Environment variables

Every variable is documented in [.env.example](.env.example) and validated at
startup by [src/lib/env.ts](src/lib/env.ts), so a missing value fails with a
clear message instead of a runtime surprise.

## Project structure

```
prisma/
  schema.prisma          database schema (Auth.js models + Board, Message, RateLimit)
  migrations/            SQL migrations (committed)
src/
  app/
    (site)/              pages with the app header: landing, /signin, /dashboard/**
    api/auth/            Auth.js routes (Google OAuth callback, session)
    api/health/          DB connectivity check
    api/uploads/         image upload endpoint
    board/[slug]/        contribute page (share link)
    board/[slug]/reveal/ recipient view (reveal link: opener, card wall, lightbox)
    files/[...key]/      serves locally stored uploads (dev)
  proxy.ts               bounces signed-out visitors away from /dashboard (cookie check only)
  components/
    ui/                  shadcn/ui primitives
    boards/              occasion/template pickers, visibility toggles
    dashboard/           owner dashboard pieces (share links, forms, moderation)
    messages/            message card, compose dialog, image upload, contribute board
    reveal/              openers (envelope/gift box/curtain), decorations, grid, lightbox
    templates/           TemplatePreview (mini board rendered with a template)
    wizard/              the create-board wizard
  templates/
    configs/             one file per template  ← add new templates here
    index.ts             registry + lookups
    fonts.ts, styles.ts  template fonts (next/font) and style helpers
  lib/                   shared, client-safe: occasions, validation (Zod), formatting
  server/                server-only
    auth.ts, session.ts  Auth.js config; getCurrentUser/requireUser (data access layer)
    services/            database logic; every owner query is scoped to the owner
    storage/             StorageAdapter + local disk and Cloudinary drivers
    images.ts            upload validation and re-encoding (sharp)
    rate-limit.ts        Postgres fixed-window rate limiter
    actions/             Server Actions: re-check session, validate with Zod, call services
tests/
  unit/                  Vitest
  e2e/                   Playwright
```

### Adding a template

1. Copy a file in `src/templates/configs/` (e.g. `birthday-confetti-pop.ts`),
   give it a new `id` (= filename) and change the name, occasion, fonts and
   colours. Fonts must be keys from `src/templates/fonts.ts`.
2. Add it to the `TEMPLATES` list in `src/templates/index.ts`. The first
   template listed for an occasion is that occasion's default.
3. Run `pnpm test`: it fails if the file isn't registered, an id is
   duplicated, a palette slot is missing, or any text/background pair is
   below WCAG AA contrast.

## Notes

- **Privacy:** boards are reachable only by their 32-character random links.
  `/board/*`, `/dashboard/*` and `/api/*` send `X-Robots-Tag: noindex`.
- **Schema changes:** edit `prisma/schema.prisma`, then `pnpm db:migrate --name
<change>`; commit the generated migration folder.
- **Dev server stuck reloading** with "The server could not finish this
  Suspense boundary" in the console: stop `pnpm dev`, run `pnpm clean`, and
  start it again. Turbopack's dev cache in `.next/dev` occasionally serves
  stale compiled code after many edits; production builds are unaffected.
- **`AGENTS.md`** is maintained by Next.js (`next dev` re-creates it). It points
  coding agents at the docs bundled with the installed Next version.
