# Flowstarter Implementation Plan
## Codebase → Vision Mapping

---

## Current Codebase Structure

```
flowstarter-monorepo/
├── apps/
│   ├── flowstarter-editor/     # React Router + Convex (editor UI)
│   │   ├── app/
│   │   │   ├── routes/         # API routes + pages
│   │   │   ├── components/     # Editor components
│   │   │   └── utils/          # Utilities
│   │   └── convex/             # Real-time DB schema
│   │       ├── schema.ts       # Data model
│   │       ├── projects.ts     # Project CRUD
│   │       ├── conversations.ts
│   │       ├── files.ts
│   │       └── costs.ts
│   │
│   ├── flowstarter-main/       # Next.js (public site + dashboard)
│   │   └── src/app/
│   │       ├── (dynamic-pages)/(main-pages)/(logged-in-pages)/
│   │       │   ├── dashboard/          # Client dashboard
│   │       │   │   ├── new/            # Wizard (HIDE THIS)
│   │       │   │   ├── integrations/   # Integration settings
│   │       │   │   └── components/     # Dashboard cards
│   │       │   └── wizard/project/[id]/ # Project wizard
│   │       └── components/             # Shared components
│   │
│   └── flowstarter-library/    # MCP server for templates
│       └── mcp-server/
```

---

## What Exists vs What We Need

### ✅ ALREADY BUILT (Keep/Adapt)

| Component | Location | Status |
|-----------|----------|--------|
| Editor UI | `editor/app/routes/project.$projectId.tsx` | ✅ Keep |
| AI Chat | `editor/app/components/editor/editor-chat/` | ✅ Keep |
| File Viewer | `editor/app/components/workbench/` | ✅ Keep |
| Convex Schema | `editor/convex/schema.ts` | ✅ Extend |
| Message System | `editor/app/routes/api.editor-chat.ts` | ✅ Keep |
| Onboarding Wizard | `main/dashboard/new/ProjectWizard.tsx` | ⚠️ Hide |
| Template System | `library/mcp-server/` | ✅ Keep |
| Build Pipeline | `editor/app/routes/api.build.ts` | ✅ Adapt |

### ❌ NEEDS BUILDING

| Component | Priority | Location | Complexity |
|-----------|----------|----------|------------|
| Internal mode flag | P1 | env + middleware | Easy |
| Customization engine | P1 | `editor/app/services/customization/` | Hard |
| Template schema system | P1 | `library/templates/*/schema.json` | Medium |
| Publish pipeline (CF) | P2 | `editor/app/routes/api.publish.ts` | Medium |
| GA4 integration | P2 | `main/src/lib/analytics/` | Medium |
| Analytics dashboard | P2 | `main/dashboard/analytics/` | Medium |
| Leads table + API | P2 | Supabase + `main/api/leads/` | Easy |
| Client dashboard | P3 | `main/dashboard/` | Medium |
| Integration components | P3 | `editor/app/components/integrations/` | Medium |
| Supabase Vault setup | P3 | Infrastructure | Easy |

---

## Phase 1: Foundation (Week 1-2)

### 1.1 Hide Public Wizard

**Goal:** Make wizard internal-only without breaking existing flow

**Files to modify:**

```typescript
// 1. Add environment variable
// apps/flowstarter-main/.env.local
INTERNAL_MODE=true
INTERNAL_TEAM_EMAILS=darius@flowstarter.com,dorin@flowstarter.com

// 2. Create middleware check
// apps/flowstarter-main/src/middleware.ts
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware(async (auth, req) => {
  const isInternalRoute = req.nextUrl.pathname.startsWith('/dashboard/new');
  
  if (isInternalRoute && process.env.INTERNAL_MODE === 'true') {
    const { userId, sessionClaims } = await auth();
    const userEmail = sessionClaims?.email as string;
    const teamEmails = process.env.INTERNAL_TEAM_EMAILS?.split(',') || [];
    
    if (!teamEmails.includes(userEmail)) {
      return Response.redirect(new URL('/dashboard', req.url));
    }
  }
});

// 3. Hide "New Project" button for non-team
// apps/flowstarter-main/src/app/(dynamic-pages)/.../dashboard/page.tsx
// Add conditional rendering based on INTERNAL_MODE
```

