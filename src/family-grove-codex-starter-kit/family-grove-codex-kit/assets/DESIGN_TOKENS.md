# Family Grove design tokens

## Core palette

| Token | Hex | Use |
| --- | --- | --- |
| `forest-900` | `#143F42` | primary dark text, tree trunk accents |
| `forest-700` | `#216C67` | interactive green/teal |
| `leaf-500` | `#54B995` | buttons, living branches |
| `mint-100` | `#E6F7EC` | page background |
| `cream-50` | `#FFF9EB` | cards/panels |
| `apricot-400` | `#F7A37A` | celebration accents |
| `gold-400` | `#EFC76C` | relationship highlights |
| `lavender-300` | `#BCA9EB` | secondary decoration |
| `red-600` | `#B54445` | error (also use text/icon) |

## UI

- Font suggestion: `Nunito Sans` or a comparably legible rounded sans; avoid loading family names into client telemetry.
- Panel radius: 20–28px; chips 999px; thin tinted border; subtle depth rather than heavy shadows.
- Desktop layout: immersive canvas + anchored, readable translucent panels.
- Mobile: portrait-safe bottom sheet with 48px+ touch targets and 2D fallback.
- Animation: ≤250ms for controls, ≤600ms for camera focus, with instant reduced-motion alternative.
- All raster illustrations have no baked UI text. Put headings and translations in HTML.
- Use SVG icons with `aria-hidden="true"` when a nearby text label exists, or give an accessible name.

## Decorative assets vs functional data

The `hero`, `sapling`, `two-trees`, and celebration PNG are decorative. Relationship positions and edges are rendered from the database graph. SVG avatar placeholders are **not identities** and should not imply age or gender beyond their semantic labels.
