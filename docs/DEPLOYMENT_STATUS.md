# Production deployment target

- GitHub: https://github.com/gmanojisaac/familytree (main).
- Vercel project: https://vercel.com/gmanojisaac-3301/familytree
- Production alias: https://familytree-gmanojisaac-3301.vercel.app
- Production branch: main; the connected Vercel Git integration deploys new pushes.
- Runtime target: Node.js 24 configured in Vercel.
- PostgreSQL: Neon free plan, production environment only, iad1. Migrations prefer DATABASE_URL_UNPOOLED; application queries use DATABASE_URL.
- Media: private Vercel Blob store, iad1, with application AES-256-GCM encryption and authenticated playback.
- Build command: npm run vercel-build (generate client, deploy migrations, seed reviewed catalogues, build Next.js).
- Local demo authentication is disabled in production.
- Vercel's default deployment protection remains enabled.

## Explicitly deferred configuration

The owner requested deployment now and email setup later. SMTP is not configured, so the login page explains that sign-in is being prepared; private application requests remain closed until a verified email sender is connected. No test/demo password entry is exposed on Vercel.

Production audio uploads also require the private malware-scanning gateway described in docs/DEPLOY_VERCEL.md. No scanner endpoint or credential has been invented.

Do not invite real families or children before configuring email, independent human verification/moderation, the scanner, retention/backups and the privacy/security reviews described in docs/OPERATIONS.md.

## Verification for this deployment change

- Lint and TypeScript checks passed.
- 19 unit/database integration tests passed.
- 8 browser flows passed, including invitation return through sign-in and microphone capture.
- The private Blob SDK was also checked against the actual connected store using temporary non-personal bytes. Encryption, exact read-back, denial of unauthenticated object access, and deletion passed; the temporary environment file and object were removed.
- npm reported zero vulnerabilities after a compatible scoped Zod override for the SDK helper.
- The Vercel dashboard is the source of truth for the latest production build state and exact commit.
