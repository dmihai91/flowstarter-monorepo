# WARP.md

This file provides guidance to WARP (warp.dev) and AI models when working with code in this repository.

---

## Project Overview

**Flowstarter** is an AI-powered business website building platform that combines professional templates with multi-agent AI code generation and real-time analytics.

### Core Purpose

- Generate custom websites using AI agents (AG2 framework)
- Provide professional templates (Personal Brand, Local Business, SaaS Product)
- Real-time streaming progress during website generation (SSE)
- Built-in analytics, lead management, and domain integration

---

## Tech Stack

### Frontend

| Technology    | Version | Purpose                             |
| ------------- | ------- | ----------------------------------- |
| Next.js       | 15.3    | React framework with App Router     |
| React         | 19.1    | UI library with concurrent features |
| TypeScript    | 5.9     | Type-safe JavaScript                |
| Tailwind CSS  | 4.1     | Utility-first styling               |
| Shadcn/UI     | -       | 40+ Radix UI components             |
| Zustand       | 4       | Global state management             |
| React Query   | 5       | Server state management             |
| Framer Motion | -       | Animations                          |
| Recharts      | -       | Data visualization                  |

### Backend & Database

| Technology         | Purpose                                                  |
| ------------------ | -------------------------------------------------------- |
| Supabase           | PostgreSQL database with RLS, Auth helpers               |
| Convex             | Real-time database for generation state & agent sessions |
| Clerk              | Authentication (SSO, OAuth, magic links)                 |
| Next.js API Routes | REST API endpoints                                       |

### AI & Code Generation

| Technology              | Purpose                               |
| ----------------------- | ------------------------------------- |
| AG2 Framework (AutoGen) | Multi-agent orchestration             |
| FastAPI (Python)        | Coding agent service backend          |
| Vercel AI SDK           | Unified AI provider interface         |
| Anthropic Claude 3.5    | Primary AI for code generation        |
| OpenAI GPT-4/5          | Alternative provider, logo generation |
| Groq                    | Fast inference alternative            |
| xAI Grok                | Additional AI provider                |

### Infrastructure

| Technology  | Purpose                                           |
| ----------- | ------------------------------------------------- |
| Vercel      | Hosting with edge functions                       |
| Arcjet      | Rate limiting, bot detection, and security shield |
| UploadThing | File uploads with CDN                             |
| GoDaddy API | Domain availability and pricing                   |
| Daytona     | Code workspace and live preview                   |

---

## Project Structure