**Estimated time:** 2 hours

---

### 1.2 Template Schema System

**Goal:** Define AI-friendly structure for each template

**New files to create:**

```
apps/flowstarter-library/templates/
├── service-professional/
│   ├── schema.json           # NEW: AI-readable structure
│   ├── content/
│   │   ├── hero.md
│   │   ├── services.md
│   │   └── about.md
│   └── src/
│       └── ... (existing)
├── local-business/
│   └── schema.json           # NEW
└── creative-portfolio/
    └── schema.json           # NEW
```

**Schema format:**

```typescript
// apps/flowstarter-editor/app/types/template-schema.ts
export interface TemplateSchema {
  id: string;
  name: string;
  description: string;
  
  // Pages and their sections
  pages: PageSchema[];
  
  // Global elements
  header: HeaderSchema;
  footer: FooterSchema;
  
  // Customization constraints
  constraints: {
    maxPages: number;
    allowedSections: string[];
    colorPalettes: string[];
  };
}

export interface PageSchema {
  id: string;           // e.g., "home", "about", "services"
  path: string;         // e.g., "/", "/about"
  sections: SectionSchema[];
}

export interface SectionSchema {
  id: string;           // e.g., "hero", "services-grid"
  type: SectionType;
  file: string;         // e.g., "src/components/Hero.astro"
  editable: EditableField[];
  variants?: string[];
}

export interface EditableField {
  id: string;
  type: 'text' | 'richtext' | 'image' | 'color' | 'link' | 'array';
  path: string;         // JSONPath to the field in content
  label: string;
  constraints?: {
    maxLength?: number;
    minLength?: number;
    pattern?: string;
  };
}
```

**Example schema.json:**

```json
{
  "id": "service-professional",
  "name": "Service Professional",
  "description": "For coaches, consultants, therapists",
  "pages": [
    {
      "id": "home",
      "path": "/",
      "sections": [
        {
          "id": "hero",
          "type": "hero",
          "file": "src/components/sections/Hero.astro",
          "editable": [
            { "id": "headline", "type": "text", "path": "$.hero.headline", "label": "Main Headline" },
            { "id": "subheadline", "type": "text", "path": "$.hero.subheadline", "label": "Subheadline" },
            { "id": "cta_text", "type": "text", "path": "$.hero.cta.text", "label": "Button Text" },
            { "id": "cta_link", "type": "link", "path": "$.hero.cta.link", "label": "Button Link" },
            { "id": "image", "type": "image", "path": "$.hero.image", "label": "Hero Image" }
          ],
          "variants": ["centered", "split", "video-bg"]
        },
        {
          "id": "services",
          "type": "services-grid",
          "file": "src/components/sections/Services.astro",
          "editable": [
            { "id": "title", "type": "text", "path": "$.services.title", "label": "Section Title" },
            { "id": "items", "type": "array", "path": "$.services.items", "label": "Services" }
          ]
        }
      ]
    }
  ],
  "constraints": {
    "maxPages": 8,
    "allowedSections": ["hero", "services-grid", "testimonials", "contact", "about", "team", "pricing", "faq"],
    "colorPalettes": ["warm", "cool", "neutral", "bold"]
  }
}
```

**Estimated time:** 1 day per template (3 templates = 3 days)

---

### 1.3 Customization Engine Core

**Goal:** Parse request → Generate plan → Execute safely → Validate

**New service structure:**

