# Deploy Family Grove to Vercel

This guide describes an actual Next.js/PostgreSQL deployment. No project, provider account, domain purchase, live credential or deployment has been invented or created for you.

## 1. Prepare the repository

Install Node.js 22.12+ (prefer the current compatible LTS), run the local demo and the validation commands in README. Commit application source, package-lock, assets and migrations. Keep `.env`, private media, database state, generated test reports and credentials out of Git.

Git requires your own author name/email before committing. The repository remote is already configured as `https://github.com/gmanojisaac/familytree.git`. Set repository-local identity if needed:

```sh
git config user.name "Your actual name"
git config user.email "Your chosen Git author email"
git add .
git commit -m "Build Family Grove private family application"
git push -u origin main
```

Inspect staged paths before committing. Do not commit secrets. If your identity is not configured, the application can still be run locally.

## 2. Provision separate PostgreSQL databases

Choose a PostgreSQL provider with backups, encrypted connections and an appropriate region. Create distinct Production and Preview databases; do not point preview migrations at the live family database.

The application uses Prisma 7 with the PostgreSQL driver adapter and ordinary PostgreSQL URLs. Keep the checked-in migration history. Some integrity constraints and the recursive parent-cycle trigger are explicit SQL; review future generated migrations so they are retained.

From a trusted machine, with the intended database URL supplied through your environment or ignored configuration, run:

```sh
npm ci
npm run db:generate
npm run db:migrate
npm run db:catalogue
```

Only the reviewed template catalogue is seeded in production. Never run `setup:demo` or `db:seed` against production. The app's fictional seeder refuses non-loopback database hosts and production/demo misconfiguration.

## 3. Provision private media and scanning

On Vercel, a private Vercel Blob store is also supported with MEDIA_STORAGE=blob and the connected BLOB_STORE_ID or BLOB_READ_WRITE_TOKEN. Both adapters store only AES-GCM-encrypted bytes and use authenticated application playback. The current project uses this private Blob option.

For S3 instead, create a private S3-compatible bucket. Block public access at the bucket/provider level; grant an application key only the necessary GetObject/PutObject/DeleteObject rights for that bucket. Do not enable a public object website or unauthenticated CDN for the recordings.

The server encrypts recordings with AES-256-GCM before storage, then authenticates and authorizes every playback request. Use a separate encryption key per environment, back it up securely, and document rotation. Losing the key makes existing recordings unrecoverable.

Configure a private HTTPS malware-scanning gateway with this explicit contract:

- Request: POST raw audio bytes, Content-Type application/octet-stream, Authorization Bearer with the configured scanner token.
- Success: HTTP 2xx and JSON `{"clean": true}`.
- Any failure, timeout, unavailable scanner or non-clean result rejects the upload. The app sends no family names, transcripts or identity to the gateway.
- Require contractual confidentiality, short retention and no model training. This is malware screening, not a speech/AI service.

