# Codebase Audit Report
**Date:** 2026-03-02
**Scope:** All apps in flowstarter-monorepo

## Critical Violations

### 🔴 P0: Secrets in lib/ files (should be in API routes only)
| File | Secret | Fix |
|------|--------|-----|
| `lib/google-oauth-helper.ts` | `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` | Move to API route |
| `lib/godaddy-service.ts` | `GODADDY_API_KEY`, `GODADDY_API_SECRET` | Move to API route |
| `lib/token-encryption.ts` | `TOKEN_ENCRYPTION_KEY` | Move to API route |
| `lib/email.ts` | `RESEND_API_KEY` | Move to API route |
| `lib/security-audit.ts` | `AUDIT_HASH_SALT` | Move to API route |
| `lib/ai/openrouter-client.ts` | `OPENROUTER_API_KEY` | Already server-only, add 'use server' |
| `lib/ai/audit.ts` | `AI_AUDIT_ENC_KEY` | Move to API route |
| `lib/invite-tokens.ts` | `INVITE_TOKEN_SECRET` | Move to API route |
| `lib/editor/daytona/client.ts` | `DAYTONA_API_KEY` | Move to API route |
| `lib/editor/daytona/sandbox.ts` | `ANTHROPIC_API_KEY` | Move to API route |

### 🔴 P0: fetch() calls in components (should be in hooks)
19 components call `await fetch()` directly. Data fetching should live in hooks.

### 🟠 P1: Files over 400 lines (split needed)
| File | Lines | Action |
|------|-------|--------|
| `page.tsx` (landing) | 2388 | Split into section components |
| `TeamProjectsList.tsx` | 984 | Extract logic to hooks, split table/list |
| `ChatMessageList.tsx` | 791 | Extract message rendering, scroll logic |
| `DomainConfiguration.tsx` | 616 | Extract validation hook, DNS section |
| `domains/availability/route.ts` | 614 | Extract domain checking service |
| `ProjectsList.tsx` | 541 | Extract to hook + slim component |
| `pricing/page.tsx` | 499 | Extract PricingCard, FAQ section |
| `ProjectDetailsSection.tsx` | 482 | Break into field groups |
| `services/page.tsx` | 464 | Extract form logic to hook |
| `CustomSignIn.tsx` | 452 | Extract auth logic to hook |
| `dashboard/page.tsx` | 451 | Already has extracted components, review |
| `DashboardStatsClient.tsx` | 445 | Extract stat cards to sub-components |
| `security/page.tsx` | 443 | Extract form logic to hook |
| `contact/page.tsx` | 442 | Extract form to hook + split sections |
| `DashboardHero.tsx` | 414 | Extract stepper logic |
| `CodeViewer.tsx` | 406 | Extract editor logic to hook |

### 🟠 P1: Hooks over 400 lines (break into smaller hooks)
| Hook | Lines | Action |
|------|-------|--------|
| `useStreamingWebsiteGeneration.ts` | 605 | Split: useStreamParser, useGenerationState, useFileManager |
| `useProjectSuggestions.ts` | 360 | Split: useSuggestionFetch, useSuggestionState |
| `useProjectGeneration.ts` | 321 | Split: useGeneration, useGenerationProgress |

### 🟡 P2: Heavy components (8+ hooks = too much logic)
| Component | Hook count | Lines | Action |
|-----------|-----------|-------|--------|
| `response-stream.tsx` | 32 | 397 | Extract all logic to useResponseStream hook |
| `ProjectWizard.tsx` | 26 | 918 | Already uses hooks, but 26 is too many - compose |
| `page.tsx` (landing) | 19 | 2388 | Split into sections, each with own hooks |
| `QuickScaffold.tsx` | 16 | 334 | Extract fetch/AI logic to useQuickScaffold |
| `security/page.tsx` | 15 | 443 | Extract form logic to useSecuritySettings |
| `DomainConfiguration.tsx` | 13 | 616 | Extract to useDomainConfig hook |
| `AnalyticsSettings.tsx` | 13 | 332 | Extract to useAnalyticsSettings hook |

## Compliant ✅
- Headers: unified `AppHeader` (no duplicates)
- User menu: unified `UserMenu` (no duplicates)
- Loading: unified `AppLoader` / `PageLoader`
- Help content: shared `HelpContent` component
- Constants: `EXTERNAL_URLS` centralized (Calendly URLs)
- Utils: `getInitials`, `formatDate`, `glassCard` shared
- Skeleton: `CardSkeleton` reusable

## Priority Order
1. **P0 Secrets** — Security risk. Move all secrets to API routes.
2. **P0 fetch in components** — Extract to hooks.
3. **P1 Split large files** — Start with landing page (2388 lines).
4. **P1 Split large hooks** — Start with useStreamingWebsiteGeneration (605 lines).
5. **P2 Heavy components** — Extract logic to hooks.