```
apps/flowstarter-editor/app/services/customization/
├── index.ts                    # Main entry point
├── request-analyzer.ts         # Parse natural language → intent
├── plan-generator.ts           # Create execution plan
├── executor.ts                 # Execute plan steps
├── validators/
│   ├── schema-validator.ts     # Validate against template schema
│   ├── html-validator.ts       # Validate HTML output
│   └── content-validator.ts    # Validate content changes
├── mutators/
│   ├── text-mutator.ts         # Handle text changes
│   ├── image-mutator.ts        # Handle image swaps
│   ├── section-mutator.ts      # Handle section add/remove
│   └── style-mutator.ts        # Handle color/style changes
└── types.ts                    # TypeScript interfaces
```

**Core interfaces:**

```typescript
// apps/flowstarter-editor/app/services/customization/types.ts

export interface CustomizationRequest {
  raw: string;                    // "Change the headline to 'Welcome Home'"
  projectId: string;
  templateId: string;
}

export interface ParsedIntent {
  type: 'update_text' | 'change_color' | 'swap_image' | 'add_section' | 'remove_section' | 'reorder';
  target: string;                 // Section/field path
  value?: string | object;
  confidence: number;
  clarificationNeeded?: string;
}

export interface ExecutionPlan {
  id: string;
  request: CustomizationRequest;
  intents: ParsedIntent[];
  steps: ExecutionStep[];
  rollbackSteps: RollbackStep[];
  estimatedRisk: 'low' | 'medium' | 'high';
}

export interface ExecutionStep {
  id: string;
  action: 'read_file' | 'write_file' | 'update_content' | 'run_command';
  target: string;
  params: Record<string, any>;
  validation: ValidationRule[];
  dependsOn?: string[];
}

export interface ExecutionResult {
  success: boolean;
  steps: StepResult[];
  filesChanged: string[];
  rollbackAvailable: boolean;
  error?: string;
}
```

**Request analyzer (uses Claude):**

```typescript
// apps/flowstarter-editor/app/services/customization/request-analyzer.ts
import Anthropic from '@anthropic-ai/sdk';
import { TemplateSchema } from '~/types/template-schema';
import { CustomizationRequest, ParsedIntent } from './types';

export async function analyzeRequest(
  request: CustomizationRequest,
  schema: TemplateSchema
): Promise<ParsedIntent[]> {
  const anthropic = new Anthropic();
  
  const systemPrompt = `You are analyzing a website customization request.
Given the template schema and user request, identify the specific changes needed.
Return a JSON array of intents.

Template Schema:
${JSON.stringify(schema, null, 2)}

Valid intent types: update_text, change_color, swap_image, add_section, remove_section, reorder

For each intent, specify:
- type: the intent type
- target: the exact path from the schema (e.g., "pages[0].sections[0].editable[0]")
- value: the new value (for updates)
- confidence: 0-1 how confident you are
- clarificationNeeded: if confidence < 0.8, what would help`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: 'user', content: request.raw }]
  });
  
  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return JSON.parse(text);
}
```

**Estimated time:** 1 week

---

## Phase 2: Analytics & Leads (Week 3-4)

### 2.1 Supabase Schema Extensions

**Goal:** Add leads table and analytics caching

```sql
-- migrations/add_leads_and_analytics.sql

-- Leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL,
  
  -- Contact info
  name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  
  -- Source tracking
  source TEXT DEFAULT 'contact_form',
  page_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Status
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'archived')),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_leads_project ON leads(project_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created ON leads(created_at);

-- RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project leads" ON leads
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE clerk_user_id = auth.uid()
    )
  );

-- Analytics snapshots (cached GA4 data)
CREATE TABLE analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL,
  date DATE NOT NULL,
  
  -- GA4 metrics
  visitors INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  top_pages JSONB DEFAULT '[]',
  traffic_sources JSONB DEFAULT '[]',
  
  -- Our metrics
  leads_count INTEGER DEFAULT 0,
  bookings_count INTEGER DEFAULT 0,
  newsletter_signups INTEGER DEFAULT 0,
  
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(project_id, date)
);

CREATE INDEX idx_analytics_project_date ON analytics_snapshots(project_id, date);

-- Integrations table (non-sensitive config)
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('calendly', 'mailchimp', 'ga4', 'stripe', 'instagram', 'whatsapp')),
  status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error')),
  
  -- Non-sensitive config
  config JSONB DEFAULT '{}',
  
  -- Vault references (NOT actual secrets)
  vault_refs JSONB DEFAULT '{}',
  
  oauth_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(project_id, type)
);

CREATE INDEX idx_integrations_project ON integrations(project_id);
```

