# Acceptance mapping and verification

The intended story is: a verified adult enters a private grove, creates and navigates a typed family graph, invites/links with explicit scope, shares only reviewed occasion words, manages a child profile, and records/listens to an exact consented original clip through a private authenticated stream.

| Master-prompt acceptance | Evidence |
| --- | --- |
| Create a tree, view three generations in 2D/3D | Playwright creates a grove and parent/grandparent; dashboard/explorer screenshots; unit/integration generation and adoption checks |
| Select portrait and trace permitted path | Playwright selects Nora in 3D and 2D; graph traversal unit tests; permitted person drawer |
| Anonymous person/API/media denial | Playwright anonymous state and guessed audio checks; integration outside-account and cross-tree denial |
| Mutual typed links with no broad disclosure | Integration two separate approvals, endpoint-only visibility, dispute/unlink and no remote Iris profile |
| Child restrictions | Playwright mobile child mode; integration dates stripped, remote profiles absent, messaging denied; upload endpoint adult gate, plus per-recording guardian-approval integration tests |
| Fixed wishes and replies, forged text rejected | Playwright actual POSTs, recipient reply; strict-schema unit and DB integration checks |
| Real private voice upload/replay and IDOR denial | Playwright multipart upload of a clearly identified non-speech WAV test fixture, exact bytes to permitted adult, denial to outsider |
| Reviewed memorial playback and missing choice | Playwright independent steward/moderator review, archived recording disclosure, byte equality, absent anniversary fallback |
| No autoplay, cloning, synthetic replies; withdrawal | Playwright paused audio/no autoplay attribute and revoked URL after deletion; fixed prompt catalogue and no speech-model dependency |
| Keyboard, mobile, reduced motion, refreshed permissions | Playwright mobile viewport/reduced motion and keyboard navigation; semantic structured list; 15-second/focus permission revalidation |
| Required commands | See IMPLEMENTATION_STATUS.md for the final command results and any remaining verification limits |

## Test assets and privacy

Audio tests use silence encoded as PCM. The fixture is explicitly labeled as non-speech test data and is never seeded as a fictional person's human voice. A browser-device test also exercises microphone capture, preview, explicit save and deletion. It verifies upload validation, encryption, exact playback, consent, review and deletion without generating or attributing speech.

Screenshots are produced from fictional data only. Test schemas are isolated from the local demonstration. Browser microphone permission, device behavior, live SMTP delivery, the chosen private S3 provider/scanner and real independent human review must also be tested in the operator's configured staging environment.

## Supplied asset use

- hero-family-tree.png: public hero and private grove cover.
- logo-family-grove.png and app-favicon.svg: public/app identity.
- empty-sapling.png: login/onboarding and create-grove state.
- linked-family-trees.png: invitation and connection screens.
- occasion-celebration.png: celebration banner/cards.
- avatar-adult.svg, avatar-child.svg, avatar-private.svg and node-frame.svg: identity placeholders, protected-profile state and portrait drawer.
- All occasion SVG icons: kind-to-icon mapping for the full supplied reviewed catalogue.
- Voice, legacy-play, tree-link and guardian SVGs: archive/studio, connections and guardian controls.

The supplied illustrations are decorative. Authorized database records drive actual 3D positions, connections, labels and permitted 2D content.
