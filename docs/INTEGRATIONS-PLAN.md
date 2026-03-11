# Integrations & Publishing Roadmap

## Current State
- IntegrationsPanel exists (booking: Calendly/Cal.com, newsletter: Mailchimp/ConvertKit)
- PublishDialog exists (Cloudflare Pages shell, not wired)
- Supabase has domain_type, domain_provider fields
- Generated sites are static Astro (easy to deploy anywhere)

## Phase 1: Calendly Integration (Post-build, no LLM cost)

**How it works:** Inject Calendly embed into the generated contact page.
No AI needed — it's a deterministic code injection.

### Implementation:
1. During onboarding, collect Calendly URL (IntegrationsPanel already does this)
2. Store in Convex project config: `integrations.booking.url`
3. After site generation, inject Calendly widget:
   - Add `<script src="https://assets.calendly.com/assets/external/widget.js">` to Layout.astro
   - Replace contact form in contact.astro with Calendly inline embed
   - `<div class="calendly-inline-widget" data-url="USER_CALENDLY_URL" style="min-width:320px;height:700px;"></div>`
4. This is a post-processing step in api.build.ts (no LLM call)

### Cost: $0.00 (deterministic injection)

## Phase 2: Analytics Integration (Post-build, no LLM cost)

**How it works:** Inject GA4/Plausible/Fathom script into Layout.astro head.

### Implementation:
1. Collect analytics ID during onboarding or settings
2. Store in Convex: `integrations.analytics.provider` + `integrations.analytics.id`
3. Post-processing injects into Layout.astro `<head>`:

   **Google Analytics (GA4):**
   ```html
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>
   <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-XXXXXXX');</script>
   ```

   **Plausible (privacy-first, recommended):**
   ```html
   <script defer data-domain="clientsite.com" src="https://plausible.io/js/script.js"></script>
   ```

### Cost: $0.00 (deterministic injection)

## Phase 3: Domain Provisioning (3 tiers)

### Tier 1: Platform subdomain (free, immediate)
- `clientname.flowstarter.site`
- Deploy to Cloudflare Pages with custom subdomain
- DNS: CNAME clientname.flowstarter.site → pages project
- SSL: automatic via Cloudflare

### Tier 2: Client's custom domain (included in €39/mo)
- Client provides their domain (e.g., elenabeauty.ro)
- We add it to Cloudflare Pages custom domains
- Client updates DNS: CNAME @ → our Pages project
- SSL: automatic via Cloudflare
- Verification: TXT record for ownership

### Tier 3: Domain purchase (future, premium)
- Buy domain via Cloudflare Registrar API
- Auto-configure DNS + SSL
- Additional cost passed through

### Publishing Flow:
1. Build finishes → files in Convex + Daytona preview
2. User clicks "Publish" → PublishDialog
3. Options: a) flowstarter.site subdomain, b) custom domain
4. For (a): API creates Cloudflare Pages project, uploads files, returns URL
5. For (b): Same + custom domain setup with DNS instructions
6. Store published URL in Supabase: `published_url`, `published_at`

### API Needed:
- `POST /api/publish` → build static site, upload to Cloudflare Pages
- `POST /api/domain/check` → verify domain availability/ownership
- `POST /api/domain/configure` → add custom domain to CF Pages

### Cloudflare Pages API:
- Create project: `POST /client/v4/accounts/{id}/pages/projects`
- Upload: `POST /client/v4/accounts/{id}/pages/projects/{name}/deployments`
- Custom domain: `POST /client/v4/accounts/{id}/pages/projects/{name}/domains`

## Priority Order
1. **Calendly** — highest client value, zero cost, 1-2 hours
2. **Analytics** — Plausible snippet, zero cost, 30 min
3. **Platform subdomain** — makes demos shareable, 1 day
4. **Custom domain** — needed for go-live, 1 day
5. **Domain purchase** — premium feature, later

## Integration Injection Architecture

All integrations are post-processing steps in api.build.ts:

```
Agent SDK generates files
    ↓
fixContentImports() — existing
    ↓
injectIntegrations(files, projectConfig) — NEW
  ├── injectCalendly(files, calendlyUrl)
  ├── injectAnalytics(files, analyticsConfig)
  └── injectSEO(files, seoConfig)  // future
    ↓
Save to Convex + Daytona
```

No LLM cost for any integration. Pure string manipulation.
