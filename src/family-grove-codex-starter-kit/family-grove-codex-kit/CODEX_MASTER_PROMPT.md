# CODEX MASTER PROMPT — FAMILY GROVE

You are the lead full-stack architect, frontend designer, accessibility engineer, privacy engineer, and test lead. **Build and run a real, deployable, kid-friendly, private family-tree web application** called **Family Grove** (working title). Treat the present directory as an asset kit. Inspect it first, preserve all files, create the source application alongside these assets, and update this kit only when necessary. Do not stop at mockups, pseudocode, or a static landing page. Implement working end-to-end flows, tests, seed data, and clear documentation.

## 1. Product vision

A private, growing **forest of connected family trees**. The core experience is a delightful interactive 3D tree where family members can travel through generations and follow relationships. Separate family trees may connect through **mutually approved real-world relationships**; links never silently disclose the entire other family's data. All communication must be through **fixed, reviewed occasion wishes and fixed, reviewed responses**, not open chat. Kids must have a genuinely safer mode. People can record their **actual voice** for birthdays, blessings and other occasions while alive, and leave selected recordings accessible as a respectful **Legacy Voice** after death, subject to advance consent, privacy and stewardship.

**Non-goals for MVP:** social network, public genealogy search, DNA matching, open inbox, comments, DMs, user-composed greetings, AI chatbots, live conversations with the dead, AI voice cloning, synthetic voice generation, facial recognition, unapproved imports, hidden family discovery.

## 2. Build stack — choose current stable compatible releases

- Next.js App Router, React, TypeScript, Tailwind CSS; component system with accessible focus and dialog behavior.
- Three.js rendered via `@react-three/fiber` and `@react-three/drei` on the client; ensure SSR-safe loading and WebGL fallback.
- PostgreSQL with Prisma ORM for canonical data; Docker Compose for local PostgreSQL. Use indexed, normalized relational tables and schema migrations.
- Secure session-based authentication through a well-maintained Next.js-compatible solution. Use verified email/magic links or equivalent, and implement secure invitation acceptance. In local development, provide an explicit safe demo-auth mode isolated from production.
- Zod or equivalent server-side validation at all trust boundaries.
- S3-compatible private media storage or a production-compatible equivalent; local development storage adapter for recordings. Never expose a public unrestricted audio bucket.
- Vitest for units/integration, Playwright for end-to-end, ESLint/TypeScript checks. Use `prefers-reduced-motion` and responsive performance budgets.
- Vercel-compatible deployment with clear env validation, migrations, private media configuration and domain setup.
- Verify up-to-date library APIs in official docs before installing; do not guess package versions or commit secrets.

## 3. Visual language and supplied images

Art direction: premium storybook 3D/clay illustrations, soft mint + forest teal + apricot + lavender + warm gold, gentle child-friendly UI, **not childish clutter**. Use supplied files listed by `assets/asset-manifest.json`. Apply the generated hero image to the public landing page; logo to the header, profile or app badge; sapling to create-tree empty state; interwoven trees to connect-family flow; celebration scene as banner behind fixed wishes. Use responsive SVG assets for occasion icons, avatar privacy states and navigation. Do not ask for replacement images. Do not render text baked into images. Prefer HTML text for localization/accessibility.

Build the **actual family graph dynamically** in 3D. Treat the genealogy as a **typed graph**, not a literal plant topology with one parent per person. Make a stylized trunk and branch visualization / forest with luminous portrait nodes whose edges convey real relationships. Support parent-child, partner/spouse, adopted and step relations, guardians and blended families without losing graph correctness. Use visual routing for complex non-tree structures, multiple parental links and connecting family groves. The 3D tree should feel alive, but factual relationship edges must not be visually ambiguous. Provide a switchable structured 2D genealogy view.

## 4. Screens / routes