**Estimated time:** 2 hours

---

### 2.2 GA4 Backend Service

**Goal:** Fetch and cache analytics data

```typescript
// apps/flowstarter-main/src/lib/analytics/ga4-service.ts
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { createClient } from '@supabase/supabase-js';

const analyticsClient = new BetaAnalyticsDataClient({
  credentials: JSON.parse(process.env.GA4_SERVICE_ACCOUNT_KEY || '{}')
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function fetchGA4Data(propertyId: string, startDate: string, endDate: string) {
  const [response] = await analyticsClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    metrics: [
      { name: 'activeUsers' },
      { name: 'screenPageViews' },
    ],
    dimensions: [
      { name: 'date' },
    ],
  });
  
  return {
    visitors: response.rows?.reduce((sum, row) => 
      sum + parseInt(row.metricValues?.[0]?.value || '0'), 0) || 0,
    pageViews: response.rows?.reduce((sum, row) => 
      sum + parseInt(row.metricValues?.[1]?.value || '0'), 0) || 0,
    dailyData: response.rows?.map(row => ({
      date: row.dimensionValues?.[0]?.value,
      visitors: parseInt(row.metricValues?.[0]?.value || '0'),
      pageViews: parseInt(row.metricValues?.[1]?.value || '0'),
    })) || [],
  };
}

export async function fetchTopPages(propertyId: string, startDate: string, endDate: string) {
  const [response] = await analyticsClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    metrics: [{ name: 'screenPageViews' }],
    dimensions: [{ name: 'pagePath' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 5,
  });
  
  return response.rows?.map(row => ({
    path: row.dimensionValues?.[0]?.value,
    views: parseInt(row.metricValues?.[0]?.value || '0'),
  })) || [];
}

export async function syncAnalyticsForProject(projectId: string, ga4PropertyId: string) {
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const [metrics, topPages] = await Promise.all([
    fetchGA4Data(ga4PropertyId, thirtyDaysAgo, today),
    fetchTopPages(ga4PropertyId, thirtyDaysAgo, today),
  ]);
  
  // Get leads count from our table
  const { count: leadsCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .gte('created_at', thirtyDaysAgo);
  
  // Upsert snapshot
  await supabase.from('analytics_snapshots').upsert({
    project_id: projectId,
    date: today,
    visitors: metrics.visitors,
    page_views: metrics.pageViews,
    top_pages: topPages,
    leads_count: leadsCount || 0,
    fetched_at: new Date().toISOString(),
  });
  
  return { metrics, topPages, leadsCount };
}
```

**Estimated time:** 1 day

---

### 2.3 Analytics Dashboard UI

**Goal:** Clean, simple analytics view for clients

**New files:**

```
apps/flowstarter-main/src/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/dashboard/
├── analytics/
│   ├── page.tsx                    # Main analytics page
│   ├── components/
│   │   ├── MetricCard.tsx          # Visitor/PageView/Leads cards
│   │   ├── TrendChart.tsx          # 30-day sparkline
│   │   ├── TopPagesTable.tsx       # Top 5 pages
│   │   └── RecentLeadsTable.tsx    # Recent leads preview
│   └── hooks/
│       └── useAnalytics.ts         # Data fetching hook
├── leads/
│   ├── page.tsx                    # Full leads list
│   ├── [id]/page.tsx               # Lead detail
│   └── components/
│       ├── LeadsList.tsx
│       ├── LeadCard.tsx
│       ├── LeadStatusBadge.tsx
│       └── ExportCSVButton.tsx
```

