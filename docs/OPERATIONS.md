# Family Grove operator guide

## Authentication and verified adult access

Production uses Better Auth magic links delivered through SMTP. Tokens are hashed at rest, expire in five minutes and are single use. Email verification and adult approval are distinct.

1. Configure production environment values and SMTP using the deployment guide.
2. The owner signs in with a magic link to establish a verified Account.
3. An authorized operator with database access runs `npm run admin:bootstrap -- owner@example.com` after independently confirming the owner is an authorized adult.
4. That moderator uses **Human review** to approve other email-verified adults only after the documented independent age/authority review.
5. Children are never approved as adult accounts; create associated guardian-managed profiles.

Bootstrap never prints a secret. Moderator status does not grant membership in other families. A deployed operator should use a controlled administrative shell or local secure database tunnel for the bootstrap, not expose a bootstrap HTTP endpoint.

## Template changes

The supplied `data/occasion_templates.json` and `data/legacy_voice_prompts.json` are the reviewed source catalogues. Seed only the catalogue in production with `npm run db:catalogue`. New wording requires review, a code change and catalogue seeding. Moderators can disable/re-enable existing templates. Existing history preserves the selected template relationship; do not rewrite old template wording in place after delivery. Add a new ID for new wording.

## Invitations and connecting families

An invitation grants membership in one grove; a connection shares only the two selected adult endpoints. Keep these scopes distinct. Share connection codes privately and explain the scope to both affected adults. This MVP requires each approving adult to be a steward of their respective grove. Resolve authority externally before granting stewardship; no self-service role escalation exists.

Identity reconciliation is deliberately conservative: an invitation may claim an unclaimed adult genealogy profile only if the accepting account has no existing visible genealogy identity. Existing identities are not merged automatically. Operators can review disputed duplicate identities with both adults; preserve reversibility and do not transfer history without consent.

## Legacy stewardship and memorial review

A living adult chooses primary/backup adult stewards and fixed audiences in advance. The consent is specific to each clip. To activate after death:

1. The appointed steward requests review using an evidence-route category. Do not upload intrusive identification documents to this application.
2. A separate human moderator verifies the evidence privately through the operator's established procedure.
3. Record the private reference in the controlled case system, then approve or decline in **Human review**. Do not infer death from inactivity or a report.
4. Only approved AFTER audiences can listen after activation. Preserve original date/disclosure and exact audio bytes.
5. A steward or moderator can freeze all clips; family members can submit a memorial dispute report. Appeals require a documented human decision. The MVP intentionally has no self-service unfreeze or audience expansion endpoint.
6. To remove content, consent withdrawal and status changes must precede storage deletion. A steward can remove deceased recordings using the authorized DELETE endpoint.

There are no synthetic voices or generated questions. A missing clip always states that no recording was left. Never manufacture a seed recording in someone's voice.

## Erasure, retention and dissolution

**Request erasure** persists a pending review request; it does not falsely claim that shared genealogy or retained records have already been deleted. Use the database's ErasureRequest records as the review queue. Verify requester authority, shared-family rights, legal retention and backups before executing removal.

After a reviewed decision, revoke sessions, withdraw owned voice consent, delete encrypted owned clips, remove unnecessary profile fields and account credentials, revoke owned connection grants, and handle remaining shared genealogy under the agreed policy. Preserve only minimal required audit references, with access and retention limits. Record completion and communicate through the verified account's established support route. This sensitive manual case process needs a staffed operator before live onboarding.

A sole-member steward can dissolve an unlinked grove immediately. Groves with other members cannot be silently deleted by one person. Resolve member/steward succession and connection disputes first.

Define a specific retention/backups schedule before taking real recordings. The application has no automatic backup deletion service. An operational job should remove orphaned encrypted objects after failed transactions, verify withdrawn clip deletion, expire stale invitations/verification records, prune action-limit windows and apply approved audit retention. Never log plaintext audio, transcripts, invite URLs or family graph responses.

## Local database and test isolation

Prisma's `dev` command provides local PostgreSQL-compatible development; Docker Compose supplies canonical PostgreSQL 17. Use real PostgreSQL for staging. Test setup resets only `grove_tests` or `grove_e2e` on localhost/127.0.0.1. It refuses cloud URLs. Never point demo/test configuration at production.

The demo seed is idempotent for existing records, so it preserves changes already made to the fictional grove. Recreate the local development database only when you intentionally want a fresh demo, after backing up anything you wish to keep.

## Known scope boundaries

English MVP; neutral supplied avatar placeholders; no external notification delivery, automated identity-proofing provider, automated erasure processor, optional transcript AI or profile photo-upload pipeline. The implemented database and UI expose these boundaries rather than simulating success. Recordings and person edits require permission; launch needs real staffed review and privacy/security assessment.