1. Public home: engaging scene, explanation, privacy-first CTA; **no public family data**.
2. Invite acceptance / login: expiring one-use signed invite, clear consent, verified identity.
3. Create tree wizard: choose family name, start with self, add a relative, explain privacy.
4. Home dashboard: my connected groves, pending approvals, permitted occasions, recent activity.
5. **3D grove explorer**: zoom, pan, rotate, focus node, generation filters, ancestor/descendant paths, search within permitted people, mini-map, keyboard shortcuts, breadcrumb path, fullscreen, screenshot with privacy warning, reset camera.
6. **2D / list explorer fallback**: same person data, accessible relationship descriptions and navigation.
7. Person details panel: name/alias, optional photo, lineage, relationship to me, authorized edit, privacy state, approved standard wishes, voice legacy tab where permitted.
8. Add a relative / link request: relationship type, candidate person, visibility preview, reciprocal acceptance; guardian/reviewer approval where needed.
9. My invitations and approvals: invite, review, accept, decline, revoke, report incorrect link, dispute and unlink (with history-preserving audit).
10. Occasions: calendar filtered to dates users explicitly share, choose one of curated templates; recipient and response picker; sent history.
11. Legacy Voice studio: adult recording, preview/re-record, accessible transcript/captions, permission and future-use controls, specific occasion tagging, designated steward; player for authorized relatives.
12. Child-safe home: simplified exploration, large controls, no direct messaging, no privacy-sensitive fields, no public profiles; guardian-managed visibility.
13. Privacy/settings: field-by-field visibility, photo and date preferences, data export, erasure request, legacy steward designation, child consent management.
14. Admin/moderation: approve custom relationship disputes, manage fixed template catalogue, reports and audit with least privilege.
15. Custom 404/empty/error/slow-network states and a graceful no-WebGL message.

## 5. Relationship and forest mechanics

- Identity must distinguish **Account** (login), **Person** (genealogy identity), **FamilyTree** (view/membership container) and a relationship **Edge** (typed assertion); a deceased or non-user person need not have an account.
- One person can have authorized memberships/views in multiple trees; don't duplicate identity blindly. Reconcile duplicates only via confirmed requests, with undo and clear privacy impact.
- Model `PARENT_CHILD` (biological/adoptive/step metadata), `PARTNER` (married/partner/former partner), and `GUARDIAN`. Derive siblings and cousins via graph traversal, not editable edges. Support unknown parents, multiple parents, single parent, chosen guardians, renamed persons, separated partners and other real family forms.
- Typed edges must have source, target, assertedBy, status, visibility, start/end if relevant, verification evidence metadata (no intrusive identity document collection in MVP), and timestamps.
- For proposed family links, show to both sides **exactly what would be shared**. Both affected tree admins or affected adults must approve; for a child, guardian approval is mandatory. An accepted link grants only scoped visibility, never full automatic merge.
- Prevent self-parent links, cycles in genealogical parenthood edges, duplicate edges and inconsistent reciprocal approvals. Offer rollback/dispute workflow; keep an audit trail without leaking hidden content.
- On clicking a person: smooth camera transition and path highlighting; show names/portraits **only for people current viewer is authorized to see**. Hidden people appear as neutral private silhouette or aggregate count, never as identifiable metadata.
- Provide fictional seed data: 12-16 people across 3 generations, two separate trees, one verified cross-tree relationship, one pending connection, one living child, one deceased grandparent, one adoptive relation. All fictional identifiers, no real families.

## 6. Messaging policy — **strictly allowlisted**

There are no arbitrary messages, open comments, voice notes attached to chats, GIF search, user-authored text responses, unreviewed emojis, editable signature fields, or custom greeting images. Users select from server-owned `GreetingTemplate` and `GreetingReplyTemplate` IDs only. Server checks sender/recipient access, age/guardian policy, occasion eligibility, relationship and rate limits. UI must not bypass these rules. Names/profile fields must not be exploitable as a communication channel.

