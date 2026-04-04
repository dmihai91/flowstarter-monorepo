# Client Editor — Technical Plan

> Flowstarter's client-facing review & customization app.
> Separate Remix application at `apps/flowstarter-client`.

---

## 1. What the client editor is (and isn't)

The client editor is a **lightweight, scoped experience** for the expert (coach, therapist, freelancer) who hired Flowstarter to build their site. They arrive via a magic link after the team marks their site as ready for review.

### Client CAN

- **View their live site** — iframe of the published Cloudflare Pages URL (or Daytona preview URL if still in review)
- **Edit safe content fields** — headline, subheadline, tagline, description, contact details (via the existing `ClientQuickEditor` form pattern, writing directly to Convex `files` table)
- **Chat with scoped AI** — text/copy edits, color tweaks within the locked palette, section add/remove from a curated list
- **Add widgets** — Calendly booking embed, contact form, GA snippet, testimonials block, FAQ block from a pre-built widget library
- **Publish / re-publish** — deploy to Cloudflare Pages via `/api/publish`
- **View change history** — browse snapshots, restore a previous version

### Client CANNOT

- See raw code, file tree, or terminal output
- Access dev server controls, Daytona workspace management, or agent orchestration
- Change template or palette (locked from dashboard at `project.selectedTemplate` / `project.selectedPalette`)
- Access other projects (session is scoped to one `projectId` via `clientSessions` table)
- Use the full AI pipeline (no `api.agent-code`, no `api.build`, no `api.fix-build-error`)

---

## 2. Architecture decision: separate app vs restricted mode

**Recommendation: separate Remix app at `apps/flowstarter-client`.**

| Factor | Separate app | Restricted mode in flowstarter-editor |
|--------|-------------|--------------------------------------|
| Bundle size | No Monaco, no terminal, no agent tools — ~60% lighter | Tree-shaking helps but all code ships |
| Security surface | Team-only UI physically absent from client bundle | One missed `canViewCode` gate = code leak |
| Branding | Client-first design, no "team" chrome | Must hide/restyle team UI per role |
| Domain | `client.flowstarter.dev` or `{slug}.flowstarter.dev` | Same domain, routing prefix only |
| Maintenance | Separate deploy, separate CI | Single deploy but coupled releases |

The deciding factor: **the client editor's UX is fundamentally different**. It's a simple review/customize/publish flow, not a code editor. Sharing a shell with the team editor means constant feature-flag work and accidental leakage risk.

### What IS shared (via packages, not cross-app imports)

- `@flowstarter/editor-engine` — `publishing` subpath only (`createPagesProject`, `deployToPages`, `getDeploymentStatus`, `buildProject`, `downloadBundle`, `validateBundle`)
- `@flowstarter/flow-design-system` — all components, tokens, theme utils
- Convex schema + queries/mutations — same `convex/` directory (shared via workspace config or symlink)
- Auth patterns — `access.$token.tsx` route logic (copied and adapted, not imported cross-app)

### What is NOT shared

- `@flowstarter/editor-engine/daytona` — client editor never manages workspaces
- `@flowstarter/editor-engine/engine` — planner, block-registry, validator are team-only
- `@flowstarter/editor-engine/templates` — template cloning is team-only
- All `api.daytona.*`, `api.agent-code`, `api.build`, `api.fix-build-error`, `api.modify-site` routes
- Monaco editor, terminal components, agent orchestration UI

---

## 3. App structure