**Dashboard page:**

```tsx
// apps/flowstarter-main/src/app/.../dashboard/analytics/page.tsx
import { MetricCard } from './components/MetricCard';
import { TrendChart } from './components/TrendChart';
import { TopPagesTable } from './components/TopPagesTable';
import { RecentLeadsTable } from './components/RecentLeadsTable';
import { useAnalytics } from './hooks/useAnalytics';

export default function AnalyticsPage() {
  const { data, isLoading, period, setPeriod } = useAnalytics();
  
  if (isLoading) return <AnalyticsSkeleton />;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">📊 Dashboard</h1>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>
      
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Visitors"
          value={data.visitors}
          change={data.visitorsChange}
          icon="👥"
        />
        <MetricCard
          title="Page Views"
          value={data.pageViews}
          change={data.pageViewsChange}
          icon="📄"
        />
        <MetricCard
          title="Leads"
          value={data.leads}
          change={data.leadsChange}
          icon="🎯"
        />
      </div>
      
      {/* Trend Chart */}
      <TrendChart data={data.dailyVisitors} />
      
      {/* Two-column: Pages & Leads */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TopPagesTable pages={data.topPages} />
        <RecentLeadsTable leads={data.recentLeads} />
      </div>
      
      {/* CTAs */}
      <div className="flex gap-4">
        <Link href="/dashboard/edit" className="btn btn-primary">
          💬 Request Change
        </Link>
        <Link href="/editor" className="btn btn-secondary">
          ✏️ Edit Website
        </Link>
      </div>
    </div>
  );
}
```

**Estimated time:** 3 days

---

### 2.4 Leads API & Contact Form

**Goal:** Contact form → Supabase → Notification

**API route:**

```typescript
// apps/flowstarter-main/src/app/api/leads/route.ts
import { createClient } from '@supabase/supabase-js';
import { sendLeadNotification } from '@/lib/notifications';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: Request) {
  const body = await request.json();
  const { projectId, name, email, phone, message, source, utm_source, utm_medium, utm_campaign } = body;
  
  // Save to Supabase
  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      project_id: projectId,
      name,
      email,
      phone,
      message,
      source: source || 'contact_form',
      utm_source,
      utm_medium,
      utm_campaign,
      status: 'new',
    })
    .select()
    .single();
  
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  
  // Send notification to client
  await sendLeadNotification(projectId, lead);
  
  return Response.json({ success: true, lead });
}
```

**Contact form component (for client sites):**

```tsx
// apps/flowstarter-editor/app/components/integrations/ContactForm.tsx
export function ContactForm({ projectId }: { projectId: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    
    const formData = new FormData(e.currentTarget);
    
    // Get UTM params from URL
    const urlParams = new URLSearchParams(window.location.search);
    
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        message: formData.get('message'),
        source: 'contact_form',
        utm_source: urlParams.get('utm_source'),
        utm_medium: urlParams.get('utm_medium'),
        utm_campaign: urlParams.get('utm_campaign'),
      }),
    });
    
    setStatus(res.ok ? 'success' : 'error');
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Form fields */}
    </form>
  );
}
```

**Estimated time:** 1 day

---

## Phase 3: Publish & Integrations (Week 5-6)

### 3.1 Cloudflare Pages Publish Pipeline

**Goal:** Convex files → Build → Upload to CF Pages