Seed catalogue is `data/occasion_templates.json`: birthday, anniversary, wedding, new baby, festival, graduation, congratulations, get well, thank you, remembrance and general blessings. The person receiving a wish may choose only applicable predefined responses. No coercive, manipulative, discriminatory, romantic-to-minor or inappropriate language. Use neutral, culturally respectful wording and opt-in occasions. Support English MVP; structure localization for Malayalam/Tamil later.

Notifications are optional and privacy-sensitive; do not email child-contact details. Make `do not disturb`, mute/block and guardian routing functional. Never push a private occasion to someone without permissions. Rate-limit wishes and prevent mass notifications.

## 7. Legacy Voice — actual voice recordings with informed consent

This feature must be REAL, but **not an AI voice clone**.

**Purpose:** A living adult can intentionally record audio clips for named occasions, family stories or blessings. Later, if that person dies, authorized relatives may select an occasion and play a **specific recording the person really made**. This is a structured interactive library: choose an occasion/question button -> play an exact pre-recorded approved clip, or show `No recording was left for this occasion`. Never compose new sentences, fabricate responses or imply two-way live consciousness.

**Meaningful, bounded interaction:** Seed exact approved choices from `data/legacy_voice_prompts.json`. Examples: a relative taps `Tell me a childhood memory`, `What family tradition did you love?`, `I would like some encouragement`, or `Play a birthday blessing`. For a matching recorded clip, play it exactly; otherwise display that no clip was recorded. The recording owner may pre-record multiple clips and choose their order, but there must be no generative branching, AI-crafted questions, synthetic replies, or open-text prompts. Explain this transparently in UX as an **interactive archive of real recordings**, never a living or responsive person's mind.

**Informed consent and custody:**

- Restrict Legacy Voice recording to legally authorized adults. No minor voice legacy recording, voice cloning or public gallery in the MVP. A child may listen only with guardian-approved access. Avoid unsolicited bereavement playback and provide mute/hide settings.
- Before recording, show explicit opt-in: who may hear each clip now, who may hear it after death, whether it may be downloaded, retention/deletion policy, and a `never generate synthetic speech from this recording` guarantee. Capture consent version and timestamp. Allow adults to withdraw or delete while alive.
- Recording owner designates an adult **legacy steward** and backup; specify circumstances and verification workflow for activating memorial mode. Death verification requires a human-reviewed, privacy-preserving process; never change status because of an unverified user report. Allow family disputes, temporary access freeze and documented appeals.
- After death, follow the person's recorded consent and applicable law; stewards may restrict access/take down content but may **not expand** the deceased person's original audience or authorize voice synthesis without distinct legally valid consent and future policy review.
- Every clip shows `Original recording by [person], recorded [date]` and (when relevant) `Memorial recording. This is not a live conversation or AI-generated reply.` Do not use avatars or autoplay to pretend the person is alive.

**Technical flows:**

- Client recording using MediaRecorder where available with permission check, waveform, max 90 seconds, pause/retry, explicit save, private upload. Add a fallback file upload; accept only validated audio MIME/container types and enforce server-side type, size, duration and malware scanning where available.
- Background audio processing may normalize volume, generate safe waveform metadata and optional owner-edited transcripts; do not train any model on audio. Never send private family audio to an external speech AI provider by default.
- Store encrypted private audio with scoped signed playback access / authenticated streaming, short expiry, no publicly enumerable URLs, audit access and revoke capability. Protect against IDOR, hotlink sharing and caching of sensitive files.
- `VoiceClip` should include ownerPersonId, occasionTemplateId or preapproved `promptKey`, original filename/storage key, duration, transcript, createdAt, consentRecordId, availability windows, audience policy, memorialEnabled and playback status. Add `VoiceConsent`, `LegacySteward`, `MemorialStatusReview` and `VoicePlaybackAudit` records.
- Include a **recording preparation checklist**: Birthday greeting, Anniversary blessing, New baby welcome, Graduation advice, General family story, Festival wish, Encouragement and Remembrance message. Do not imply that a person must have a clip for every occasion.
- Playback is user-initiated; visible Pause/Stop, subtitle text when available, keyboard controls, `avoid this reminder` option, and sensitive-content / grief notice. Allow owner to preview private clips while alive; allow guardian filtering for children.

