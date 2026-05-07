# Flowstarter Implementation Plan
## Codebase → Vision Mapping

---

## Editor Architecture: Two Modes

The editor needs to be split into **two distinct experiences**:

### Mode 1: Internal Draft Generator (Team Only)
**Purpose:** Go from template → first site draft → publish
**Users:** Darius + Dorin
**Flow:** Template selection → Business info → AI content generation → Review → Publish

### Mode 2: Client Customization (Post-Delivery)
**Purpose:** Simple changes via natural language
**Users:** Clients
**Flow:** Describe change → AI executes → Preview → Approve → Publish

```
┌─────────────────────────────────────────────────────────────────┐
│                    EDITOR ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   INTERNAL MODE                    CLIENT MODE                   │
│   (/internal/project/new)          (/project/:id)               │
│   ┌─────────────────────┐         ┌─────────────────────┐       │
│   │                     │         │                     │       │
│   │  Template Selector  │         │   Change Request    │       │
│   │  Business Info Form │         │   Chat Interface    │       │
│   │  AI Content Gen     │         │                     │       │
│   │  Full File Browser  │         │   Live Preview      │       │
│   │  Code Editor        │         │   (read-only files) │       │
│   │  Terminal           │         │                     │       │
│   │                     │         │   Publish Button    │       │
│   │  Publish Draft      │         │   Export Button     │       │
│   │                     │         │                     │       │
│   └─────────────────────┘         └─────────────────────┘       │
│                                                                  │
│   SHARED COMPONENTS:                                             │
│   • EditorLayout (shell)                                         │
│   • Preview panel                                                │
│   • Chat message components                                      │
│   • Convex providers                                             │
│                                                                  │
│   INTERNAL-ONLY:                  CLIENT-ONLY:                   │
│   • TemplateGallery               • SimpleChangeChat             │
│   • BusinessInfoForm              • ReadOnlyFileTree             │
│   • ContentGenerator              • ApprovalFlow                 │
│   • FullCodeEditor                • ExportButton                 │
│   • Terminal                                                     │
│   • DraftPublisher                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

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

## Phase 0: Editor Refactor (Week 1)

### 0.1 Editor Mode Split

**Goal:** Split the current monolithic editor into two focused experiences

**Current state:**
- `new.tsx` - Onboarding flow (welcome → describe → template → build)
- `project.$projectId.tsx` - Full editor with everything

**Target state:**
- `/internal/draft/:projectId` - Internal draft generator (team only)
- `/project/:projectId` - Client customization interface (simplified)

**Route structure:**

```
apps/flowstarter-editor/app/routes/
├── _index.tsx                      # Redirect based on user type
├── internal/
│   ├── _layout.tsx                 # Internal-only layout with team auth
│   ├── new.tsx                     # Start new project (template select)
│   └── draft.$projectId.tsx        # Full internal editor
└── project.$projectId.tsx          # Client customization (simplified)
```

### 0.2 Internal Draft Generator

**New file: `routes/internal/_layout.tsx`**

```tsx
// apps/flowstarter-editor/app/routes/internal/_layout.tsx
import { Outlet, redirect } from '@remix-run/react';
import type { LoaderFunctionArgs } from '@remix-run/cloudflare';

const TEAM_EMAILS = ['darius@flowstarter.com', 'dorin@flowstarter.com'];

export async function loader({ request }: LoaderFunctionArgs) {
  // Get user from session/auth
  const user = await getUser(request);
  
  if (!user || !TEAM_EMAILS.includes(user.email)) {
    throw redirect('/');
  }
  
  return null;
}

export default function InternalLayout() {
  return (
    <div className="internal-editor">
      <div className="internal-banner">
        🔧 Internal Mode - Team Only
      </div>
      <Outlet />
    </div>
  );
}
```

**New file: `routes/internal/new.tsx`**

```tsx
// apps/flowstarter-editor/app/routes/internal/new.tsx
import { useState } from 'react';
import { useNavigate } from '@remix-run/react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

// Steps for internal draft generation
type InternalStep = 
  | 'select_template'
  | 'business_info'
  | 'content_review'
  | 'generating'
  | 'preview';