```
apps/flowstarter-client/
├── app/
│   ├── entry.client.tsx
│   ├── entry.server.tsx
│   ├── root.tsx                          # ClientLayout wrapper
│   ├── env.server.ts                     # Subset: CONVEX_URL, CLOUDFLARE_*, CLERK_*, HANDOFF_SECRET, MAIN_PLATFORM_URL
│   │
│   ├── routes/
│   │   ├── _index.tsx                    # Landing: "Sign in to access your site" or redirect if session exists
│   │   ├── access.$token.tsx             # Magic link validation + Google/Apple signup (adapted from editor)
│   │   ├── access.$token.complete.tsx    # Post-signup: link Clerk → client, create session, redirect
│   │   ├── project.$urlId.tsx            # Main client editor shell
│   │   ├── api.publish.ts               # POST — build + deploy to Cloudflare Pages
│   │   └── api.publish.status.$id.ts    # GET — poll deployment status (beta-simple approach)
│   │
│   ├── components/
│   │   ├── ClientLayout.tsx              # Shell: header (logo + project name + publish button), content area
│   │   ├── SitePreview.tsx               # Iframe: publishedUrl or Daytona previewUrl, cache-bust on republish
│   │   ├── ContentEditor.tsx             # Form-based content editing (evolved from ClientQuickEditor)
│   │   ├── ClientChat.tsx                # Scoped AI chat panel
│   │   ├── WidgetPicker.tsx              # Widget library modal
│   │   ├── PublishButton.tsx             # Trigger + inline status (reuses PublishDialog step logic)
│   │   ├── PublishDialog.tsx             # Multi-step publish progress (adapted from editor's PublishDialog)
│   │   ├── ChangeHistory.tsx             # Snapshot list + restore
│   │   └── RequestChange.tsx             # "This needs your site manager" fallback UI
│   │
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── clientSession.ts          # Read/write localStorage session tokens
│   │   │   └── serverAuth.ts             # Validate clientSession or Clerk session on server
│   │   ├── content/
│   │   │   └── clientEditableContent.ts  # Copied from editor: parseClientEditableContent, getClientEditableFiles
│   │   └── hooks/
│   │       ├── useClientSession.ts       # Hook: validate session, redirect if expired
│   │       └── useProject.ts             # Hook: Convex query for project + files
│   │
│   └── styles/
│       └── tailwind.css
│
├── convex/                               # Symlink or workspace ref to apps/flowstarter-editor/convex
├── public/
├── package.json                          # Remix, React, Convex, @flowstarter/editor-engine, @flowstarter/flow-design-system
├── remix.config.ts
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.ts
```

### Convex sharing strategy

The Convex backend is a single deployment — both apps talk to the same Convex instance. Options:

1. **Symlink** `apps/flowstarter-client/convex → apps/flowstarter-editor/convex` (simplest, works in monorepo)
2. **Extract** `packages/flowstarter-convex` (cleaner long-term, more upfront work)

For beta: symlink. Revisit extraction if a third app needs Convex access.

---

## 4. Auth flow (concrete steps)

### First-time access (magic link → signup → editor)

```
┌──────────────────────────────────────────────────────────────────────┐
│ 1. Team marks project ready                                         │
│    Dashboard: project.status → 'review' (or new 'ready_for_review') │
│    Dashboard: calls convex magicLinks.create({                      │
│      clientId, projectId, accessLevel: 'customize'                  │
│    })                                                                │
│    Returns: { token, url: '/access/{token}' }                       │
├──────────────────────────────────────────────────────────────────────┤
│ 2. Dashboard sends email to client                                   │
│    Link: https://client.flowstarter.dev/access/{token}              │
├──────────────────────────────────────────────────────────────────────┤
│ 3. Client clicks → /access/$token                                    │
│    Route calls convex magicLinks.validate({ token })                │
│    If client.hasClerkAccount → redirect to login flow               │
│    Else → show "Sign in with Google / Apple"                        │
├──────────────────────────────────────────────────────────────────────┤
│ 4. Client signs in via Google/Apple                                  │
│    Redirected to MAIN_PLATFORM_URL/sign-up?provider=google          │
│    After Clerk signup → redirected back to                          │
│    /access/{token}/complete?handoff={handoffToken}                  │
├──────────────────────────────────────────────────────────────────────┤
│ 5. /access/$token/complete                                           │
│    Fetches Clerk userId via handoff token                           │
│    Calls convex magicLinks.completeClientAccess({                   │
│      token, clerkUserId, signupMethod                               │
│    })                                                                │
│    Stores in localStorage:                                          │
│      flowstarter_mode = 'client'                                    │
│      flowstarter_client_session_token = {sessionToken}              │
│      flowstarter_project_url_id = {urlId}                           │
│    Redirects to /project/{urlId}                                    │
├──────────────────────────────────────────────────────────────────────┤
│ 6. /project/$urlId                                                   │
│    Validates session: convex magicLinks.validateClientSession({     │
│      sessionToken, projectUrlId                                     │
│    })                                                                │
│    If valid → render ClientLayout + SitePreview + ContentEditor     │
│    If invalid → show "Open this from your access link"              │
└──────────────────────────────────────────────────────────────────────┘
```