**Explicit prohibition:** no text-to-speech based on the deceased person's identity; no AI imitation, real-time puppet, new synthetic speech, simulated memory or chat transcript authored in their persona; no deceptive `call grandparent` animation. If asked later, treat synthetic memorial voices as a separately assessed feature requiring verified, narrowly scoped advance consent, legal review and child-safety review—not MVP work.

## 8. Security, safety and governance

This is sensitive family data, so enforce authorization on **every server read and write, including tree queries, media, search and exports**. No client-side-only permissions. Authenticated URLs alone never authorize cross-tree person access. Use secure cookies, CSRF protections as relevant, rate limits, invitation token hashing, short expiration, audit logs, least-privilege roles, safe upload rules, account/session revocation and data minimization. Prevent search engine indexing of private routes and responses, block API caching of private PII, and scrub logs/errors/analytics of names, photos, birth dates and audio URLs.

Roles: adult member, tree steward/admin, guardian, child-linked profile (guardian managed), and moderator. Keep adult-account verification distinct from child management. A child should be an associated profile rather than a freely discoverable standalone account by default. No location sharing, school, current status, contact info or friend suggestions. Allow families to opt out of appearing in remote linked trees. Conduct threat modeling for guessed relationship IDs, link requests, child targeting and abuse through display names.

Implement privacy controls for exact DOB vs month/day only; allow unknown dates and private deceased dates. User consent for photos, retention and right-to-remove workflows. Provide export of user-controlled data and simple account/tree dissolution. Add a compliance checklist for applicable privacy and child-protection laws to be reviewed by a qualified professional before public launch; do not assert the website is legally compliant merely because these controls exist.

## 9. Required data model (minimum)

`Account`, `Session`, `Person`, `FamilyTree`, `TreeMembership`, `PersonTreeVisibility`, `RelationshipEdge`, `RelationshipApproval`, `TreeLinkRequest`, `Invitation`, `GuardianConsent`, `PrivacyPreference`, `MediaAsset`, `Occasion`, `GreetingTemplate`, `GreetingReplyTemplate`, `Greeting`, `GreetingReply`, `VoiceClip`, `VoiceConsent`, `LegacySteward`, `MemorialStatusReview`, `VoicePlaybackAudit`, `NotificationPreference`, `ModerationReport`, `AuditLog`.

Use clear enums and indexes, referential integrity and deterministic permission functions. Consider separate visibility claims for cross-tree links. Add migrations and seed scripts. Document access-control invariants in `docs/SECURITY.md`.

## 10. Design details

- Mobile-first, desktop-immersive. Desktop: 3D scene center, discreet left tree selector, right details drawer. Mobile: bottom nav, portrait-card sheet and simplified orbit controls.
- Gentle tree sway, falling leaves and soft focus transitions; cap device pixel ratio; reduced-motion disables decorative animation. Pause 3D render on hidden tab / background, manage context loss, lazy-load graph and assets, provide 2D alternative for low-end devices.
- Portrait nodes are tap/click targets with visible labels. Add hover/focus equivalence and touch targets. Distinguish people from relationship connectors. Do not place essential meaning in color alone.
- Family relationship indicator might say `My grandmother`, `My cousin`, `Related by marriage`, etc. If kinship is ambiguous, say `Relationship path` rather than guessing.
- Typography: readable rounded sans-serif, no overly thin text, strong contrast. Accessible navigation and controls (WCAG 2.2 AA target), keyboard explorer, semantic person relationship list and narration-friendly labels.
- Whimsical celebratory effects should be optional, silent by default and never trigger flashing or unexpected audio.

## 11. Environment and release

