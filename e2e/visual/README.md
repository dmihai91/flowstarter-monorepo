# Visual check

Full-page Playwright screenshot comparisons of the key public pages (`/`,
`/pricing`, `/about`, `/contact`, `/help`, `/login`) at two viewports
(`visual-desktop` 1440x900, `visual-mobile` iPhone 14), run against the
Linux baselines committed under `e2e/visual/__screenshots__/linux/`.

The spec is `pages.visual.spec.ts`. It only runs in the `visual-desktop` /
`visual-mobile` Playwright projects, and those projects only exist when the
`VISUAL_CHECK=1` environment variable is set (see `playwright.config.ts`) —
this keeps the default `pnpm run ci:smoke` / pre-push run, which invokes
`playwright test` with no `--project` flag, unaffected.

## Running locally

Point `PLAYWRIGHT_BASE_URL` at a running dev server (or a Netlify preview)
and enable the visual projects:

```bash
VISUAL_CHECK=1 PLAYWRIGHT_BASE_URL=http://localhost:3005 \
  pnpm exec playwright test --config playwright.config.ts --project visual-desktop
```

Add `--project visual-mobile` for the mobile viewport, or pass both to run
everything.

## Why `darwin/` baselines are gitignored

`snapshotPathTemplate` in `playwright.config.ts` writes screenshots under
`e2e/visual/__screenshots__/{platform}/...`, so a run on a developer's Mac
writes to `darwin/` and a CI run on `ubuntu-latest` writes to `linux/`.
macOS and Linux rasterize fonts and anti-alias edges differently, so a
`darwin/` screenshot will practically never pixel-match a `linux/` one (and
vice versa) even when the page is visually correct. Only `linux/` is
committed; `darwin/` is listed in `.gitignore` so local runs never produce a
diff-worthy commit.

## Refreshing the Linux baselines

A local `--update-snapshots` run can't touch `linux/` at all — `{platform}`
in the path template resolves to whatever OS you're running on, so a Mac
always writes to the gitignored `darwin/` tree. The only way to write (and
commit) the `linux/` baselines that CI compares against is to run the
suite on Linux, which is what the dispatched workflow does:

1. Go to **Actions -> UI Visual Check -> Run workflow**.
2. Set `update_baselines` to `true`.
3. Set `ref` to the branch whose baselines you want to refresh (leave it
   empty to refresh whichever branch you dispatched the workflow from).
4. Run it. The job re-renders every page with `--update-snapshots` on an
   actual Linux runner against that branch's Netlify Deploy Preview, then
   commits and pushes the changed files under
   `e2e/visual/__screenshots__/linux/` to that branch as `github-actions[bot]`.

Review the resulting commit like any other change before merging — a
baseline refresh should be a deliberate, reviewed act.
