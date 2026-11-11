# Family Grove — Codex project starter kit

This is a **design-asset and build-prompt kit**, not a finished website. It is intended to give Codex the specification and visual assets needed to build a production-minded, private, kid-friendly family-tree web application.

## Begin in VS Code

1. Extract this ZIP to a convenient project directory.
2. Open that directory in VS Code.
3. Open Codex and send: **"Read `CODEX_MASTER_PROMPT.md` and build Family Grove in this folder. Start with Phase 1, then keep implementing the numbered phases. Use the supplied assets and do not remove them. Run the project and tests locally before stopping."**
4. Follow Codex's setup instructions for PostgreSQL, authentication secrets, and optional storage and mail providers.
5. Run the app locally. Test the demo tree and private invitation flows before connecting a domain.

## What's included

- `CODEX_MASTER_PROMPT.md` — full implementation brief, architecture, security rules, UI, rollout, tests and acceptance criteria, including **Legacy Voice**.
- `assets/png/` — five original 3D-storybook-style brand illustrations.
- `assets/svg/` — responsive, scalable interface icons, portrait placeholders and embellishments.
- `assets/asset-manifest.json` — purpose, usage and alt text for each asset.
- `assets/DESIGN_TOKENS.md` — palette, type and motion guidance.
- `data/occasion_templates.json` — example allowlisted greetings and responses.
- `data/legacy_voice_prompts.json` — fixed voice-recording choices for respectful interactive playback.

## Important decisions

- **Family Grove** is a working product name; it is not a claim that a domain or trademark is available.
- The 3D genealogy scene must be built in Three.js / React Three Fiber. The PNG illustrations are decorative imagery, **not 3D models**.
- Children do not get unrestricted messaging or public discovery. Greetings and replies are **server-side allowlisted choices**.
- Legacy Voice uses pre-recorded, permissioned human clips. There is **no voice cloning, synthesized conversation or pretending a deceased person is live** in the MVP.
- All sample people must be fictional. Never publish real family data as demo seed data.
- The kit does not include purchased domain, cloud infrastructure, real identities or authentication credentials.

## Suggested first demo

The first runnable version should contain a fictional three-generation family, an interactive 3D genealogical tree, a 2D accessible fallback, a one-time invite, an approved cross-tree link, a birthday greeting with fixed replies, and a consented voice clip playback demo with simulated file content where necessary.

## Artwork usage

Use the PNG illustrations in marketing, empty states and card banners; use SVGs for crisp UI. Preserve visual branding and transparency. For user photos, use secure opt-in upload and safe initials/avatar fallbacks; never use supplied artwork as if it were a real person's portrait.