```
flowstarter/
├── src/                          # Next.js Frontend (TypeScript)
│   ├── app/                      # App Router pages and API routes
│   │   ├── (dynamic-pages)/      # Route groups
│   │   │   ├── (login-pages)/    # Auth pages
│   │   │   └── (main-pages)/     # Protected pages
│   │   │       └── (logged-in-pages)/
│   │   │           ├── dashboard/    # Main dashboard
│   │   │           │   ├── new/      # Project wizard
│   │   │           │   ├── templates/
│   │   │           │   └── integrations/
│   │   │           ├── profile/
│   │   │           └── projects/
│   │   └── api/                  # API Routes (see API section)
│   ├── components/               # Reusable UI components
│   │   ├── assistant/            # AI assistant UI
│   │   ├── auth/                 # Auth components
│   │   └── ui/                   # Shadcn components
│   ├── hooks/                    # Custom React hooks (40+ files)
│   ├── lib/                      # Utilities, services, configs
│   │   └── ai/                   # AI configurations
│   ├── store/                    # Zustand stores
│   │   ├── wizard-store.ts       # Project wizard state
│   │   ├── draft-store.ts        # Draft persistence
│   │   └── ai-suggestions-store.ts
│   ├── types/                    # TypeScript definitions
│   ├── data/                     # Database operations
│   ├── supabase-clients/         # Supabase client instances
│   └── generated-types.ts        # Auto-generated Supabase types
│
├── coding-agent/                 # AI Coding Service (Python)
│   ├── src/
│   │   ├── main.py               # FastAPI entry point
│   │   ├── ag2/                  # AG2 agent implementations
│   │   │   ├── orchestrator.py   # Multi-agent orchestration
│   │   │   ├── planner.py        # Product manager agent
│   │   │   ├── code_generator.py # Code engineer agent
│   │   │   ├── code_reviewer.py  # Review agent
│   │   │   └── error_fixer.py    # QA engineer agent
│   │   ├── llm_router.py         # Multi-provider LLM routing
│   │   ├── routers/              # FastAPI routers
│   │   ├── convex_integration/   # Convex state sync
│   │   ├── daytona/              # Daytona workspace integration
│   │   └── services/             # Business logic services
│   ├── config.yaml               # Agent configuration
│   └── requirements.txt          # Python dependencies
│
├── convex/                       # Convex Backend
│   ├── schema.ts                 # Database schema
│   ├── generationSessions.ts     # Wizard session mutations
│   ├── codingAgentState.ts       # Agent state mutations
│   ├── sites.ts                  # Site storage mutations
│   ├── siteVersions.ts           # Version management
│   └── aguiSessions.ts           # AG-UI protocol sessions
│
├── supabase/                     # Supabase Configuration
│   ├── migrations/               # SQL migrations
│   └── config.toml               # Local config
│
├── templates/                    # Website Templates
│   ├── local-business-pro/
│   ├── personal-brand-pro/
│   └── saas-product-pro/
│
├── e2e/                          # Playwright E2E tests
└── docs/                         # Documentation
```

---

## Development Commands

### Essential Commands

- `pnpm dev` - Start Next.js + Convex development server
- `pnpm dev:coding-agent` - Start Python coding agent service
- `pnpm dev:all` - Start everything together
- `pnpm build` - Build the application for production
- `pnpm start` - Start production server
- `pnpm test` - Run unit tests with Vitest
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:e2e` - Run end-to-end tests with Playwright

### Code Quality

- `pnpm lint` - Run ESLint and Prettier
- `pnpm lint:fix` - Fix ESLint issues automatically
- `pnpm lint:prettier` - Format code with Prettier
- `pnpm tsc` - Type check with TypeScript

### Database Operations

#### Supabase

- `pnpm db:start` - Start local Supabase instance
- `pnpm db:link` - Link to remote Supabase project
- `pnpm db:push` - Push schema changes to database
- `pnpm db:pull` - Pull schema changes from remote
- `pnpm db:reset` - Reset local database
- `pnpm gen:types` - Generate TypeScript types from Supabase schema

#### Convex

- `pnpm convex:start` - Start Convex dev server
- `pnpm convex:deploy` - Deploy to production
- `pnpm convex:reset` - Reset Convex data

### Template Development

- `pnpm gen:thumbs` - Generate template thumbnails (automatically serves on port 3105)
- `PORT=3000 BASE_URL=http://localhost:3000 SKIP_SERVE=1 pnpm gen:thumbs` - Generate thumbnails using existing dev server
- `pnpm gen:previews` - Build template previews

### Testing Individual Components

- `pnpm test src/path/to/file.test.ts` - Run specific test file
- `pnpm test:e2e tests/specific.spec.ts` - Run specific E2E test

---

## API Routes

### AI Generation (`/api/ai/`)

| Route                              | Method | Purpose                        |
| ---------------------------------- | ------ | ------------------------------ |
| `/api/ai/agent`                    | POST   | Direct agent invocation        |
| `/api/ai/agent/stream`             | POST   | Streaming agent response (SSE) |
| `/api/ai/pipelines/site`           | POST   | Full site generation pipeline  |
| `/api/ai/generate-website`         | POST   | Website generation             |
| `/api/ai/generate-logo`            | POST   | AI logo generation (OpenAI)    |
| `/api/ai/generate-project-details` | POST   | AI project suggestions         |
| `/api/ai/moderate`                 | POST   | Content moderation             |
| `/api/ai/classify-project`         | POST   | Project classification         |
| `/api/ai/evaluate-description`     | POST   | Description quality scoring    |
| `/api/ai/enhance-preview`          | POST   | Preview enhancement            |
| `/api/ai/template-agent`           | POST   | Template customization agent   |