### Return visits

Client goes to `client.flowstarter.dev` → `_index.tsx` checks for stored session in localStorage → if valid, redirects to `/project/{urlId}`. If expired (30-day TTL on `clientSessions`), shows "Sign in" which re-validates via Clerk.

### Key Convex functions involved

| Function | File | Purpose |
|----------|------|---------|
| `magicLinks.create` | `convex/magicLinks.ts:194` | Generate token, default `accessLevel: 'customize'` |
| `magicLinks.validate` | `convex/magicLinks.ts:96` | Check token validity, return client + project info |
| `magicLinks.completeClientAccess` | `convex/magicLinks.ts:352` | Link Clerk user → client, create 30-day session |
| `magicLinks.validateClientSession` | `convex/magicLinks.ts:151` | Validate session token + project scope |
| `projects.getByUrlId` | `convex/projects.ts` | Load project data for the editor shell |
| `files.getProjectFiles` | `convex/files.ts` | Load all content files for editing |

---

## 5. The `/api/publish` route — what needs to change

### Current state

The route **already exists** at `apps/flowstarter-editor/app/routes/api.publish.ts` and is **fully functional** for team use:

1. Authenticates via Clerk (`getAuth`) + `hasServerTeamAccess` guard
2. Finds the Daytona sandbox for the project (via labels)
3. Calls `buildProject(sandbox)` → `downloadBundle(sandbox, outputDir)` → `validateBundle(files)`
4. Optionally stores bundle manifest in Supabase storage
5. Calls `createPagesProject(projectName, cfConfig)` → `deployToPages(projectName, files, cfConfig)`
6. Updates Convex: `projects.publish({ projectId, publishedUrl, customDomain, publishedBy })`
7. Returns `{ success, publishedUrl, deploymentId }`

### What needs to change for client editor

The existing route is **Daytona-dependent** — it builds inside a sandbox. The client editor won't have a running Daytona workspace. Two options:

#### Option A: Pre-build + file-based deploy (recommended for beta)

The team pre-publishes at least once (site is already built). Client edits only touch content files in Convex. On client re-publish:

1. Auth: validate `clientSession` token (not Clerk team access)
2. Load project files from Convex `files` table (`api.files.getProjectFiles`)
3. Skip Daytona build — files are already built HTML/CSS/JS stored in Convex
4. Validate bundle from Convex files
5. Deploy directly to Cloudflare Pages
6. Update Convex `project.publishedUrl` + `project.lastPublishedAt`

This works because Flowstarter templates produce **static sites** — the Convex `files` table contains the built output after the team's initial build.

#### Option B: Rebuild in ephemeral sandbox (future)

For content changes that require a rebuild (e.g., adding a new section):

1. Spin up a short-lived Daytona sandbox
2. Sync files from Convex → sandbox
3. Run `buildProject` → `downloadBundle` → deploy
4. Tear down sandbox

This is Phase 2+ complexity. For beta, Option A.

### Client editor `/api/publish` implementation

```
apps/flowstarter-client/app/routes/api.publish.ts

POST /api/publish { projectId }

1. Extract sessionToken from request headers (X-Client-Session-Token) or cookie
2. Validate session: convex magicLinks.validateClientSession
3. Check session.accessLevel is 'customize' or 'full'
4. Load files: convex files.getProjectFiles({ projectId })
5. Filter to deployable files (type === 'file', not isBinary or handle binary separately)
6. Convert to { path, content: Buffer } array
7. Validate: validateBundle(files)
8. Create/get CF project: createPagesProject(`fs-${project.urlId}`, cfConfig)
9. Deploy: deployToPages(projectName, files, cfConfig)
10. Update Convex: projects.publish({ projectId, publishedUrl, publishedBy: session.clientId })
11. Return { success: true, publishedUrl, deploymentId }
```

### PublishDialog status updates

Current `PublishDialog.tsx` uses a fake `setTimeout` for step progression (line 49). For beta, keep it simple:

