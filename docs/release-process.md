# Release process

One release per week. `main` still ships continuously through Netlify; the
release is the weekly marker of what was verified end to end, and the only
artefact anyone outside the team should be pointed at.

The whole thing lives in `.depot/workflows/release.yml`. Nothing below is done
by hand except deciding to cut one early.

## The week

| When | What happens |
| --- | --- |
| Monday 06:00 UTC | The lane tags `main` as `release-YYYY-MM-DD` and opens a **draft** GitHub Release with generated notes. |
| Immediately after | Verification runs: production contract checks, the production synthetic, and the authenticated operator journey. The staging full-journey tier runs alongside it. |
| Minutes later | If verification passed, the draft is published and marked latest, with a "Release verification" section appended to its notes. If it failed, the draft stays a draft and the workflow goes red. |

## The four jobs

1. **prepare** creates the annotated tag, pushes it, and opens the draft
   release. On a `release: published` event it skips all of that and simply
   verifies the tag a human published. Re-running with the same tag reuses the
   existing tag and release instead of creating a second one.
2. **full-e2e** runs, against `vars.PROD_URL` (default `https://flowstarter.net`):
   - `e2e/contract.spec.ts` in the `chromium` project, the keyless contract
     checks that also gate every pull request;
   - `e2e/prod-synthetic.spec.ts` in the `prod-synthetic` project, the
     post-deploy synthetic.

   Then, when `E2E_CLERK_OPERATOR_EMAIL` and `E2E_CLERK_OPERATOR_PASSWORD`
   exist, it runs the `setup` and `chromium-auth` projects against the Netlify
   deploy of the tagged commit, falling back to production with a warning when
   no deploy is found within 15 minutes.
3. **staging-journey** runs `e2e/**/*.journey.spec.ts` against
   `vars.STAGING_URL`. That variable is unset today, so the job warns and
   skips.
4. **publish** reads the Playwright JSON reports from the two verification
   jobs, appends the counts to the release notes, and either publishes the
   release or leaves it as a draft and fails.

## What blocks a release

A job that **ran and failed** blocks it. A job that **skipped** does not.

Missing Clerk credentials, a missing Netlify deploy and an unconfigured
staging URL all warn and skip on purpose: a release must not be held hostage
by infrastructure that was never set up. What must never pass silently is a
check that actually ran against the live site and found it broken.

When a release is held, the draft notes say so and name the failing job. Fix
the failure, then re-run the workflow with `tag: <the same tag>` so the same
commit is re-verified rather than a new one cut.

## Secrets and variables

Depot does not read GitHub's secret store. Import each of these with
`depot ci secrets add` / `depot ci vars add`, scoped to this repository (see
`AGENTS.md`).

| Name | Kind | Absent means |
| --- | --- | --- |
| `E2E_CLERK_OPERATOR_EMAIL` | secret | authenticated journey skips |
| `E2E_CLERK_OPERATOR_PASSWORD` | secret | authenticated journey skips |
| `NETLIFY_AUTH_TOKEN` | secret | authenticated journey runs against production |
| `NETLIFY_SITE_ID` | secret | authenticated journey runs against production |
| `PROD_URL` | var | defaults to `https://flowstarter.net` |
| `STAGING_URL` | var | staging full-journey tier skips |

## Running one by hand

```
depot ci dispatch --repo DMPResearch/flowstarter --workflow release.yml --ref main
```

Inputs: `ref` (default `main`) and `tag` (default `release-YYYY-MM-DD`). Pass
`tag` to re-verify and publish an existing draft.

## Journey specs

`e2e/**/*.journey.spec.ts` is the naming convention for the full-journey tier.
None exists yet, so the staging job passes with no tests.

A journey spec walks one complete client path end to end: intake, preview,
deposit, delivered site. It is slow and it leaves state behind, which is why
it never runs on a pull request and never runs against production. It runs on
staging, from this lane, once a week.

Do not put a journey spec in the `chromium` project's normal path. Name it
`*.journey.spec.ts` and it will only be collected by this workflow's explicit
path filter.

## The other test tiers

| Tier | Spec | Where it runs | Blocking |
| --- | --- | --- | --- |
| Contract (keyless) | `e2e/contract.spec.ts` | `.depot/workflows/e2e-smoke.yml`, per pull request, against the Deploy Preview | on a real failure |
| Platform smoke | `e2e/concierge-flow.spec.ts` and friends | same lane | on a real failure |
| Production synthetic | `e2e/prod-synthetic.spec.ts` | `.depot/workflows/prod-synthetic.yml`, after each deploy and every 6 hours | yes, by design |
| Full journey | `e2e/**/*.journey.spec.ts` | this lane, against staging | yes, when staging is configured |