### Projects (`/api/projects/`)

| Route                      | Method           | Purpose              |
| -------------------------- | ---------------- | -------------------- |
| `/api/projects`            | GET, POST        | List/create projects |
| `/api/projects/[id]`       | GET, PUT, DELETE | Project CRUD         |
| `/api/projects/draft`      | GET, POST, PUT   | Draft management     |
| `/api/projects/check-name` | POST             | Name availability    |

### Integrations (`/api/integrations/`)

| Route                                  | Purpose                            |
| -------------------------------------- | ---------------------------------- |
| `/api/integrations/google-analytics/*` | Google Analytics OAuth + resources |
| `/api/integrations/calendly/*`         | Calendly OAuth + resources         |
| `/api/integrations/mailchimp/*`        | Mailchimp OAuth + resources        |

### Other Routes

| Route                                 | Purpose                       |
| ------------------------------------- | ----------------------------- |
| `/api/domains/availability`           | Domain availability (GoDaddy) |
| `/api/local-templates`                | Local template listing        |
| `/api/uploadthing`                    | File upload handling          |
| `/api/feedback`                       | User feedback submission      |

---

## Database Schema

### Supabase (PostgreSQL)

Primary data store for persistent business data:

- **Users** - Managed via Clerk authentication
- **Projects** - Website projects with configurations
- **Deployments** - Published site deployments
- **Analytics** - Visitor tracking and metrics
- **Domains** - Domain availability cache

Types are auto-generated: `pnpm gen:types` → `src/generated-types.ts`

### Convex (Real-time)

Real-time state for generation sessions and agent execution:

```typescript
// Key tables:
generationSessions; // Wizard flow state
wizardUIState; // UI state for wizard
sessionDesignConfig; // Design choices
codingAgentSessions; // Agent execution runs
agentExecutionSteps; // Step-by-step progress
agentLLMInteractions; // LLM call logs
agentGeneratedFiles; // Generated file metadata
sites; // Generated site storage
siteVersions; // Version snapshots (gzipped)
aguiSessions; // AG-UI protocol sessions
```

---

## Coding Agent Architecture

### Multi-Agent System (AG2)

```
┌─────────────────────────────────────────┐
│     Product Manager Agent               │
│     Creates technical plans             │
└──────────────┬──────────────────────────┘
               ↓
┌──────────────┴──────────────────────────┐
│     Code Engineer Agent                 │
│     Generates TypeScript/React code     │
└──────────────┬──────────────────────────┘
               ↓
┌──────────────┴──────────────────────────┐
│     Code Reviewer Agent                 │
│     Reviews for quality & best practices│
└──────────────┬──────────────────────────┘
               ↓
┌──────────────┴──────────────────────────┐
│     QA Engineer Agent                   │
│     Debugs and fixes issues             │
└─────────────────────────────────────────┘
```

### LLM Router

```python
# coding-agent/src/llm_router.py
# Supports: Anthropic, OpenAI, Groq, xAI
# Primary: Claude 3.5 Sonnet for code generation
# Fallback: GPT-4 for alternative generation
```

### Streaming Progress (SSE)

Real-time updates via Server-Sent Events:

- Step progress updates
- File generation notifications
- Error reporting
- Preview URL delivery

---

## State Management

### Zustand Stores (`src/store/`)

```typescript
// wizard-store.ts - Project creation wizard
interface WizardStore {
  currentStep: WizardStep;
  projectDetails: ProjectDetails;
  templateId: string | null;
  designConfig: DesignConfig;
  // ... actions
}

// draft-store.ts - Auto-save draft persistence
// ai-suggestions-store.ts - AI recommendation cache
```