- The `/api/publish` call is a single POST that returns when done
- Client-side shows `building → uploading → deploying` steps on a timer while waiting
- On response: jump to `done` or `error`

Future: add `/api/publish/status/$deploymentId` polling via `getDeploymentStatus()` for real progress.

---

## 6. Scoped AI chat — how it works differently

The client chat is **not** the full AI pipeline (`api.agent-code`, `api.editor-chat`). It's a constrained layer.

### Allowed intents

| Intent | Implementation | Example prompt |
|--------|---------------|----------------|
| Edit text/copy | LLM rewrites content field → updates Convex file | "Make the headline punchier" |
| Change section content | LLM regenerates section markdown/HTML within template structure | "Rewrite the About section" |
| Color tweak | LLM suggests palette-safe CSS variable swap | "Make the CTA button warmer" |
| Add pre-built section | Show section picker UI → inject template snippet into page | "Add a testimonials section" |
| Remove section | Identify section in content file → remove block | "Remove the pricing section" |
| Add widget | Open `WidgetPicker` UI | "Add my Calendly" |

### Disallowed intents

| Intent | Response |
|--------|----------|
| Restructure layout | "This change needs your site manager. Want to send a request?" |
| Change template | "Your site template is locked. Contact your Flowstarter team to discuss." |
| Generate new pages | "Page creation requires your site manager." |
| Run code / access terminal | Not exposed in UI; if asked in chat, politely decline |

### Implementation

```
ClientChat.tsx → POST /api/client-chat

1. Classify intent (simple LLM call with system prompt listing allowed/disallowed intents)
2. If allowed:
   a. For text edits: send targeted prompt to LLM with current content + instruction
   b. LLM returns updated content string
   c. Write to Convex files.updateContent({ projectId, path, content })
   d. Preview refreshes automatically (Convex subscription)
3. If widget/section add: return { action: 'show_widget_picker' } or { action: 'show_section_picker' }
4. If disallowed: return { action: 'request_change', message: '...' }
```

### No Daytona workspace needed

All changes are applied directly to Convex `files` table entries. The site preview (iframe) reloads from the published URL or shows an "unpublished changes" indicator prompting re-publish.

### LLM configuration

- Model: `claude-haiku-4-5` (fast, cheap, sufficient for copy edits)
- System prompt: hardcoded, includes the client's locked palette + template structure + allowed intents
- No agent loop, no tool use — single-turn LLM call returning the edited content string
- Token budget: ~4K input (content file + instruction), ~2K output (rewritten content)

---

## 7. Preview in client editor

### `SitePreview.tsx` — two modes

| Mode | When | Source |
|------|------|--------|
| Published | `project.publishedUrl` exists | `<iframe src={publishedUrl + '?_cb=' + project.publishedAt}>` |
| Pre-publish review | `project.workspaceUrl` exists, no `publishedUrl` | `<iframe src={workspaceUrl}>` (Daytona preview, read-only) |
| No preview | Neither exists | Placeholder: "Your site is being built. Check back soon." |

### Key behaviors

- **Cache-busting**: append `?_cb={publishedAt}` timestamp to iframe src on re-publish so the browser fetches the new version
- **No Daytona management**: the client editor reads `project.workspaceUrl` and `project.publishedUrl` from Convex. It never calls `api.daytona.*` routes.
- **Unpublished changes indicator**: if `files.updatedAt > project.publishedAt`, show a banner: "You have unpublished changes" with a Publish button
- **Responsive preview**: device-width toggle (desktop/tablet/mobile) via iframe width constraints
- **Open in new tab**: "Open Site" link to `publishedUrl` (same pattern as existing `ClientQuickEditor` line 242-249)

---

## 8. Widget library (MVP scope)

Pre-built widgets the client can add without AI generation. Each widget = a self-contained HTML/CSS/JS snippet injected into a designated widget slot in the template.

### MVP widgets

| Widget | Config UI | Injection |
|--------|-----------|-----------|
| **Booking (Calendly)** | Client enters Calendly URL | `<div class="calendly-inline-widget" data-url="{url}"></div>` + Calendly embed script |
| **Contact form** | Pre-built: name, email, message fields | Static HTML form, `action="https://formspree.io/f/{formId}"` or mailto fallback |
| **Testimonials block** | Client adds 2-5 testimonials (name, role, quote, optional photo) via form | Generates styled testimonial cards HTML |
| **FAQ block** | Client adds Q&A pairs via form | Generates `<details><summary>` accordion HTML |
| **Newsletter signup** | Client enters Mailchimp list URL (if connected) | Email input + Mailchimp embed form |