export default function InternalNewProject() {
  const navigate = useNavigate();
  const [step, setStep] = useState<InternalStep>('select_template');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  
  const createProject = useMutation(api.projects.createFromTemplate);
  
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    setStep('business_info');
  };
  
  const handleBusinessInfoSubmit = async (info: BusinessInfo) => {
    setBusinessInfo(info);
    setStep('generating');
    
    // Create project and generate content
    const project = await createProject({
      templateId: selectedTemplate!,
      businessInfo: info,
    });
    
    // Navigate to internal editor
    navigate(`/internal/draft/${project.urlId}`);
  };
  
  return (
    <div className="internal-new-project">
      {step === 'select_template' && (
        <TemplateSelector onSelect={handleTemplateSelect} />
      )}
      {step === 'business_info' && (
        <BusinessInfoForm 
          templateId={selectedTemplate!}
          onSubmit={handleBusinessInfoSubmit}
        />
      )}
      {step === 'generating' && (
        <GeneratingIndicator />
      )}
    </div>
  );
}
```

**New file: `routes/internal/draft.$projectId.tsx`**

```tsx
// apps/flowstarter-editor/app/routes/internal/draft.$projectId.tsx
// This is the FULL editor - code, terminal, file browser, everything

import { EditorLayout } from '~/components/editor';
import { InternalChatPanel } from '~/components/internal/InternalChatPanel';
import { FullWorkbench } from '~/components/workbench/FullWorkbench';
import { PreviewPanel } from '~/components/preview/PreviewPanel';
import { DraftPublisher } from '~/components/internal/DraftPublisher';

export default function InternalDraftEditor() {
  const { projectId } = useParams();
  
  return (
    <EditorLayout mode="internal">
      {/* Left: Full workbench with file tree, code editor, terminal */}
      <FullWorkbench projectId={projectId} />
      
      {/* Center: Live preview */}
      <PreviewPanel projectId={projectId} />
      
      {/* Right: Internal chat + generation controls */}
      <InternalChatPanel projectId={projectId}>
        <ContentGenerator />
        <IntegrationSetup />
        <DraftPublisher />
      </InternalChatPanel>
    </EditorLayout>
  );
}
```

### 0.3 Client Customization Interface

**Simplify: `routes/project.$projectId.tsx`**

```tsx
// apps/flowstarter-editor/app/routes/project.$projectId.tsx
// SIMPLIFIED for clients - no code editor, no terminal

import { EditorLayout } from '~/components/editor';
import { SimpleChangeChat } from '~/components/client/SimpleChangeChat';
import { PreviewPanel } from '~/components/preview/PreviewPanel';
import { ReadOnlyFileTree } from '~/components/client/ReadOnlyFileTree';
import { PublishButton } from '~/components/client/PublishButton';
import { ExportButton } from '~/components/client/ExportButton';

export default function ClientEditor() {
  const { projectId } = useParams();
  
  return (
    <EditorLayout mode="client">
      {/* Left: Simple chat for changes */}
      <div className="client-sidebar">
        <SimpleChangeChat projectId={projectId} />
        
        {/* Optional: Collapsible file tree (read-only) */}
        <details className="file-tree-collapsible">
          <summary>View Files</summary>
          <ReadOnlyFileTree projectId={projectId} />
        </details>
      </div>
      
      {/* Center: Live preview */}
      <PreviewPanel projectId={projectId} />
      
      {/* Actions */}
      <div className="client-actions">
        <PublishButton projectId={projectId} />
        <ExportButton projectId={projectId} />
      </div>
    </EditorLayout>
  );
}
```

### 0.4 Component Reorganization

**Current structure (messy):**
```
app/components/
├── editor/
│   ├── EditorLayout.tsx
│   ├── EditorChatPanel.tsx          # Does too much
│   ├── editor-chat/
│   │   ├── components/              # Mixed concerns
│   │   │   ├── TemplateGallery.tsx  # Internal
│   │   │   ├── BuildTimeline.tsx    # Internal
│   │   │   ├── ChatInput.tsx        # Shared
│   │   │   └── ...
│   │   └── hooks/
│   └── ...
├── workbench/
│   ├── file-tree/
│   └── terminal/
└── ...
```

**Target structure (clean):**
```
app/components/
├── shared/                           # Used by both modes
│   ├── EditorLayout.tsx
│   ├── PreviewPanel.tsx
│   ├── chat/
│   │   ├── ChatInput.tsx
│   │   ├── MessageBubble.tsx
│   │   └── ...
│   └── ui/
│       └── ...
│
├── internal/                         # Internal mode only
│   ├── InternalChatPanel.tsx
│   ├── TemplateSelector.tsx
│   ├── BusinessInfoForm.tsx
│   ├── ContentGenerator.tsx
│   ├── IntegrationSetup.tsx
│   ├── DraftPublisher.tsx
│   └── FullWorkbench/
│       ├── FileTree.tsx
│       ├── CodeEditor.tsx
│       └── Terminal.tsx
│
└── client/                           # Client mode only
    ├── SimpleChangeChat.tsx
    ├── ReadOnlyFileTree.tsx
    ├── PublishButton.tsx
    ├── ExportButton.tsx
    └── ChangeApprovalFlow.tsx