### Convex Real-time Sync

Generation state syncs between:

- Frontend (React) ↔ Convex (real-time DB) ↔ Coding Agent (Python)

---

## Configuration

### Path Aliases

```typescript
// tsconfig.json paths
"@/*"       → "./src/*"
"@public/*" → "./public/*"
```

### Environment Variables

**Required:**

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- `ANTHROPIC_API_KEY` (primary AI)
- `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`

**Optional:**

- `OPENAI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`
- `GODADDY_API_KEY`, `GODADDY_API_SECRET`
- `UPLOADTHING_SECRET`, `UPLOADTHING_APP_ID`
- `ARCJET_KEY` (rate limiting and security)

---

## AI Development Rules (MANDATORY)

All AI models working on this codebase MUST adhere to the following requirements:

### Type Safety Requirements

- **All code must be fully type-safe** - No `any` types unless absolutely unavoidable and documented
- Use TypeScript strict mode patterns even though `strict: false` is set in tsconfig
- **Always define explicit types** for:
  - Function parameters and return types
  - React component props (use interfaces)
  - State variables and hooks
  - API request/response payloads
  - Database query results
- Leverage the generated Supabase types from `src/generated-types.ts`
- Use Zod schemas for runtime validation where appropriate
- Prefer `unknown` over `any` when type is truly unknown, then narrow with type guards

```typescript
// ✅ Good - Explicit types
interface UserProps {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<UserProps> {
  // implementation
}

// ❌ Bad - Implicit or any types
function getUser(id) {
  // implementation
}
```

### Unit Testing Requirements

- **Every new feature, function, hook, or component MUST have accompanying unit tests**
- Test files should be co-located with the source file: `ComponentName.test.tsx` or `utils.test.ts`
- Use **Vitest** with **React Testing Library** for all tests
- Minimum test coverage expectations:
  - All utility functions: 100%
  - All custom hooks: 100%
  - All components: Critical paths and user interactions
  - All API routes: Request/response handling

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly with default props', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const onClickMock = vi.fn();
    render(<MyComponent title="Test" onClick={onClickMock} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onClickMock).toHaveBeenCalledOnce();
  });
});
```

### Before Submitting Code

Every code change must pass these checks:

```bash
pnpm tsc        # Type checking
pnpm lint       # Linting
pnpm test       # Unit tests
```

### UI Design Standards

- Use minimalistic and professional UI design
- Dashboard cards use glass backgrounds:
  - Light mode: `rgba(243, 243, 243, 0.30)`
  - Dark mode: `rgba(58, 58, 74, 0.30)`
- Prefer shadcn/ui autocomplete component over custom implementations

### Internationalization (i18n) Requirements

- **All user-facing strings MUST use the `t()` translation function** - no hardcoded text in components
- Import translations via `useTranslations` from `@/lib/i18n` (aliased from `useI18n`)
- Translation file: `src/locales/en.ts` (English), `src/locales/ro.ts` (Romanian)
- Use dot-notation keys organized by feature: `'section.subsection.key'`
- Support interpolation with `{placeholder}` syntax: `t('greeting', { name: 'John' })`
- **Exceptions** (do NOT translate):
  - Technical identifiers, URLs, code snippets
  - Third-party brand names (e.g. "GitHub", "Vercel")
  - `aria-label` values that are already descriptive English strings for accessibility

```typescript
import { useTranslations } from '@/lib/i18n';

// ✅ Good - Using translations
const { t } = useTranslations();
<h1>{t('dashboard.welcome')}</h1>
<p>{t('dashboard.projectCount', { count: projects.length })}</p>