Provide `.env.example` (no real secrets), migration scripts, `docker-compose.yml`, `README.md`, developer/demo scripts, admin bootstrap instructions, and `docs/DEPLOY_VERCEL.md`. Include `DATABASE_URL`, auth secret, base URL, optional email credentials, private object-storage config, rate-limit provider config, recording size/duration limits and demo-mode guards. Fail closed if production secrets are missing; demo mode must not run on production by accident.

Deployment workflow: configure database, private media, migrations and app secrets; deploy to Vercel; add a custom domain **only after owner purchases/selects it**; follow the domain provider's actual required A/CNAME/TXT records; confirm HTTPS, non-indexing for private pages, invite emails and audio permissions. Never assume any specific domain is available or registered. Write a step-by-step guide suitable for a beginner, with troubleshooting.

## 12. Work plan — execute, don't merely describe

**Phase 1 — working skeleton:** inspect kit; initialize project, Tailwind/design tokens, render landing page using supplied images, set up auth/dev demo and PostgreSQL migration. Verify app boots.

**Phase 2 — actual family model:** implement schema, fictional seed, permissions, create tree, add person, relationship validation, private 2D view and tests.

**Phase 3 — immersive 3D grove:** relationship graph layout and forest styling, camera interactions, search/filters, person drawer, accessible 2D fallback, responsive performance.

**Phase 4 — trust-based connecting:** single-use invites, reciprocal link approvals, scoped cross-tree visibility, guardian approval, disputes, rollback and tests.

**Phase 5 — occasions:** server-seeded fixed wishes and replies, zero free-text sending, history, permissions, notification preferences, rate limits and child-safety tests.

**Phase 6 — Legacy Voice:** user-initiated recordings, consent/audience selection, private storage, transcripts, optional memorial activation with steward and human review, precise audio playback matched to preset occasions, refusal/fallback when no clip; tests.

**Phase 7 — polish and deployment:** UI accessibility audit, mobile testing, security threat model, API integration tests, Playwright flows, Vercel deployment guide and walkthrough.

After each phase, give a compact progress report: completed, files changed, commands run, passing/failing tests, next steps. Maintain `IMPLEMENTATION_STATUS.md`. Do not hide incomplete work behind placeholder buttons or fake success toast messages.

## 13. Mandatory acceptance tests

1. New adult can create a tree and see 3 generations of fictional people in 3D and 2D.
2. Clicking a person's portrait traces relationship and opens a permitted details panel.
3. Anonymous user cannot access person data by URL, REST call or media URL.
4. Joining second tree requires correct real-world typed relationship + explicit approvals; no automatic broad disclosure.
5. A child cannot search outside approved family, message anyone, view private birth dates, upload a Legacy Voice clip or see unauthorized recordings.
6. An adult can send only a valid fixed birthday wish and recipient can reply only using valid fixed response ID; a forged text payload is rejected on the server.
7. Adult can record and replay a private voice clip; a non-authorized relative cannot fetch it even with a guessed clip ID.
8. After approved memorial activation, an authorized adult can press `Birthday` and hear exactly the approved original clip, visibly marked as an archived recording; an unrecorded occasion gracefully states no recording exists.
9. Audio never autoplays; no voice cloning or fake response paths exist; removal and access revocation take effect.
10. Keyboard-only and low-power/2D use works; rendering respects reduced motion; data remains hidden when authenticated permissions change.
11. `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and key Playwright tests pass. Report anything not run.

## 14. First instruction to Codex

**Start implementing now.** First inspect all supplied assets and their manifest, then create `IMPLEMENTATION_STATUS.md` and a runnable Phase 1-2 vertical slice with the actual schema, fictional data, responsive UI, 2D tree and first 3D explorer. Continue sequentially as time allows. Ask the user only for genuinely blocking choices (such as the final purchased domain or live provider credentials). Never invent external account IDs, APIs, DNS records or live email/audio credentials.
