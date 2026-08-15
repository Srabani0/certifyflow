# CertifyFlow

**Create. Issue. Verify.**

Smart Certificate & Recognition Management Platform — bulk-generate,
distribute, and publicly verify professional certificates for fests,
hackathons, workshops, internships, sports events, and more.

## Stack

- **Server**: Node.js, Express, TypeScript, Prisma (PostgreSQL), Puppeteer (PDF rendering), JWT auth
- **Client**: React, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query, React Hook Form

The repo is an npm workspaces monorepo with two apps: [`server/`](server) and [`client/`](client).

## Prerequisites

- Node.js 18+
- A PostgreSQL database (a free hosted instance like [Neon](https://neon.tech) works well for local dev)

## Setup

1. **Install dependencies** (from the repo root — installs both workspaces):

   ```bash
   npm install
   ```

2. **Configure environment variables**:

   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

   Edit `server/.env` and set `DATABASE_URL` to your PostgreSQL connection string, and `JWT_SECRET` to a long
   random string. See the comments in `server/.env.example` for what each variable does.

3. **Apply the database schema and seed the certificate template gallery**:

   ```bash
   npm run prisma:migrate -- --name init
   npm run prisma:seed
   ```

   The seed script populates 8 ready-made certificate designs (Classic Elegant, Modern Minimal, Corporate Blue,
   Gold Achievement, Tech Hackathon, Sports Champion, Academic Formal, Vibrant Fest).

4. **Run both apps in development**:

   ```bash
   npm run dev:server   # http://localhost:4000
   npm run dev:client   # http://localhost:5173
   ```

   Run them in two separate terminals. Sign up for an organization account at `/register` to get started.

## Everyday commands

Run from the repo root, targeting either workspace:

```bash
npm run dev:server         # start the API in watch mode
npm run dev:client         # start the Vite dev server
npm run build               # typecheck + build both apps
npm run build:server        # build just the server
npm run build:client        # build just the client
npm run prisma:generate     # regenerate the Prisma client after a schema change
npm run prisma:migrate      # create/apply a new migration
npm run prisma:seed         # re-seed the certificate template gallery
```

Each workspace also has its own `typecheck` script (`npm run typecheck --workspace=server`, etc.) for a
fast type-only check without building.

## How it fits together

1. An organization signs up (`/register`) and signs in — auth is a JWT stored in an httpOnly cookie. From
   **Settings**, they can upload a logo, set brand details, and choose a certificate ID prefix (e.g. `TECHFEST`
   instead of the default `CF`).
2. They create an **Event** and import **Participants** — manually, or via a CSV import wizard: upload a
   file, confirm which column holds the name/email/category (with smart auto-detected suggestions and a row
   preview), then review a validation summary (imported/skipped counts with per-row reasons) before
   committing. Any extra CSV columns (e.g. "Team Name", "College") are kept as per-participant data and a
   "category" column can auto-assign a matching certificate type by name.
3. They create a **Certificate Type** for the event by picking one of the 8 seeded templates and filling in
   the title, description, and signatories. A live preview renders the actual template with sample data. The
   title/description support `{{placeholders}}` — built-in ones (`{{eventName}}`, `{{issueDate}}`, ...) plus
   whatever custom columns were imported (e.g. `{{position}}`, `{{teamName}}`), personalized per participant.
4. Participants are assigned a certificate type, individually, via CSV category matching, or in bulk.
5. From the event's Certificates tab, certificates are generated in batch — each gets a unique, hard-to-guess
   certificate ID, a QR code linking to its public verification page, and a rendered PDF (via Puppeteer) that
   includes the organization's logo if one is set. A sample certificate (first/random/last eligible
   participant) can be previewed before generating the full batch. Certificates can be downloaded
   individually, as a ZIP, or exported as a CSV — same for the participants list.
6. Events, participants, and certificates all support search, filtering, and sorting.
7. Anyone with a certificate ID or QR code can verify it at the public `/verify/:certificateId` page — no
   login required. Revoked certificates show as invalid.
8. The Dashboard summarizes events, participants, certificates issued, and total verifications.

## Notes for local development

- Generated certificate PDFs and uploaded logos are written to `server/storage/` (gitignored) — safe to
  delete to reset. Logos are served at `/uploads/logos/...` and referenced by an absolute URL
  (`PUBLIC_SERVER_URL`, defaults to `http://localhost:<PORT>`) so they load correctly both in the browser and
  inside Puppeteer-rendered PDFs, which have no page origin of their own.
- The client talks to the API directly cross-port (`localhost:5173` → `localhost:4000`); both are on
  `localhost`, so the auth cookie's `SameSite=Lax` setting works without a dev proxy.
- There is no seed data for events/participants/certificates — only the certificate template gallery is
  seeded. Everything else is created through the app itself.
- Forgot/reset password isn't implemented yet — it depends on outbound email delivery, which lands together
  with the rest of the email/distribution work in the next phase.

## What's been verified vs. what to click through yourself

Everything below has been verified: both apps typecheck and build cleanly end-to-end; the server and client
dev servers boot and respond correctly; the Prisma schema has been migrated and seeded against a real
Postgres database; and the PDF pipeline (template engine → QR code → Puppeteer render) was exercised directly
and produced a correct, correctly-styled certificate. What hasn't been driven through an actual browser is
the click-through UI experience — worth running yourself once before relying on it:

1. **Sign up** at `/register` with a new organization, confirm you land on `/dashboard`.
2. In **Settings**, upload a logo, set a brand color and a certificate ID prefix (e.g. `DEMO`), save, and
   confirm the logo preview updates.
3. **Create an event**, confirm it appears in the events list with the right badge/type. Try the search box
   and the status/type/sort filters.
4. Open the event, **add a participant manually**, then **import a CSV** with a few extra columns (e.g.
   `Position`, `Team Name`) and a category column matching a certificate type name you'll create next —
   confirm the wizard: upload → column mapping (with auto-suggested columns and a row preview) → validation
   summary (imported/skipped counts with per-row reasons for a deliberately bad row, e.g. a duplicate email).
5. **Create a certificate type**, picking one of the 8 templates, and reference one of the CSV's extra
   columns in the description (e.g. `has secured {{position}}`) — confirm the placeholder hint lists it.
6. **Assign** the certificate type to a participant (individually, via bulk-select, and confirm CSV
   category-matching worked for rows whose category matched the type's name), then hit **Preview** on the
   certificate type and confirm the personalized text renders correctly in the PDF.
7. On the Certificates tab, use **Preview: First/Random/Last** to sample a certificate before generating,
   then **Generate certificates** — confirm the summary (generated/skipped counts) looks right. Try the
   search/status/sort filters, then **download** one PDF, **download the ZIP**, and **export as CSV**.
8. Copy a certificate ID from the Certificates tab and open `/verify/:certificateId` in an incognito window
   (no login) — confirm it shows as valid with the right details, then **revoke** it from the dashboard and
   reload the verify page to confirm it now shows as invalid.
9. Check the **Dashboard** numbers (events, participants, certificates issued, verifications) match what you
   just did.

If anything in that flow doesn't behave as described, that's the fastest way to find it — happy to dig into
any specific step.