// ❌ Bad - Hardcoded strings
<h1>Welcome to your dashboard</h1>
<p>You have {projects.length} projects</p>
```

---

## Component Architecture (SRP + DRY)

### Presentational Components
- Components MUST be purely presentational — rendering UI only
- All business logic (state, effects, data transformation) goes in custom hooks
- Max 250 lines per component file; split into sub-components if larger

### Hooks
- Custom hooks handle all state management, side effects, and data transformation
- Each hook should have a single responsibility
- All hooks must have unit tests in `__tests__/` sibling directory
- Hook test pattern: `vitest` + `@testing-library/react` `renderHook`

### Design System
- Use `@flowstarter/flow-design-system` components (`GlassCard`, `FlowBackground`, `GlassPanel`, etc.)
- Do NOT hand-roll glassmorphism or flow line patterns — use the design system
- Available variants for `FlowBackground`: `dashboard`, `editor`, `landing`, `wizard`

### Styling Conventions
- Use CSS custom properties from `theme-colors.css` for gradients and brand colors
- Page backgrounds: use the `.page-gradient` utility class (not hardcoded Tailwind gradients)
- Button gradients: `from-[var(--landing-btn-from)] via-[var(--landing-btn-via)]` (not hardcoded hex values)
- Icons: always use Lucide React — never inline SVGs or emoji for UI icons
- No em dashes in user-facing text — use commas or ` - ` instead

### DRY Patterns
- Extract repeated card/list patterns into reusable components
- Reuse existing hooks (`useScrollAnimation`, `useI18n`, `useLocalStorage`) rather than duplicating logic

### No Dead Code
- Remove unused translation keys, CSS classes, and components
- No backwards-compatibility shims for removed code

---

## Summary: Non-negotiable Requirements

**All AI-generated code must:**

1. ✅ Full TypeScript type safety - no implicit `any`
2. ✅ Unit tests for all new code using Vitest
3. ✅ Pass `pnpm tsc` and `pnpm lint` checks
4. ✅ Follow existing codebase patterns and conventions
5. ✅ Use existing libraries (Shadcn/UI, Zustand, React Query)
6. ✅ Sync with both Supabase and Convex where appropriate

---

## Development Workflow

### Setting Up New Features

1. Create feature branch from main
2. Use `pnpm dev` for development with hot reload
3. Add tests in `src/` directory alongside implementation
4. Run `pnpm lint` before committing
5. Use `pnpm test:e2e` for integration testing

### Template Development

1. Create new template in `/templates/new-template-name/`
2. Include standard Next.js structure with `package.json`, `README.md`
3. Use template variables: `{{PROJECT_NAME}}`, `{{PROJECT_DESCRIPTION}}`, etc.
4. Update `src/data/project-templates.ts` to register new template
5. Test with `pnpm gen:thumbs` to generate preview images

### Database Changes

1. Make schema changes in Supabase Studio or migration files
2. Run `pnpm db:push` to apply changes
3. Run `pnpm gen:types` to update TypeScript definitions
4. Update affected data operations in `src/data/`

### Convex Schema Changes

1. Update `convex/schema.ts` with new tables/fields
2. Run `pnpm convex:start` to apply changes
3. Update mutations/queries in `convex/*.ts`

### AI Features

When working with AI functionality:

- AI routes are in `src/app/api/ai/`
- Multiple providers supported (OpenAI, Anthropic, Groq, xAI)
- Moderation pipeline available for content filtering
- Rate limiting and security implemented via Arcjet (shield, bot detection, rate limits)
- Coding agent service in `coding-agent/` (Python/FastAPI)

---

## 🔒 Security Requirements (CRITICAL - 10+/10 Standard)

**All code must achieve enterprise-grade security.**

### Input Validation

```typescript
// ✅ CORRECT: Validate ALL inputs
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const templateIdRegex = /^[a-zA-Z0-9_-]+$/

function validateInput(email: string, name: string): boolean {
  if (!emailRegex.test(email)) return false
  if (!name || name.length > 100) return false
  return true
}

// ❌ WRONG: No validation
function saveData(data: any) {
  await db.insert(data) // Dangerous!
}
```

**Validation Rules:**
- Email: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Names: max 100 chars
- Messages: max 1000 chars
- UUIDs: standard format validation
- Template IDs: `/^[a-zA-Z0-9_-]+$/`, max 64 chars

### XSS Prevention

```typescript
// ✅ CORRECT: React auto-escapes
<div>{userContent}</div>

// ❌ WRONG: XSS vulnerability
<div dangerouslySetInnerHTML={{ __html: userContent }} />
```

**Rules:**
- NEVER use `dangerouslySetInnerHTML`
- Rely on React's automatic escaping
- Escape HTML entities in server responses

### Path Traversal Protection

```typescript
// ✅ CORRECT: Allowlist
const ALLOWED_IDS = new Set(['id1', 'id2'])
if (!ALLOWED_IDS.has(id)) throw new Error('Invalid ID')

// ❌ WRONG: User-controlled path
fs.readFileSync(`./data/${userInput}.json`) // Path traversal!
```

**Rules:**
- Use allowlists for resource access
- Validate IDs with regex patterns
- Never construct file paths from user input
- Use `path.resolve()` and verify within base directory

### API Security

```typescript
// ✅ CORRECT: Require auth
import { requireAuth } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response
  // Proceed
}

// ❌ WRONG: No auth
export async function GET() {
  return NextResponse.json(await getSecretData())
}
```

**Rules:**
- Use `requireAuth()` for protected routes
- Use `requireAuthWithSupabase()` for DB access
- Return 401 (unauthenticated) or 403 (unauthorized)
- Log security events with anonymized IPs

### Secrets Management

```typescript
// ✅ CORRECT
const key = process.env.API_KEY

// ❌ WRONG
const key = 'sk-hardcoded123' // NEVER!
```

**Rules:**
- Environment variables only
- Never log secrets
- Use `crypto.timingSafeEqual()` for comparison
- Rotate leaked keys immediately

### SQL Injection Prevention

```typescript
// ✅ CORRECT: Parameterized
const { data } = await supabase
  .from('projects')
  .select('*')
  .eq('id', userId)

// ❌ WRONG: Concatenation
const sql = `SELECT * FROM projects WHERE id = '${userId}'`
```

**Rules:**
- Use Supabase client (auto-parameterizes)
- Never build SQL strings manually
- Validate all parameters

### GDPR & Privacy

```typescript
// ✅ CORRECT: Anonymize
function anonymizeIP(ip: string): string {
  return ip.split('.').slice(0, 3).join('.') + '.0'
}

// ❌ WRONG: Log PII
console.log('User email:', email) // GDPR violation!
```

**Rules:**
- Anonymize IPs (IPv4: last octet; IPv6: last 80 bits)
- Don't log emails or PII
- Truncate user input in logs (50 chars max)
- Add GDPR consent to forms
- Link to privacy policy

### Security Headers

**All responses must include:**
```typescript
'X-Content-Type-Options': 'nosniff'
'X-Frame-Options': 'SAMEORIGIN'
'Referrer-Policy': 'strict-origin-when-cross-origin'
'Content-Security-Policy': `script-src 'nonce-${nonce}'` // No unsafe-inline!
'Vary': 'Accept-Encoding' // For cached responses
```

Use middleware helpers: `applySecurityHeaders()` from `src/utils/security-headers.ts`

### Security Checklist

**Before committing:**

- [ ] All inputs validated
- [ ] No `dangerouslySetInnerHTML`
- [ ] No user input in file paths
- [ ] API routes use `requireAuth()`
- [ ] No secrets in code
- [ ] Parameterized queries only
- [ ] Forms have GDPR consent
- [ ] IPs anonymized in logs
- [ ] Security headers present
- [ ] CSP uses nonces
- [ ] Run: `security-tests/run-tests.ps1`

### Security Resources

- `src/lib/path-validation.ts` - Input validation utilities
- `src/lib/api-auth.ts` - Authentication helpers
- `src/utils/security-headers.ts` - Security header application
- `src/middleware.ts` - Rate limiting, CORS, CSRF
- `security-tests/run-tests.ps1` - Automated security tests
