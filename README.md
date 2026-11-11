# Family Grove

A runnable private family-tree application built from the supplied master prompt. Next.js App Router, React, TypeScript, Tailwind, React Three Fiber / Drei, PostgreSQL, Prisma, Better Auth, Zod, Vitest and Playwright.

The original starter kit is preserved in `src/family-grove-codex-starter-kit/`. The requested master prompt is also copied to the project root. All five supplied illustrations and all SVG assets are available under `public/assets/`; the asset manifest describes their roles.

## Run the fictional demo

Requirements: Node.js 22.12+ (Node 24 LTS recommended), npm, and a current Chrome browser for the browser tests. The implementation was exercised on Windows with Node 26.13.0. No Docker or paid service is needed for the local demo.

```sh
npm install
npm run setup:demo
npm run dev
```

Open **http://localhost:3000**, choose **Come on in**, then **Enter as Maya**. On PowerShell, use `npm.cmd` when execution policy blocks `npm`; no execution-policy change is needed.

`setup:demo` generates local random authentication/encryption secrets in the ignored `.env`, starts Prisma's local PostgreSQL-compatible database, applies the checked-in SQL migrations, and seeds fictional records. It preserves an existing configuration and refuses a non-demo one. The local database runs on ports 51213–51215; data persists across restarts.

### Demo roles and walkthrough

All names, relationships, emails and permissions are fictional.

- **Maya**: Meadow grove steward and Jun's guardian. Explore three generations, add relatives, invite an adult, save privacy choices, and manage child mode.
- **Arun**: adult steward in Meadow. Receive Maya's birthday wish and choose a reviewed reply. He is Maya's designated legacy steward.
- **Lila**: Willow grove steward. Approve her side of the pending family connection. Meadow sees Lila's explicitly shared adult profile, never all of Willow.
- **Human reviewer**: moderator with access to report references, adult verification, template controls and memorial reviews. This role does not grant family membership or audio access.
- **Outside account**: has no family access. Useful for verifying invitation acceptance and denied media access.

There are 14 family people across three generations and two groves, plus two standalone demo account profiles. Fixtures include a deceased grandparent, a child, an adoptive relationship, one approved link and one pending link. No spoken audio is invented or seeded.

1. Open **Family tree**, rotate/zoom the real 3D graph, select a portrait, follow the relationship path, try generation/ancestor filters, then switch to **2D & list**.
2. In **Connected groves**, create an email-bound invitation. Share it privately with the intended adult. It expires after 48 hours, can be revoked, and can be accepted only once by that verified email.
3. For the seeded pending connection, approve Maya's side, sign out, enter as Lila, and approve her side. A dispute/unlink revokes the scoped grant while preserving the audit.
4. In **Little celebrations**, select Arun's birthday and a reviewed wish. Enter as Arun to choose an applicable fixed reply. Unknown fields, custom text and invalid IDs are rejected by the server.
5. In **Family care**, enter Jun's child-safe view. Returning to adult access requires sign-out and adult authentication. Child views cannot send messages or upload recordings, and exclude dates and cross-tree profiles.
6. In **Legacy Voice**, choose **My recording studio**, review consent, record or upload actual audio, preview it, select audiences and explicitly save. Browser recordings are converted to mono 16 kHz WAV; uploads are independently validated. Choose a legacy steward before allowing future playback.
7. To exercise memorial activation, enter as Arun and request a review of Maya with advance consent. Enter as the human reviewer to independently approve. This changes Maya to memorial mode; it is a real persisted transition, so use the test suite for repeatable demonstrations rather than reporting a living real person as deceased.

## PostgreSQL with Docker

```sh
docker compose up -d
```

Copy `.env.example` to `.env`, generate your own random secrets, and use the Compose `DATABASE_URL`. Then run:

```sh
npm run db:generate
npm run db:migrate
npm run db:catalogue
npm run dev
```

For a local fictional demo on Compose, explicitly set `DEMO_MODE=true` and run `npm run db:seed`. Production never uses the demo seeder. The Compose password is a documented local-development credential.

## Validation

Run the test suites sequentially; the lightweight local database is shared by their isolated schemas.

Start the local database with `npm run db:local` before tests if it is stopped.

```sh
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

Vitest resets only the dedicated `grove_tests` schema on a loopback database. Playwright resets `grove_e2e`, starts an isolated server on port 3001, then runs real browser/API flows. It uses installed Google Chrome by default; set the configured channel to your browser or install Playwright Chromium and remove `channel: "chrome"` if necessary. Tests refuse non-loopback database URLs.

Do not edit runtime source while browser tests are running, because the development server reloads it. Screenshots and HTML reports are written to ignored `test-results/` and `playwright-report/`. On restricted Windows executors, the TypeScript runner may need permission to read OS user information.

The production build intentionally does not enable demo authentication. If your local `.env` has demo mode enabled, `npm run build` can compile the app, but `npm start` will reject private requests until production settings are supplied. Use `npm run dev` for the local demo.

## What is implemented

- Account/person separation, memberships, typed edges, cycle prevention, adoption/step/partner/guardian metadata, generation navigation and shared identity across own trees.
- Real 3D graph with camera controls, filters, mini-map, focus, relationship path, fullscreen, privacy-warning canvas export, reduced-motion behavior, hidden-tab pause and structured 2D fallback.
- Database-backed sessions; production one-use email magic links; separate explicit local demo entry.
- Hashed, signed, one-use, expiring invitations; bilateral affected-adult and steward connection approval; endpoint-only cross-tree grants, decline, dispute, unlink and audits.
- Strict server-owned wishes/replies, shared occasion opt-in, database-backed rate limits, mute/DND and guardian routing. No open text messaging.
- Guardian-associated child profiles; server-enforced restricted mode and per-child consent controls and per-recording guardian approvals.
- Actual MediaRecorder recording and file fallback, preview/retry/pause, encrypted private local/S3/Vercel Blob storage, immutable consent audiences, authenticated manual playback, transcripts, stewardship, independent memorial review, access freeze and withdrawal/deletion.
- Own-data export, erasure requests, sole-member tree dissolution, moderation references and fixed-template enable/disable controls.

## Project map

```text
src/app/                 Public pages, private grove and API routes
src/components/          Responsive application screens and dynamic 3D explorer
src/lib/                 Authentication, permissions, services, graph and audio/storage
prisma/schema.prisma     Relational models
prisma/migrations/       Versioned PostgreSQL SQL and integrity/cycle constraints
prisma/seed.ts           Local fictional fixtures only
data/                    Supplied reviewed greeting and voice-prompt catalogues
public/assets/           Supplied PNG/SVG art and design references
tests/                   Unit and database integration tests
e2e/                     Browser and HTTP acceptance flows
docs/                    Security, operations, acceptance mapping and deployment
```

## Launch boundaries

Live SMTP, private object storage, a malware-scanning gateway, independent human verification/moderation operations, retention/backups and jurisdiction-specific legal review require operator setup. They are deliberately not faked. English is implemented; catalogue IDs and locale fields allow later translation. Optional profile photo upload, automated transcript generation, voice synthesis and external notification delivery are not present. All avatars are supplied neutral placeholders.

Read [SECURITY](docs/SECURITY.md), [operations](docs/OPERATIONS.md), [acceptance tests](docs/ACCEPTANCE.md), [implementation status](IMPLEMENTATION_STATUS.md) and the beginner [Vercel deployment guide](docs/DEPLOY_VERCEL.md). No live deployment or purchased domain has been created.