```

### 0.5 Internal Draft Generator Flow

**The full internal flow (iterative, not one-shot):**

```
1. TEMPLATE SELECTION
   ┌─────────────────────────────────────────┐
   │  Choose Template for [Business Name]   │
   │                                         │
   │  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
   │  │ Service │ │  Local  │ │Creative │   │
   │  │  Pro    │ │Business │ │Portfolio│   │
   │  └─────────┘ └─────────┘ └─────────┘   │
   │                                         │
   │              [Next →]                   │
   └─────────────────────────────────────────┘
                    │
                    ▼
2. BUSINESS INFO (from discovery call)
   ┌─────────────────────────────────────────┐
   │  Business Details                       │
   │                                         │
   │  Name: [Maria's Life Coaching_______]   │
   │  Industry: [Coaching ▼]                 │
   │  Services: [Life coaching, career...]   │
   │                                         │
   │  Contact:                               │
   │  Email: [_____] Phone: [_____]          │
   │                                         │
   │  Discovery Call Notes:                  │
   │  [________________________________]     │
   │  [________________________________]     │
   │                                         │
   │              [Generate First Draft →]   │
   └─────────────────────────────────────────┘
                    │
                    ▼
3. AI GENERATES FIRST DRAFT (~80% done)
   ┌─────────────────────────────────────────┐
   │  Generating Initial Draft...            │
   │                                         │
   │  ✅ Analyzing business context          │
   │  ✅ Generating hero copy                │
   │  ⏳ Writing service descriptions        │
   │  ○  Creating about section             │
   │  ○  Setting up SEO                     │
   │                                         │
   │  [━━━━━━━━━━░░░░░░░░░░] 45%             │
   │                                         │
   │  Note: This is a FIRST DRAFT.           │
   │  You'll refine it with AI chat next.    │
   └─────────────────────────────────────────┘
                    │
                    ▼
4. ITERATIVE REFINEMENT (AI Chat + Full Editor)
   ┌─────────────────────────────────────────────────────────────────────┐
   │  [Files]  [Code]  [Terminal]    │  [Preview]   │  [💬 AI Chat]     │
   │  ├── src/                       │              │                    │
   │  │   ├── pages/                 │  ┌────────┐  │  You: "Make the   │
   │  │   │   ├── index.astro        │  │        │  │  headline more    │
   │  │   │   └── about.astro        │  │  Live  │  │  punchy"          │
   │  │   └── content/               │  │Preview │  │                    │
   │  │       ├── hero.md            │  │        │  │  AI: Done! Changed│
   │  │       └── services.md        │  │        │  │  to "Transform    │
   │  ├── public/                    │  └────────┘  │  Your Life Today" │
   │  └── astro.config.mjs           │              │                    │
   │────────────────────────────────────────────────│  You: "Add a      │
   │  $ npm run dev                  │              │  testimonials     │
   │  Server running on port 4321    │              │  section"         │
   │                                 │              │                    │
   │                                 │              │  AI: Added 3      │
   │                                 │              │  testimonials...  │
   │                                 │              │                    │
   │                                 │              │  [________________]│
   │                                 │              │  [Send Message]   │
   └─────────────────────────────────────────────────────────────────────┘
   
   TEAM CAN:
   • Chat with AI to make changes ("make the colors warmer")
   • Ask AI to add sections ("add a pricing section")
   • Ask AI to rewrite copy ("make this more professional")
   • Manually edit code if needed
   • Preview changes live
   • Iterate until satisfied
   
                    │
                    ▼
5. SETUP INTEGRATIONS
   ┌─────────────────────────────────────────┐
   │  Configure Integrations                 │
   │                                         │
   │  📅 Calendly                            │
   │  [x] Enabled                            │
   │  Username: [mariacoaching___]           │
   │  Event: [discovery-call___]             │
   │                                         │
   │  📧 Contact Form                        │
   │  [x] Enabled (always on)                │
   │  Notify via: [x] Email [ ] WhatsApp     │
   │                                         │
   │  📊 Google Analytics                    │
   │  [x] Enabled                            │
   │  Property ID: [G-XXXXXXXXXX]            │
   │                                         │
   │              [Save & Continue →]        │
   └─────────────────────────────────────────┘
                    │
                    ▼
6. FINAL REVIEW & PUBLISH
   ┌─────────────────────────────────────────┐
   │  Ready to Publish?                      │
   │                                         │
   │  Client: Maria Ionescu                  │
   │  Domain: mariascoaching.com             │
   │                                         │
   │  ✅ Site generated & refined            │
   │  ✅ Contact form working                │
   │  ✅ Calendly integrated                 │
   │  ✅ GA4 tracking added                  │
   │                                         │
   │  [Preview Live] [Publish to Cloudflare] │
   └─────────────────────────────────────────┘
```

### 0.5.1 Internal AI Chat Capabilities

**The internal editor AI can do everything the customization engine can, plus more:**

| Capability | Example Prompt | Available |
|------------|----------------|-----------|
| **Change text** | "Make the headline more punchy" | ✅ |
| **Change colors** | "Use warmer colors, more orange" | ✅ |
| **Add sections** | "Add a testimonials section with 3 reviews" | ✅ |
| **Remove sections** | "Remove the pricing section" | ✅ |
| **Reorder sections** | "Move about section above services" | ✅ |
| **Add pages** | "Create an FAQ page" | ✅ |
| **Change layout** | "Make the features 2 columns" | ✅ |
| **Regenerate content** | "Rewrite the about section, more personal" | ✅ |
| **SEO updates** | "Update meta description for better SEO" | ✅ |
| **Add images** | "Add a hero image of a coach" | ✅ |
| **Code changes** | "Add a custom animation to the hero" | ✅ (internal only) |
| **Install packages** | "Add a lightbox for the gallery" | ✅ (internal only) |

**Key difference from client mode:**
- Internal: Full AI coding capabilities (can modify any code)
- Client: Constrained to template-safe operations only

### 0.5.2 Internal Chat Panel Component

```tsx
// apps/flowstarter-editor/app/components/internal/InternalChatPanel.tsx
export function InternalChatPanel({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const sendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);
    
    // Stream AI response - full coding capabilities
    const response = await fetch('/api/internal/chat', {
      method: 'POST',
      body: JSON.stringify({
        projectId,
        message: input,
        mode: 'internal', // Full capabilities
      }),
    });
    
    // Handle streaming response...
    // AI can modify files, run commands, etc.
    
    setIsGenerating(false);
  };
  
  return (
    <div className="internal-chat-panel">
      <div className="chat-header">
        <h3>🤖 AI Assistant</h3>
        <span className="mode-badge">Internal Mode - Full Access</span>
      </div>
      
      <div className="messages">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {isGenerating && <TypingIndicator />}
      </div>
      
      <div className="quick-actions">
        <button onClick={() => setInput('Add a testimonials section')}>
          + Testimonials
        </button>
        <button onClick={() => setInput('Add a pricing section')}>
          + Pricing
        </button>
        <button onClick={() => setInput('Regenerate hero copy')}>
          🔄 Redo Hero
        </button>
      </div>
      
      <div className="chat-input">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Tell AI what to change... (full coding access)"
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
        />
        <button onClick={sendMessage} disabled={isGenerating}>
          Send
        </button>
      </div>
    </div>
  );
}
```

### 0.5.3 Internal vs Client AI Modes

```typescript
// apps/flowstarter-editor/app/routes/api.internal.chat.ts
// INTERNAL MODE: Full coding capabilities