```typescript
// apps/flowstarter-editor/app/routes/api.publish.ts
import { ActionFunction, json } from '@remix-run/node';

export const action: ActionFunction = async ({ request }) => {
  const { projectId, projectUrlId } = await request.json();
  
  // 1. Get files from Convex
  const files = await convex.query(api.files.getProjectFiles, { projectId });
  
  // 2. Build static site (run astro build)
  const buildResult = await buildProject(files);
  
  if (!buildResult.success) {
    return json({ error: buildResult.error }, { status: 500 });
  }
  
  // 3. Upload to Cloudflare Pages via Direct Upload
  const cfProjectName = `fs-${projectUrlId}`;
  const deployment = await uploadToCloudflarePages(cfProjectName, buildResult.outputDir);
  
  // 4. Backup to R2
  await backupToR2(projectId, buildResult.outputDir);
  
  // 5. Update deployment record
  await supabase.from('deployments').insert({
    project_id: projectId,
    cloudflare_deployment_id: deployment.id,
    preview_url: deployment.url,
    status: 'live',
    version: Date.now(),
  });
  
  return json({ success: true, url: deployment.url });
};

async function uploadToCloudflarePages(projectName: string, outputDir: string) {
  // Use Cloudflare Pages Direct Upload API
  const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
  const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
  
  // Create project if doesn't exist
  // Upload files
  // Return deployment URL
}
```

**Estimated time:** 2 days

---

### 3.2 Integration Components Library

**Goal:** Secure, reusable components for client sites

```
apps/flowstarter-editor/app/components/integrations/
├── CalendlyWidget.tsx
├── MailchimpForm.tsx
├── ContactForm.tsx
├── WhatsAppButton.tsx
├── GoogleAnalytics.tsx
└── index.ts
```

Each component calls our API (never third-party directly):

```tsx
// apps/flowstarter-editor/app/components/integrations/CalendlyWidget.tsx
export function CalendlyWidget({ projectId }: { projectId: string }) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  
  useEffect(() => {
    // Fetch from our API - we look up the calendly URL server-side
    fetch(`/api/integrations/${projectId}/calendly/embed-url`)
      .then(res => res.json())
      .then(data => setEmbedUrl(data.url));
  }, [projectId]);
  
  if (!embedUrl) return null;
  
  return (
    <button onClick={() => window.open(embedUrl, '_blank')}>
      📅 Book a Call
    </button>
  );
}
```

**Estimated time:** 2 days

---

## Summary: Week-by-Week

| Week | Focus | Deliverables |
|------|-------|-------------|
| **Week 1** | Foundation | Hide wizard, template schemas (1/3) |
| **Week 2** | Customization Engine | Request analyzer, plan generator, basic executor |
| **Week 3** | Analytics Backend | GA4 service, Supabase schema, caching |
| **Week 4** | Analytics UI | Dashboard, leads list, notifications |
| **Week 5** | Publish Pipeline | CF Pages upload, R2 backup, rollback |
| **Week 6** | Integrations | Components, secure API routes, Vault setup |
| **Week 7** | Polish | Testing, empty states, error handling |
| **Week 8** | Pilot Ready | End-to-end flow, pilot client onboard |

---

## Files to Create (Summary)

```
NEW FILES:
├── apps/flowstarter-editor/
│   └── app/
│       ├── services/customization/     # Customization engine
│       │   ├── index.ts
│       │   ├── request-analyzer.ts
│       │   ├── plan-generator.ts
│       │   ├── executor.ts
│       │   └── types.ts
│       ├── components/integrations/    # Secure integration components
│       │   ├── CalendlyWidget.tsx
│       │   ├── ContactForm.tsx
│       │   └── ...
│       └── routes/
│           ├── api.publish.ts          # CF Pages publish
│           ├── api.integrations.$projectId.*.ts  # Integration APIs
│           └── api.customization.ts    # Customization endpoint
│
├── apps/flowstarter-main/
│   └── src/
│       ├── lib/
│       │   ├── analytics/ga4-service.ts
│       │   └── notifications/index.ts
│       └── app/api/
│           ├── leads/route.ts
│           └── analytics/route.ts
│
├── apps/flowstarter-library/
│   └── templates/
│       ├── service-professional/schema.json
│       ├── local-business/schema.json
│       └── creative-portfolio/schema.json
│
└── supabase/migrations/
    └── add_leads_and_analytics.sql
```

---

*Created: 2026-02-23*
*Owner: Darius Popescu*