The API hard cap is 3 MB and 90 seconds; multipart input is bounded to 4 MB. Browser recording is resampled to mono 16 kHz WAV so 90 seconds fits beneath this cap. This stays below the current [Vercel function payload limit](https://vercel.com/docs/functions/limitations#request-body-size). Larger-file direct-upload processing is not part of this MVP.

## 4. Configure SMTP and human operations

Choose an authenticated SMTP sender and complete its real domain-verification requirements. Configure its actual host, port, username, password and verified From address. Magic links expire in five minutes and prove email ownership.

Before real onboarding, define and staff adult/guardian assurance, memorial death-evidence review, disputes/appeals, child safeguarding, erasure, retention/backups and incident response. The application does not infer adulthood from a verified email or death from an unreviewed report.

## 5. Import the repository into Vercel

Import your GitHub repository as a Next.js project. Use the repository root as the project root. Keep the standard Next.js output; this is not a static export.

Set **Build command** to `npm run vercel-build`. That script generates Prisma Client, applies versioned migrations and builds Next.js. Install dev dependencies during builds because Prisma CLI is a build dependency. Use a Node version compatible with package.json.

Select a function region near your database and storage. Keep preview access restricted and use separate preview secrets/resources. If your organization runs migrations in a dedicated release job instead, run `npm run db:migrate` there and use `npm run build` for Vercel.

The setup follows [Prisma's Vercel deployment guidance](https://www.prisma.io/docs/orm/v7/prisma-client/deployment/serverless/deploy-to-vercel). `postinstall` also generates the client to avoid stale generated models.

## 6. Set environment variables

In Vercel Project Settings → Environment Variables, add the actual values below. Store credentials/database URLs/encryption/auth/scanner tokens as Secret values. Keep non-sensitive flags and base URLs as Config where appropriate. Do not prefix private values with NEXT_PUBLIC_.

| Variable | Production value |
| --- | --- |
| DATABASE_URL | Intended production PostgreSQL connection URL |
| BETTER_AUTH_URL | Exact HTTPS origin for this environment |
| BETTER_AUTH_SECRET | Fresh random secret, at least 32 characters |
| DEMO_MODE | false |
| MEDIA_ENCRYPTION_KEY | Fresh random 32-byte key encoded as 64 hex characters |
| MEDIA_STORAGE | blob for the connected private Vercel store, or s3 |
| MAX_AUDIO_BYTES | 3145728 or a smaller limit |
| MAX_AUDIO_SECONDS | 90 or a smaller limit |
| BLOB_STORE_ID | Connected private Blob store identifier when using blob |
| S3_REGION | Provider's actual region |
| S3_BUCKET | Private bucket name |
| S3_ENDPOINT | Actual endpoint for an S3-compatible provider; omit for standard AWS if appropriate |
| S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY | Scoped private storage credentials |
| SMTP_HOST / SMTP_PORT | Actual mail provider host/port |
| SMTP_USER / SMTP_PASSWORD / SMTP_FROM | Authenticated sender configuration |
| AUDIO_SCAN_URL / AUDIO_SCAN_TOKEN | Private HTTPS scan gateway and token |

Generate secrets with a secure random tool or password manager; never copy the examples literally. Do not share Production secret values with Preview. Runtime validation refuses demo mode on production and refuses private functions without the required auth/media/mail configuration. Audio uploads separately fail closed if the scanner is missing.

There is no Redis dependency: auth and application rate counters live in PostgreSQL. There are no live provider IDs hard-coded into source.

## 7. Deploy, initialize the owner and verify

Deploy the configured project. Confirm the migration and Next build complete. The public home contains only decorative imagery and product content; it must never contain real family data.

1. Visit /login and request an actual email magic link. Confirm the sender, HTTPS origin and five-minute expiry.
2. Sign in as the owner to create the email-verified account.
3. From a controlled operator environment connected to this database, run `npm run admin:bootstrap -- verified-owner@example.com` after independently checking adult authority.
4. Use Human review to approve other verified adults only after completing your documented assurance process.
5. Create a real grove with permission; test private invitation acceptance, one-use reuse rejection, revocation, both-sided linking and endpoint-only disclosure.
6. Test child mode, date hiding, no remote discovery, no child sending and no child upload.
7. Make a short real recording on HTTPS; preview, explicitly save, test only the chosen audience, verify authenticated streaming and denied guessed IDs, then withdraw/delete it.
8. Use a separate staging/test identity to test memorial requests, independent review, exact archived playback, no autoplay and freeze/appeal.
9. Confirm private HTML/API responses are no-store/noindex, browser 2D/reduced-motion behavior, mobile controls, error states and provider logs with no private payload logging.
10. Establish backups and restore/deletion drills. Complete the independent security/privacy/child-safety review before inviting real children.

## 8. Connect a domain only after you choose or own it

Choose or purchase a domain yourself. No domain availability or ownership is assumed.

Add that domain in Vercel's project Domains settings. Copy only the A/CNAME/TXT records Vercel actually displays for your domain and DNS provider; generic made-up DNS values are not supplied here. Wait for verification and HTTPS issuance.

Update BETTER_AUTH_URL to the exact verified HTTPS origin and redeploy. Update SMTP sender verification only as required by your actual mail provider. Re-test magic links and invitations after any origin change. Keep private routes excluded from indexing.

## Troubleshooting

- **Production rejects demo login**: expected. DEMO_MODE must be false; use verified email magic links.
- **Email verified but editing blocked**: adult verification is separate; the designated human reviewer must approve.
- **No email arrives**: inspect SMTP sender verification, credentials and provider delivery logs without logging tokens or email bodies.
- **Database errors**: verify region/network/SSL credentials, migration history and Preview/Production separation. Do not run development migrations against production.
- **Audio is rejected**: check 3 MB/90-second limits, readable container duration, scanner verdict and private S3 credentials. Browser WAV recording avoids common WebM-duration problems.
- **403 or 404 playback**: check the current session, family access, exact saved audience, owner consent, guardian listening setting, mute/hide preferences and memorial review/freeze. A known clip URL is not authorization.
- **3D is unavailable**: open 2D & list. All permitted relationship data remains accessible.
- **Unexpected old state**: the UI revalidates on focus and every 15 seconds. Revocation takes effect at the next server request; already-downloaded audio cannot be recalled.
- **Large server bundle**: keep private media/runtime files out of tracing. The project excludes local media, secrets, Git metadata and the preserved source kit from function tracing.
- **Tests fail on a remote database**: deliberate safety guard. Run them against the isolated schemas on loopback PostgreSQL.