### Implementation

```typescript
// WidgetPicker.tsx
interface Widget {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  configFields: WidgetConfigField[];     // What the client fills in
  generateSnippet: (config: Record<string, string>) => string;  // Returns HTML to inject
}

// On "Add Widget":
// 1. Client picks widget → fills config form
// 2. generateSnippet(config) → HTML string
// 3. Inject into content file at designated <!-- widget:booking --> slot
// 4. Write to Convex files.updateContent
// 5. "Publish to see changes live"
```

### No code generation needed

Widgets are **pre-written snippets with variable interpolation**, not AI-generated code. This keeps them reliable and fast.

---

## 9. Build order

### Phase 1 — Unblock beta (1 week)

| # | Task | Detail | Effort |
|---|------|--------|--------|
| 1 | **Client `/api/publish` route** | File-based deploy from Convex (no Daytona). Auth via clientSession token. Uses `@flowstarter/editor-engine/publishing` — `validateBundle`, `createPagesProject`, `deployToPages`. Update `projects.publish` in Convex. | 1.5 days |
| 2 | **Fix `canPublish` for client role** | In `useEditorRole.ts:29`, change `canPublish: role === 'team'` → `canPublish: true` (both roles can publish). OR: create a separate `useClientPermissions` hook in the client app that hardcodes `canPublish: true`. | 30 min |
| 3 | **Dashboard: "Send to client" button** | In `flowstarter-main` team dashboard: button that calls `magicLinks.create`, sets `project.status → 'review'`, copies magic link URL. Email integration (SendGrid/Resend) sends the link to `client.email`. | 1 day |
| 4 | **Scaffold client app** | `apps/flowstarter-client`: Remix + Vite app, `access.$token` + `access.$token.complete` routes (adapted from editor), `/project/$urlId` route rendering `SitePreview` + `PublishButton` + basic `ContentEditor`. | 2 days |
| 5 | **End-to-end test** | Create magic link → open in incognito → sign up → see preview → edit headline → publish → verify Cloudflare Pages URL. | 0.5 day |

**Phase 1 deliverable**: a client can receive a link, sign in, see their site, edit content fields, and publish.

### Phase 2 — Client experience (1-2 weeks)

| # | Task | Detail | Effort |
|---|------|--------|--------|
| 6 | **Scoped chat** | `ClientChat.tsx` + `api.client-chat.ts`. Intent classifier + single-turn LLM for text edits. No agent pipeline. | 3 days |
| 7 | **Widget picker** | `WidgetPicker.tsx` with Calendly embed + contact form as MVP. Template widget slots (`<!-- widget:* -->`). | 2 days |
| 8 | **Change history** | `ChangeHistory.tsx`: list `snapshots` by project, show name/date/description. "Restore" button re-writes files from snapshot blob. | 1.5 days |
| 9 | **"Request a change" fallback** | When scoped chat rejects an intent: show `RequestChange.tsx` form → creates a record in a new `changeRequests` Convex table (or sends email to Darius). | 1 day |

**Phase 2 deliverable**: client can chat to refine copy, add Calendly/contact form, browse history, and escalate out-of-scope requests.

### Phase 3 — Polish (before public launch)

| # | Task | Detail | Effort |
|---|------|--------|--------|
| 10 | **Custom subdomain routing** | `{slug}.flowstarter.dev` → Cloudflare Pages custom domain via API. DNS: wildcard CNAME `*.flowstarter.dev → pages.dev`. | 2 days |
| 11 | **Client onboarding tour** | First-visit guided tour (tooltip sequence): "Here's your site" → "Edit content here" → "Publish when ready". | 1 day |
| 12 | **Responsive preview toggle** | Desktop/tablet/mobile width presets for the iframe. | 0.5 day |
| 13 | **Re-publish from rebuild** | Option B from section 5: ephemeral Daytona sandbox for structural changes. Needed when section add/remove requires a real build. | 3 days |

