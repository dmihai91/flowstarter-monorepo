# Preview environment

How a pull request gets a running copy of Flowstarter with its own database,
and what the owner has to do once to make that true.

## Topology

- **Web.** Netlify builds every pull request into a Deploy Preview (context
  `deploy-preview`) and every other non-production branch into a branch deploy
  (context `branch-deploy`). Production keeps the `production` context and its
  own variables. Nothing below changes production.
- **Database.** A second Supabase project, staging, holds the schema and the
  throwaway data. Preview contexts point at it. The local stack on
  `127.0.0.1:54321` stays the only database a developer or an agent touches by
  hand; staging is written by CI and by the seed script, not from a laptop.
- **Auth.** Clerk runs its **development** instance for previews, shared with
  production until launch. That sharing is a launch blocker: before the first
  real customer, production must move to a Clerk production instance with its
  own `pk_live_`/`sk_live_` pair, and previews must keep the development one.
  `e2e/support/clerk-env.ts` already refuses to run the authenticated suite
  against live keys.
- **Payments.** Stripe test mode, shared with production, which is fine because
  production is not live yet. Live mode never appears in this repository.
- **Build worker.** The staging build worker runs on the Hetzner host beside
  the production one, pointed at the staging Supabase project through its own
  `SUPABASE_URL` and service key. There is no per-pull-request worker.

## One-time setup, by the owner

1. Create the staging Supabase project (same region as production). From
   Project settings, collect:
   - the **project ref** (the subdomain of the project URL),
   - the **database password** you set at creation,
   - the **anon** and **service_role** keys from Project settings, API keys.
2. Create a Supabase **access token** at
   <https://supabase.com/dashboard/account/tokens>. This is what the CLI
   authenticates with in CI, and it is account-wide, so treat it accordingly.
3. Add the three secrets to Depot, which does not read GitHub's secret store:

   ```sh
   depot ci secrets add SUPABASE_ACCESS_TOKEN --repo DMPResearch/flowstarter
   depot ci secrets add STAGING_SUPABASE_PROJECT_REF --repo DMPResearch/flowstarter
   depot ci secrets add STAGING_SUPABASE_DB_PASSWORD --repo DMPResearch/flowstarter
   ```

   Until all three exist, the migrations lane warns and ends green.

4. Set the Netlify variables, scoped to the two preview contexts so production
   is untouched:

   ```sh
   netlify env:set NEXT_PUBLIC_SUPABASE_URL https://<staging-ref>.supabase.co \
     --context deploy-preview --context branch-deploy
   netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY <staging-anon-key> \
     --context deploy-preview --context branch-deploy
   netlify env:set SUPABASE_SERVICE_ROLE_KEY <staging-service-role-key> \
     --context deploy-preview --context branch-deploy
   netlify env:set SUPABASE_PROJECT_REF <staging-ref> \
     --context deploy-preview --context branch-deploy
   netlify env:set E2E_CLERK_OPERATOR_EMAIL operator+clerk_test@flowstarter.dev \
     --context deploy-preview --context branch-deploy
   netlify env:set E2E_CLERK_CLIENT_EMAIL client+clerk_test@example.com \
     --context deploy-preview --context branch-deploy
   ```

   The two `E2E_CLERK_*` addresses are what the seed script links its tenants
   to, and what the authenticated Playwright projects sign in as. Add
   `E2E_CLERK_OPERATOR_PASSWORD` the same way if the suite signs in with a
   password rather than a ticket.

5. Re-link the Netlify site to `DMPResearch/flowstarter`. As of 2026-09 it
   still points at the old repository address, so no pull request here builds
   a preview at all and the E2E smoke lane skips with a warning.

## The migrations lane

`.depot/workflows/staging-migrate.yml` keeps the staging schema level with
`main`.

- It runs on a push to `main` that touched `supabase/migrations/**` or
  `supabase/config.toml`, and applies for real.
- `workflow_dispatch` takes a `dry_run` input, default true, which runs
  `supabase db push --dry-run` and changes nothing. Use it to read a plan
  before merging.
- Either way it prints `supabase migration list` to the step summary.
- Concurrency group `staging-migrate-depot`, never cancelled: a half-applied
  migration is worse than a queued one.
- It reads the three Depot secrets above and passes them as
  `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD` environment variables, so
  nothing lands on a command line.

A pull request branch does **not** get its schema pushed. Previews share one
staging schema, which is why a migration that is not backwards compatible with
`main` will break other open previews until it merges.

## Seeding and cleaning up E2E tenants

Two scripts, no package scripts (the root `package.json` is deliberately left
alone). Both read `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from the
environment, falling back to `apps/flowstarter-main/.env.local` through
`e2e/support/local-env.mjs`.

```sh
# Create or refresh the two fixed tenants. Safe to run repeatedly.
node e2e/support/seed-e2e-tenants.mjs

# Remove tenants seeded more than 24 hours ago (the default).
node e2e/support/cleanup-e2e-tenants.mjs

# Other scopes.
node e2e/support/cleanup-e2e-tenants.mjs --older-than 2
node e2e/support/cleanup-e2e-tenants.mjs --run <run-id-printed-by-the-seed>
node e2e/support/cleanup-e2e-tenants.mjs --all --dry-run
```

- The seed creates `e2e-operator-workspace` (state `AGENTS_WORKING`) and
  `e2e-client-workspace` (state `PREVIEW_READY`), each with a membership and
  one project artifact row. Every id is a UUIDv5 off one fixed namespace, so a
  second run is a no-op.
- It links each workspace to a Clerk user by looking the address up in
  `public.profiles`, the app's own Clerk mirror. It never calls Clerk. If an
  address has no profile yet, it writes a placeholder with a `user_e2e_` id and
  says so; the authenticated suite will not see those workspaces until the real
  users have signed in once and the webhook has mirrored them.
- Cleanup refuses to run unless the URL is `127.0.0.1`/`localhost` or mentions
  `staging`. A URL carrying the ref in `SUPABASE_PROJECT_REF` is refused
  outright. `E2E_ALLOW_PROD=1` lifts only the first of those two.

## How the E2E tiers use it

- **Platform smoke** (`.depot/workflows/e2e-smoke.yml`) waits for the Deploy
  Preview and runs the unauthenticated Playwright project against it. It needs
  no seed.
- **Authenticated suite** (`*.auth.spec.ts`, project `chromium-auth`) needs the
  seed to have run against staging first, and the `E2E_CLERK_*` addresses to
  resolve to real Clerk users. It skips rather than fails when Clerk keys are
  absent.
- **Visual check** (`.depot/workflows/visual-check.yml`) screenshots the same
  preview and compares against committed Linux baselines.

Run the seed before an authenticated tier and the cleanup after it, or leave
cleanup to a scheduled `--older-than 24` pass so a failed run's rows still go.
