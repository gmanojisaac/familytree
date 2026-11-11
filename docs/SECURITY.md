# Security and privacy invariants

This is a working MVP requiring an independent security, privacy and child-safety review before real families are onboarded. Implemented controls do not establish legal compliance.

## Server access rules

1. Better Auth verifies database-backed sessions and verified email on every private request. No cookie session cache is used; revoked sessions are rejected immediately by the server. Accounts in memorial mode cannot act as living people.
2. An Account authenticates; a Person represents a genealogy identity; a FamilyTree contains memberships/views. Non-users, children and deceased people need no login account.
3. All family reads, search, exports, writes and audio streams call server policy functions. A guessed person, tree or clip ID grants no access. Anonymous requests return 401. Unauthorized person/audio references return 404.
4. A local adult member sees only explicitly visible people in their own memberships. Linked access requires an active approved source link and the adult person's current opt-in. It shares only selected endpoint profiles. Other family members, exact dates, occasions and audio are not automatically shared.
5. Cross-tree endpoint linking is adult-only in this MVP. Child endpoints are refused even for a steward. This stricter default avoids transmitting child metadata; guardians manage children only within their home groves.
6. A child is an associated profile entered through a guardian session. The server rechecks guardian explore consent on every request. Child mode excludes remote profiles, dates, invitations, settings, greeting/reply payloads and recording. The parent cannot be recovered by changing a client flag. Re-entry requires fresh adult authentication.
7. All mutation bodies use strict Zod schemas. Unknown fields are rejected. Profile names are short name-only fields; HTML, URLs, numbers and unsupported punctuation are refused. Names are never accepted as greeting text. Unsafe names can be reported for human review.
8. Greeting and reply content comes from reviewed database template IDs. The server checks visible recipient, matching opted-in occasion, active catalogue entry, rate limit, DND, mute, recipient ownership and guardian routing. Children cannot send. Child wishes are visible to their managing guardian; there is no child inbox.
9. Invites are 256-bit random, HMAC signed, stored only as a SHA-256 digest, verified-email-bound, expiring, revocable and transactionally consumed. Invite claims cannot silently reconcile two already-established identities.
10. Link acceptance records one approval per tree, from each affected adult who is also that tree's steward. Parent cycles and duplicate approved assertions are blocked; PostgreSQL also enforces self-link, type/subtype, foreign key and parent-cycle constraints. Unlink/dispute disables edges and removes only grants belonging to that link.
11. Same-origin checks protect app mutations. Better Auth protects its own endpoints. Cookies are secure in production. APIs and private pages use no-store/noindex headers; there is no family analytics collection. Responses and logs avoid private names, dates, audio keys and invitation tokens.
12. Account-scoped action limits use an atomic PostgreSQL upsert shared by instances. Auth limits use database storage. Greeting and invitation quotas are 10/hour; audio uploads 10/hour; the general mutation limit is 100/hour.

## Voice archive

- Actual living adult recordings only. Fixed prompt keys select exact clips. No model, speech generator, voice clone, open prompt, live avatar, autoplay or external transcript AI is used.
- Every clip points to an immutable versioned consent record and normalized audience rows for NOW and AFTER. Future use needs advance opt-in and an adult steward. No API expands a saved consent's audience.
- A death report alone does not activate memorial mode. A different moderator must independently confirm review. Steward disputes freeze playback. Reopening requires documented operator review and may never expand advance consent.
- Authorizations are checked on each authenticated audio GET; there are no public media paths or permanent bearer playback links. URLs are not authorization. Current family access, audience, consent, memorial review, guardian policy, per-clip guardian approval, mute and hide choices all apply.
- Audio bytes are encrypted with AES-256-GCM before local or private S3 storage; the decryption key remains server-side. Local filenames and S3 keys are opaque random values, never original filenames or names.
- The server reads bounded multipart data, validates container signatures, parses actual audio duration, caps duration at 90 seconds and size at 3 MB, and requires a clean verdict from a configured private scanner in production. WebM with unreadable duration is rejected; the browser's WAV conversion is the fallback.
- Playback is user-initiated, authenticated, no-store, inline and audited. Transcript content is rendered as escaped text. Native controls and an explicit Stop action are available.
- Withdrawal immediately marks consent withdrawn and the clip deleted before removing stored bytes. No further authorized GET can fetch it. Copies already played or captured on a recipient's device cannot be technically recalled; the download UI restriction is not DRM. Operators must reflect deletion in backups within the agreed retention window.
- S3 public access must be blocked at the provider. The application performs no external speech processing. Scanner operators must agree to confidentiality, retention and no-training terms.

## Threat model and residual risks

| Threat | Control | Residual / operator obligation |
| --- | --- | --- |
| ID guessing and cross-tree enumeration | Membership/view policy on every endpoint, opaque invite codes, rate-limited endpoint preview | Authorized members can photograph or copy visible data |
| Invite forwarding/replay/races | Verified email match, hashed signed token, expiration, atomic compare-and-consume | Email account compromise remains an identity risk |
| Parent cycle or conflicting approvals | Serializable acceptance, graph validation, DB cycle trigger, unique approvals | Human relationship verification/dispute process remains necessary |
| Child targeting | No public search, no child login, no cross-tree child endpoints, no child sending/upload | Guardian identity and adulthood must be independently checked |
| Abuse through names/transcripts | Name-only validation, no greeting text input, escaped output, reporting | Human moderation of dishonest names and actual recordings is still required |
| Forged wishes/replies | Strict schemas and reviewed ID catalogue, recipient-only reply | Existing authorized content can still be upsetting; mute and reports remain important |
| Audio IDOR/hotlinking | Session + current audience + family checks, encrypted storage, no-store, same-origin resource policy | Recipients can record their speakers; browser caches outside application control need review |
| False memorial activation | Advance consent, appointed steward, independent moderator, freeze and appeals | The evidence workflow must be staffed; a checkbox does not prove death |
| Session sharing/guardian handoff | HttpOnly secure cookies; server stored child context; adult reauthentication | A guardian must sign out when handing over an already adult-authenticated device |
| Server compromise | Secrets outside source, private encrypted objects, least privilege provider keys | Production key management, rotation, backups and incident response are operator responsibilities |

The current CSP permits inline scripts for Next.js hydration, with eval restricted to development. A production nonce-based CSP and independent penetration test are recommended before wider launch. Production should have network-level login abuse protection in addition to application limits. No broad social discovery or bulk notification endpoint exists.

The development lint toolchain uses a scoped minimatch 11.0.7 override to avoid a transitive denial-of-service advisory; npm audit reported zero vulnerabilities after this change.

## Legal and governance review before public launch

Have qualified professionals assess applicable privacy/child-protection rules, age and guardian assurance, lawful basis for relatives' data, memorial consent/custody, regional storage, international transfers, subprocessors, erasure/retention, accessibility, abuse escalation, breach response and account/tree stewardship. Do not advertise legal compliance based on these controls alone.
