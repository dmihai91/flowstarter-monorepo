# Branch Protection Rules

This document describes the branch protection rules that should be configured on GitHub to block merges when the pipeline fails.

## GitHub Branch Protection Setup

### For `main` branch:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Branches**
3. Click **Add rule** or edit existing rule for `main`
4. Configure the following settings:

#### Required Settings:

**Branch name pattern:** `main`

- ✅ **Require a pull request before merging**
  - Require approvals: `1` (or more as needed)
  - Dismiss stale pull request approvals when new commits are pushed
  - Require review from Code Owners (if you have CODEOWNERS file)

- ✅ **Require status checks to pass before merging**
  - Require branches to be up to date before merging
  - **Required status checks:**
    - `Lint and Type Check`
    - `Run Unit Tests`
    - `Build Application`
    
- ✅ **Require conversation resolution before merging**

- ✅ **Do not allow bypassing the above settings**
  - This ensures even admins must follow the rules

#### Optional but Recommended:

- ✅ **Require linear history** (prevents merge commits, enforces rebase)
- ✅ **Require signed commits** (for additional security)
- ✅ **Lock branch** (if you want to prevent any direct pushes)

### For `develop` branch:

Follow the same steps as above, but with branch name pattern: `develop`

You may want to relax some rules for the develop branch:
- Fewer required approvals (e.g., 0 or 1)
- Allow force pushes (if needed for rebasing)

## How It Works

### Pipeline Jobs

The CI/CD pipeline includes these jobs that must pass:

1. **Lint and Type Check**
   - Runs ESLint to check code quality
   - Runs TypeScript compiler to check types
   - **Blocks merge if:** Linting errors or type errors found

2. **Run Unit Tests**
   - Runs all unit tests with coverage
   - Enforces coverage thresholds:
     - Lines: **85%**
     - Functions: **85%**
     - Branches: **82%**
     - Statements: **85%**
   - **Blocks merge if:** Any test fails OR coverage below thresholds

3. **Build Application**
   - Builds the Next.js application
   - Verifies build output exists
   - **Blocks merge if:** Build fails

4. **E2E Tests** (runs on push, not blocking for PRs)
   - Runs end-to-end tests with Playwright
   - Currently set to `continue-on-error: true`

### Coverage Requirements

Coverage thresholds are enforced by Vitest and configured in `vitest.config.mts`:

```typescript
thresholds: {
  lines: 85,      // 85% of lines must be covered
  functions: 85,  // 85% of functions must be called
  branches: 82,   // 82% of branches must be executed
  statements: 85, // 85% of statements must be executed
}
```

**The pipeline will automatically fail if any threshold is not met.**

## Verification

To verify your branch protection is working:

1. Create a test PR that intentionally breaks tests or coverage
2. Push the changes
3. Observe that:
   - ❌ The status check fails in the PR
   - ❌ The "Merge" button is disabled with a message like "Required status checks have not passed"
4. Fix the issue and push again
5. Observe that:
   - ✅ Status checks pass
   - ✅ The "Merge" button becomes enabled

## Testing Locally

Before pushing, you can verify your changes will pass CI:

```bash
# Run linter
pnpm lint

# Run type checker
pnpm tsc --noEmit

# Run tests with coverage (uses same thresholds as CI)
pnpm test -- --coverage

# Build the application
pnpm build
```

## Bypassing in Emergencies

If you absolutely must merge without passing checks (emergency hotfix):

1. You can temporarily disable branch protection (requires admin access)
2. Merge the emergency fix
3. **Immediately re-enable branch protection**
4. Create a follow-up PR to fix the issues and meet requirements

**However, this should be extremely rare and only for critical production issues.**

## Additional Resources

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [Status Checks Documentation](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks)