---

## 10. What NOT to build for beta

- **Real-time collaborative editing** — one client, one project, no conflicts to resolve
- **Client-side code editor** — no Monaco, no file tree, no syntax highlighting
- **Full AI agent pipeline** — Phase 2 scoped chat is sufficient; no `claude-agent-sdk`, no MCP tools
- **Mobile app** — responsive web is enough
- **Multiple client users per project** — one `clientId` per `projectId` for now
- **Client billing portal** — Stripe is team-facing; clients don't manage their own subscription
- **Template marketplace / switching** — clients get one template, locked by the team
- **Custom CSS editor** — out of scope; clients use the palette the team set
- **Analytics dashboard** — just a GA snippet widget for now
- **A/B testing** — not for beta

---

## 11. Open questions

| # | Question | Options | Recommendation |
|---|----------|---------|----------------|
| 1 | **Domain strategy** | (a) `client.flowstarter.dev` — one subdomain, all clients via `/project/$urlId` routing. (b) `{slug}.flowstarter.dev` — per-project subdomain. | Start with (a) for beta. Add (b) in Phase 3 — it requires wildcard DNS + Cloudflare custom domain API. |
| 2 | **Preview before first publish** | (a) Show Daytona workspace URL (requires workspace to stay running). (b) Team pre-publishes before handoff so client always has a Cloudflare Pages URL. | (b) — team should always publish once before sending the magic link. Add a guard: "Send to client" button disabled if `!project.publishedUrl`. |
| 3 | **First publish ownership** | Does the team always pre-publish, or can a client's first action be "Publish"? | Team pre-publishes. Client's publish is always a re-publish of an already-live site. Simplifies the flow and guarantees the client sees something immediately. |
| 4 | **Out-of-scope request handling** | (a) Email notification to Darius. (b) In-app `changeRequests` table + notification. (c) Both. | (b) for beta — create a `changeRequests` Convex table. Add email notification in Phase 3 when volume warrants it. |
| 5 | **Template lock** | Can the client ever request a template change? | No for beta. If requested, it goes through "Request a change" → team handles manually. |
| 6 | **Session duration** | Current: 30 days (`clientSessions.expiresAt`). Is this right? | 30 days is fine for beta. Add a "Remember me" option later if needed. |
| 7 | **Convex sharing** | Symlink `convex/` directory or extract to `packages/flowstarter-convex`? | Symlink for beta. Extract when a third consumer appears. |

---

## 12. Effort estimate

| Component | Effort | Owner | Depends on |
|-----------|--------|-------|------------|
| Client `/api/publish` route (file-based, no Daytona) | 1.5 days | Darius | `editor-engine/publishing` tested against real Cloudflare account |
| `canPublish` permission fix | 30 min | Darius | — |
| Dashboard "Send to client" button + email | 1 day | Darius | `magicLinks.create` mutation (exists), email provider (SendGrid/Resend) |
| Client app scaffold (Remix + routes + `SitePreview` + `ContentEditor`) | 2 days | Darius | `/api/publish` route, Convex symlink |
| E2E test: magic link → sign up → edit → publish | 0.5 day | Darius | Client app scaffold |
| **Phase 1 total** | **~5.5 days** | | |
| Scoped AI chat (`ClientChat` + `api.client-chat`) | 3 days | Darius | Anthropic API key, intent classifier prompt |
| Widget picker (Calendly + contact form) | 2 days | Darius | Template widget slot convention |
| Change history (snapshot list + restore) | 1.5 days | Darius | `snapshots` table queries |
| "Request a change" fallback | 1 day | Darius | `changeRequests` Convex table (new) |
| **Phase 2 total** | **~7.5 days** | | |
| Custom subdomain routing | 2 days | Darius | Cloudflare API, DNS wildcard |
| Client onboarding tour | 1 day | Darius | Client app scaffold |
| Responsive preview toggle | 0.5 day | Darius | `SitePreview` component |
| Ephemeral sandbox rebuild | 3 days | Darius | Daytona SDK, `editor-engine/daytona` |
| **Phase 3 total** | **~6.5 days** | | |

**Total: ~19.5 working days (4 weeks) from scaffold to polished launch.**
Phase 1 alone unblocks beta in 1 week.