export const action: ActionFunction = async ({ request }) => {
  const { projectId, message } = await request.json();
  
  // Verify internal user
  const user = await getUser(request);
  if (!isTeamMember(user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Full AI coding agent - can do anything
  const response = await runCodingAgent({
    projectId,
    message,
    capabilities: [
      'read_files',
      'write_files',
      'run_terminal',
      'install_packages',
      'modify_config',
      'create_pages',
      'delete_files',
    ],
  });
  
  return streamResponse(response);
};

// apps/flowstarter-editor/app/routes/api.customization.ts
// CLIENT MODE: Constrained to safe operations

export const action: ActionFunction = async ({ request }) => {
  const { projectId, message } = await request.json();
  
  // Load template schema for constraints
  const schema = await getTemplateSchema(projectId);
  
  // Customization engine - constrained operations
  const response = await runCustomizationEngine({
    projectId,
    message,
    schema,
    capabilities: [
      'update_content',    // Text, images in defined slots
      'change_colors',     // Within palette constraints
      'toggle_sections',   // Pre-defined sections only
      'update_seo',        // Meta tags
    ],
    // NO: arbitrary code changes, terminal, package installs
  });
  
  return streamResponse(response);
};
```

### 0.6 Migration Steps

**Step 1: Create new route structure (don't delete old)**
```bash
# Create internal routes
mkdir -p app/routes/internal
touch app/routes/internal/_layout.tsx
touch app/routes/internal/new.tsx
touch app/routes/internal/draft.$projectId.tsx
```

**Step 2: Extract shared components**
```bash
# Move shared components
mkdir -p app/components/shared
mv app/components/editor/EditorLayout.tsx app/components/shared/
# ... etc
```

**Step 3: Create internal components**
```bash
# New internal-only components
mkdir -p app/components/internal
touch app/components/internal/InternalChatPanel.tsx
touch app/components/internal/TemplateSelector.tsx
touch app/components/internal/BusinessInfoForm.tsx
# ... etc
```

**Step 4: Create client components**
```bash
# New client-only components
mkdir -p app/components/client
touch app/components/client/SimpleChangeChat.tsx
touch app/components/client/ReadOnlyFileTree.tsx
# ... etc
```

**Step 5: Simplify project route**
- Remove code editor from `project.$projectId.tsx`
- Remove terminal
- Add simple change chat
- Keep preview

**Step 6: Delete old unused code**
- Remove duplicated components
- Clean up imports

**Estimated time:** 3-4 days

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

### 3.2 Secure Integration Architecture

**CRITICAL: No API keys in frontend. Everything through our API.**

```
┌─────────────────────────────────────────────────────────────────┐
│                     INTEGRATION SECURITY                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   CLIENT SITE                    OUR BACKEND                    │
│   (browser)                      (server-side only)             │
│   ┌─────────────┐               ┌─────────────────────────┐     │
│   │ React       │    HTTPS      │ API Routes              │     │
│   │ Components  │ ─────────────▶│ /api/integrations/*     │     │
│   │             │               │                         │     │
│   │ NO API KEYS │               │ ✓ Has Vault access     │     │
│   │ NO SECRETS  │               │ ✓ Decrypts secrets     │     │
│   │             │               │ ✓ Calls third-party    │     │
│   └─────────────┘               └───────────┬─────────────┘     │
│                                             │                   │
│                                             ▼                   │
│                                 ┌─────────────────────────┐     │
│                                 │   SUPABASE VAULT        │     │
│                                 │   (encrypted at rest)   │     │
│                                 │                         │     │
│                                 │   calendly_api_key_*    │     │
│                                 │   mailchimp_token_*     │     │
│                                 │   stripe_secret_*       │     │
│                                 └───────────┬─────────────┘     │
│                                             │                   │
│                                             ▼                   │
│                                 ┌─────────────────────────┐     │
│                                 │   THIRD-PARTY APIs      │     │
│                                 │   Calendly, Mailchimp,  │     │
│                                 │   Stripe, GA4, etc.     │     │
│                                 └─────────────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Integration API Routes

**All integration logic is server-side. Frontend components only call our APIs.**

```
apps/flowstarter-editor/app/routes/
├── api.integrations.$projectId.calendly.ts
├── api.integrations.$projectId.mailchimp.ts
├── api.integrations.$projectId.contact-form.ts
├── api.integrations.$projectId.analytics.ts
└── api.integrations.$projectId.whatsapp.ts
```

**Calendly API (server-side):**

```typescript
// apps/flowstarter-editor/app/routes/api.integrations.$projectId.calendly.ts
import type { ActionFunction, LoaderFunction } from '@remix-run/cloudflare';
import { getVaultSecret } from '~/lib/vault';
import { getProjectIntegration } from '~/lib/integrations';

// GET /api/integrations/:projectId/calendly
// Returns public embed URL (no secrets)
export const loader: LoaderFunction = async ({ params }) => {
  const { projectId } = params;
  const integration = await getProjectIntegration(projectId, 'calendly');
  
  if (!integration || integration.status !== 'active') {
    return Response.json({ enabled: false });
  }
  
  // Return public info only - no API keys
  return Response.json({
    enabled: true,
    embedUrl: `https://calendly.com/${integration.config.username}/${integration.config.eventSlug}`,
  });
};

// POST /api/integrations/:projectId/calendly/webhook
// Handle Calendly webhooks (booking created, etc.)
export const action: ActionFunction = async ({ request, params }) => {
  const { projectId } = params;
  const body = await request.json();
  
  // Get webhook secret from vault to verify signature
  const webhookSecret = await getVaultSecret(`calendly_webhook_secret_${projectId}`);
  
  // Verify webhook signature
  const signature = request.headers.get('Calendly-Webhook-Signature');
  if (!verifyCalendlySignature(body, signature, webhookSecret)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  // Process booking
  if (body.event === 'invitee.created') {
    await saveBookingToSupabase(projectId, body.payload);
    await notifyClient(projectId, body.payload);
  }
  
  return Response.json({ success: true });
};
```

**Mailchimp API (server-side):**

```typescript
// apps/flowstarter-editor/app/routes/api.integrations.$projectId.mailchimp.ts
import type { ActionFunction } from '@remix-run/cloudflare';
import { getVaultSecret } from '~/lib/vault';
import { getProjectIntegration } from '~/lib/integrations';
import mailchimp from '@mailchimp/mailchimp_marketing';

// POST /api/integrations/:projectId/mailchimp/subscribe
export const action: ActionFunction = async ({ request, params }) => {
  const { projectId } = params;
  const { email, firstName, lastName } = await request.json();
  
  // Get integration config
  const integration = await getProjectIntegration(projectId, 'mailchimp');
  if (!integration) {
    return Response.json({ error: 'Mailchimp not configured' }, { status: 400 });
  }
  
  // Get API key from vault (NEVER sent to frontend)
  const apiKey = await getVaultSecret(`mailchimp_api_key_${projectId}`);
  const server = apiKey.split('-')[1]; // dc from API key
  
  // Configure Mailchimp client server-side
  mailchimp.setConfig({ apiKey, server });
  
  try {
    // Add subscriber
    await mailchimp.lists.addListMember(integration.config.listId, {
      email_address: email,
      status: 'subscribed',
      merge_fields: {
        FNAME: firstName || '',
        LNAME: lastName || '',
      },
    });
    
    // Also save to our leads table
    await saveLeadToSupabase(projectId, { email, firstName, lastName, source: 'newsletter' });
    
    return Response.json({ success: true });
  } catch (error: any) {
    if (error.status === 400 && error.response?.body?.title === 'Member Exists') {
      return Response.json({ success: true, alreadySubscribed: true });
    }
    return Response.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
};
```

**Contact Form API (server-side):**

```typescript
// apps/flowstarter-editor/app/routes/api.integrations.$projectId.contact-form.ts
import type { ActionFunction } from '@remix-run/cloudflare';
import { supabase } from '~/lib/supabase';
import { sendLeadNotification } from '~/lib/notifications';

// POST /api/integrations/:projectId/contact-form
export const action: ActionFunction = async ({ request, params }) => {
  const { projectId } = params;
  const formData = await request.json();
  
  // Get UTM params
  const { name, email, phone, message, utm_source, utm_medium, utm_campaign } = formData;
  
  // 1. Save to Supabase leads table
  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      project_id: projectId,
      name,
      email,
      phone,
      message,
      source: 'contact_form',
      utm_source,
      utm_medium,
      utm_campaign,
      status: 'new',
    })
    .select()
    .single();
  
  if (error) {
    return Response.json({ error: 'Failed to save lead' }, { status: 500 });
  }
  
  // 2. Send notification to client (email + optional WhatsApp)
  await sendLeadNotification(projectId, lead);
  
  // 3. Forward to Mailchimp if configured
  const mailchimpIntegration = await getProjectIntegration(projectId, 'mailchimp');
  if (mailchimpIntegration?.status === 'active' && email) {
    await addToMailchimp(projectId, email, name);
  }
  
  return Response.json({ success: true, leadId: lead.id });
};
```

### 3.4 Frontend Integration Components

**Components call our API, never third-party services directly:**

```tsx
// apps/flowstarter-editor/app/components/integrations/CalendlyWidget.tsx
export function CalendlyWidget({ projectId }: { projectId: string }) {
  const [config, setConfig] = useState<{ enabled: boolean; embedUrl?: string } | null>(null);
  
  useEffect(() => {
    // Fetch from OUR API - not Calendly directly
    fetch(`/api/integrations/${projectId}/calendly`)
      .then(res => res.json())
      .then(setConfig);
  }, [projectId]);
  
  if (!config?.enabled) return null;
  
  return (
    <button 
      onClick={() => {
        // Open Calendly popup with public embed URL
        // @ts-ignore
        window.Calendly?.initPopupWidget({ url: config.embedUrl });
      }}
      className="btn btn-primary"
    >
      📅 Book a Call
    </button>
  );
}
```

```tsx
// apps/flowstarter-editor/app/components/integrations/MailchimpForm.tsx
export function MailchimpForm({ projectId }: { projectId: string }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    // Submit to OUR API - we handle Mailchimp server-side
    const res = await fetch(`/api/integrations/${projectId}/mailchimp/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    
    setStatus(res.ok ? 'success' : 'error');
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="email" 
        value={email} 
        onChange={e => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
      />
      <button type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
      </button>
      {status === 'success' && <p>Thanks for subscribing!</p>}
    </form>
  );
}
```

```tsx
// apps/flowstarter-editor/app/components/integrations/ContactForm.tsx
export function ContactForm({ projectId }: { projectId: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    
    const formData = new FormData(e.currentTarget);
    const urlParams = new URLSearchParams(window.location.search);
    
    // Submit to OUR API
    const res = await fetch(`/api/integrations/${projectId}/contact-form`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        message: formData.get('message'),
        utm_source: urlParams.get('utm_source'),
        utm_medium: urlParams.get('utm_medium'),
        utm_campaign: urlParams.get('utm_campaign'),
      }),
    });
    
    setStatus(res.ok ? 'success' : 'error');
    if (res.ok) e.currentTarget.reset();
  };
  
  if (status === 'success') {
    return (
      <div className="success-message">
        <h3>Thanks for reaching out!</h3>
        <p>We'll get back to you soon.</p>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Your name" required />
      <input name="email" type="email" placeholder="your@email.com" required />
      <input name="phone" type="tel" placeholder="Phone (optional)" />
      <textarea name="message" placeholder="How can we help?" required />
      <button type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}
```

### 3.5 Supabase Vault Helper

```typescript
// apps/flowstarter-editor/app/lib/vault.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // Service key for vault access
);

export async function getVaultSecret(secretName: string): Promise<string> {
  const { data, error } = await supabase
    .rpc('get_secret', { secret_name: secretName });
  
  if (error) {
    throw new Error(`Failed to get secret ${secretName}: ${error.message}`);
  }
  
  return data;
}

export async function setVaultSecret(secretName: string, secretValue: string): Promise<void> {
  const { error } = await supabase
    .rpc('set_secret', { 
      secret_name: secretName,
      secret_value: secretValue,
    });
  
  if (error) {
    throw new Error(`Failed to set secret ${secretName}: ${error.message}`);
  }
}

// Supabase function (create this in Supabase)
/*
CREATE OR REPLACE FUNCTION get_secret(secret_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  secret_value TEXT;
BEGIN
  SELECT decrypted_secret INTO secret_value
  FROM vault.decrypted_secrets
  WHERE name = secret_name;
  
  RETURN secret_value;
END;
$$;
*/
```

### 3.6 Integration Security Checklist

| Rule | Implementation |
|------|----------------|
| **No API keys in frontend** | All keys in Supabase Vault |
| **No direct third-party calls from browser** | All calls through `/api/integrations/*` |
| **Server-side only vault access** | Service key only on server |
| **Webhook signature verification** | Verify all incoming webhooks |
| **Per-project isolation** | Each project has own secrets |
| **Audit logging** | Log all vault access |

**Estimated time:** 3 days

---

## Summary: Week-by-Week

| Week | Focus | Deliverables |
|------|-------|-------------|
| **Week 1** | Editor Refactor | Split into internal/client modes, route structure |
| **Week 2** | Internal Draft Generator | Template selector, business info form, content gen |
| **Week 3** | Customization Engine | Request analyzer, plan generator, executor |
| **Week 4** | Analytics Backend | GA4 service, Supabase schema, caching |
| **Week 5** | Analytics UI | Dashboard, leads list, notifications |
| **Week 6** | Publish Pipeline | CF Pages upload, R2 backup, rollback |
| **Week 7** | Integrations | Components, secure API routes, Vault setup |
| **Week 8** | Polish + Pilot | Testing, end-to-end, first client |

### Detailed Phase Timeline

```
WEEK 1: Editor Refactor
├── Day 1-2: Create route structure (/internal/*, /project/*)
├── Day 3-4: Extract shared components
└── Day 5: Create internal layout with team auth

WEEK 2: Internal Draft Generator
├── Day 1-2: Template selector UI
├── Day 3-4: Business info form (from discovery call)
├── Day 5-6: AI content generation pipeline
└── Day 7: Internal editor with full workbench

WEEK 3: Customization Engine
├── Day 1-2: Template schema system
├── Day 3-4: Request analyzer (Claude)
├── Day 5-6: Plan generator + executor
└── Day 7: Validation layer

WEEK 4: Analytics Backend
├── Day 1-2: Supabase schema (leads, analytics_snapshots)
├── Day 3-4: GA4 Data API integration
├── Day 5: Caching layer + cron job
└── Day 6-7: API routes

WEEK 5: Analytics UI
├── Day 1-2: Metric cards (visitors, pageviews, leads)
├── Day 3: Trend chart
├── Day 4-5: Leads list + detail view
└── Day 6-7: Notifications (email + WhatsApp)

WEEK 6: Publish Pipeline
├── Day 1-2: Build pipeline (Convex → static)
├── Day 3-4: Cloudflare Pages Direct Upload
├── Day 5: R2 backup + rollback
└── Day 6-7: Domain configuration

WEEK 7: Integrations
├── Day 1-2: Supabase Vault setup
├── Day 3-4: Integration components (Calendly, Contact)
├── Day 5: Server-side API routes
└── Day 6-7: Integration testing

WEEK 8: Polish + Pilot
├── Day 1-2: Error handling + empty states
├── Day 3-4: End-to-end testing
├── Day 5: Documentation
└── Day 6-7: 🎯 PILOT CLIENT ONBOARD
```

---

## Files to Create (Summary)

```
NEW FILES:
├── apps/flowstarter-editor/
│   └── app/
│       │
│       ├── routes/
│       │   ├── internal/                    # NEW: Internal-only routes
│       │   │   ├── _layout.tsx              # Team auth check
│       │   │   ├── new.tsx                  # Template → business info
│       │   │   └── draft.$projectId.tsx     # Full internal editor
│       │   ├── project.$projectId.tsx       # SIMPLIFIED: Client editor
│       │   ├── api.publish.ts               # CF Pages publish
│       │   ├── api.customization.ts         # Customization endpoint
│       │   └── api.integrations.$projectId.*.ts
│       │
│       ├── components/
│       │   ├── shared/                      # NEW: Used by both modes
│       │   │   ├── EditorLayout.tsx
│       │   │   ├── PreviewPanel.tsx
│       │   │   └── chat/
│       │   │       ├── ChatInput.tsx
│       │   │       └── MessageBubble.tsx
│       │   │
│       │   ├── internal/                    # NEW: Internal mode only
│       │   │   ├── InternalChatPanel.tsx
│       │   │   ├── TemplateSelector.tsx
│       │   │   ├── BusinessInfoForm.tsx
│       │   │   ├── ContentGenerator.tsx
│       │   │   ├── IntegrationSetup.tsx
│       │   │   ├── DraftPublisher.tsx
│       │   │   └── FullWorkbench/
│       │   │       ├── FileTree.tsx
│       │   │       ├── CodeEditor.tsx
│       │   │       └── Terminal.tsx
│       │   │
│       │   └── client/                      # NEW: Client mode only
│       │       ├── SimpleChangeChat.tsx
│       │       ├── ReadOnlyFileTree.tsx
│       │       ├── PublishButton.tsx
│       │       ├── ExportButton.tsx
│       │       └── ChangeApprovalFlow.tsx
│       │
│       └── services/customization/          # NEW: Customization engine
│           ├── index.ts
│           ├── request-analyzer.ts
│           ├── plan-generator.ts
│           ├── executor.ts
│           └── types.ts
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

## Editor Component Migration Map

| Current Location | Action | New Location |
|-----------------|--------|--------------|
| `editor/EditorLayout.tsx` | Move | `shared/EditorLayout.tsx` |
| `editor/EditorChatPanel.tsx` | Split | `internal/InternalChatPanel.tsx` + `client/SimpleChangeChat.tsx` |
| `editor/editor-chat/components/TemplateGallery.tsx` | Move | `internal/TemplateSelector.tsx` |
| `editor/editor-chat/components/BuildTimeline.tsx` | Move | `internal/ContentGenerator.tsx` |
| `editor/editor-chat/components/IntegrationsPanel.tsx` | Move | `internal/IntegrationSetup.tsx` |
| `editor/editor-chat/components/ChatInput.tsx` | Move | `shared/chat/ChatInput.tsx` |
| `workbench/file-tree/` | Keep + Simplify | `internal/FullWorkbench/FileTree.tsx` + `client/ReadOnlyFileTree.tsx` |
| `workbench/terminal/` | Move | `internal/FullWorkbench/Terminal.tsx` |
| `editor/codemirror/` | Move | `internal/FullWorkbench/CodeEditor.tsx` |

---

*Created: 2026-02-23*
*Owner: Darius Popescu*
