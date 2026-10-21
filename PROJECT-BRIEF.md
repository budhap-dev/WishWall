# Build "WishWall" — a group greeting card web app

You are an expert full-stack engineer. Build a production-quality web app where people create a "board" for someone (birthday, anniversary, farewell, miss you, congratulations, get well soon, thank you, etc.) and others post messages on it. The recipient views the board as animated cards in the browser, or downloads/prints it as a PDF.

Work in PHASES (listed at the end). After each phase, stop, summarise what you built, list how to run/test it, and wait for my confirmation before continuing.

## Tech stack

- Next.js (latest stable, App Router) + TypeScript (strict mode)
- Tailwind CSS + shadcn/ui for components
- Framer Motion for animations
- Auth.js (NextAuth) with the Google provider
- Prisma ORM + PostgreSQL (local dev via Docker Compose; production on Supabase or Neon)
- Zod for validation on every API route and server action
- Image uploads: abstract behind a storage interface; implement local disk for dev and Supabase Storage (or Cloudinary) for prod
- PDF export: Playwright (headless Chromium) rendering a dedicated print route to PDF on the server
- Testing: Vitest for unit tests, Playwright for a few end-to-end tests
- ESLint + Prettier; a `.env.example` documenting every variable

## Core concepts / data model

- **User**: signed in via Google (id, name, email, avatar).
- **Board**: created by a signed-in user. Fields: recipient name, recipient photo (optional), occasion type, title, optional intro message from the creator, template id, theme options (colours/font), optional event date, status (open / closed for new posts), visibility settings, a random unguessable `shareSlug` for contributors/viewers, and an `ownerId`.
- **Message**: belongs to a board. Fields: author display name, optional link to a User (if signed in), text (rich-ish: bold/italic/emoji, max length ~1000 chars), optional image or GIF, card colour/style choice, createdAt, `hidden` flag (for moderation), and an `editToken` stored in the guest's browser so a guest can edit/delete their own message.
- **Template**: per occasion. Defines background, colour palette, fonts, card style, decorative elements (confetti, balloons, hearts, leaves, etc.) and entrance animation. Store templates as typed config in code (not the DB) so they're easy to add.

## Features

1. **Authentication**
   - "Sign in with Google" for board creators (required to create a board).
   - Contributors can post either signed in (name auto-filled) OR as a guest by just typing their name. No account needed to post.
2. **Create a board** (signed-in users)
   - Step-by-step wizard: who is it for → occasion → pick a template (live preview) → title/intro/date → create.
   - After creation show two links: a **contribute link** (to share with people) and the **owner dashboard**.
3. **Contribute**
   - Open the share link, see the board, click "Add a message", write text, optionally add a photo/GIF and pick a card colour, enter name (or use Google name), submit.
   - Guests can edit/delete their own message from the same browser (via editToken).
4. **Owner dashboard**
   - List of my boards; per board: view messages, hide/unhide/delete any message, edit board details, change template, close/reopen for new posts, regenerate the share link, delete board.
5. **Recipient view ("reveal")**
   - A beautiful presentation page: an opening animation (e.g. an envelope or gift box that opens), then the title and the messages appearing as cards in a responsive masonry grid with staggered entrance animations and template decorations (e.g. confetti for birthdays).
   - Clicking a card enlarges it.
   - Respect `prefers-reduced-motion` (disable heavy animations).
   - Fully responsive, mobile first.
6. **Download / print**
   - "Download PDF" button: server route renders `/board/[slug]/print` with Playwright and returns an A4 PDF (option for US Letter). Print layout: cover page with recipient name/title/template art, then messages laid out cleanly across pages without cards splitting across page breaks, images embedded, fonts loaded correctly.
   - Also provide good `@media print` CSS so browser "Print" works.
7. **Templates**
   - Ship at least 2 templates for each occasion: Birthday, Anniversary, Farewell, Miss You, Congratulations, Get Well Soon, Thank You, Welcome. Each must look distinct and polished.
   - Make adding a new template a matter of adding one config file.

## Non-functional requirements

- Security: validate all input with Zod, sanitise message content (no raw HTML), rate-limit message posting per IP and per board, optional hCaptcha/Turnstile for guest posts (toggle via env var), check ownership on every owner action, image upload size/type limits.
- Share slugs must be long random strings; boards are never publicly listed or indexed (add `noindex`).
- Accessibility: semantic HTML, keyboard navigable, alt text for images, sufficient colour contrast.
- Performance: optimise images with `next/image`, lazy-load cards on large boards.
- Clean, well-organised folder structure; reusable components; meaningful comments where logic isn't obvious.
- Seed script that creates a demo board with ~15 sample messages for each template so I can see them.

## Phases

1. Project setup: Next.js, Tailwind, shadcn/ui, Prisma schema, Docker Compose Postgres, env setup, README with run instructions.
2. Google auth + create-board wizard + owner dashboard (basic).
3. Contribute flow: signed-in and guest posting, edit/delete own message, image uploads, rate limiting.
4. Templates system + recipient reveal view with animations.
5. PDF export + print CSS.
6. Moderation polish, accessibility pass, tests, seed data, and deployment guide (Vercel + Supabase/Neon, including how to set up Google OAuth credentials and how to run Playwright on the server or in a separate service if the host doesn't support it).

Start with Phase 1. Before writing code, briefly show me the proposed folder structure and Prisma schema.
