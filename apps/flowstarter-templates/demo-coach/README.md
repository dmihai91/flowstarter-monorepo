# Demo Coach

Single-page coaching landing — the canonical "demo client site" the
Flowstarter editor opens by default. Built so the editor's coding agent
has obvious things to edit (copy, brand colours, contact info, prices)
without needing to learn a new framework.

## Stack

- **Astro 5** — single page, no client JS, no build complexity
- **Pure CSS** — `src/styles/global.css`, no Tailwind, no design system import
- **Brand-themable** via four CSS variables on `:root`

## Where the editable content lives

Almost everything is in **one JSON file**: `src/data/site.json`.

| Hot-spot | Field |
|---|---|
| Coach name + tagline | `brand.name` / `brand.tagline` |
| Brand colour | `brand.accent` (hex) |
| Hero headline + lede | `hero.*` |
| Approach blurbs | `approach.items[]` |
| Engagement tiers + prices | `engagements.items[]` |
| About copy + facts | `about.*` |
| Contact email + calendar link | `contact.email` / `contact.calLink` |
| Footer links | `footer.links[]` |

The Astro page `src/pages/index.astro` wires those fields into the
markup. The styles in `src/styles/global.css` reference the brand colour
through `:root` variables, so a one-line change in `site.json` recolours
the whole page.

## Run

```bash
pnpm install               # workspace-managed
pnpm dev                   # → http://localhost:4322
```

The Flowstarter editor's `scripts/dev-editor.sh` defaults to this
project as `DEMO_PROJECT_DIR`. Override with:

```bash
DEMO_PROJECT_DIR=/abs/path/to/other/project pnpm dev:editor
```

## Why "Maya Okafor"?

Fictional. Pick any name — the agent will retune the whole page if you
ask it to. The point of the demo is that asking the editor "change the
coach's name to <X> and switch the accent to forest green" should
produce one clean diff in `site.json`, nothing more.
