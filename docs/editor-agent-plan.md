# Editor Agent Architecture Plan

## Current State

### Architecture (3-Tier Agent System — "Gretly")
1. **PlannerAgent** (`claude-opus-4`) — Plans modifications, reviews, escalation
2. **CodeGeneratorAgent** (`kimi-k2.5-instruct`) — Fast code generation
3. **FixerAgent** (`claude-sonnet-4`) — Error fixing with tiered approach

### Infrastructure
- **Claude Agent SDK** (`@anthropic-ai/claude-agent-sdk@0.1.56`) — `claudeAgentSDK.server.ts` uses `query()` API with PostToolUse hooks
- **Daytona Sandboxes** — File execution, preview, build validation
- **FlowOps Protocol** — Agent registration, message passing between tiers
- **Vercel AI SDK** (`ai`) — Streaming in `api.llmcall.ts`
- **LLMManager** — Multi-provider (Anthropic, OpenRouter, etc.)

### Current Generation Flow
1. User describes business → Template selection → PlannerAgent (Opus) creates plan
2. CodeGeneratorAgent (Kimi K2.5) generates files → Build in Daytona → FixerAgent heals errors
3. ReviewerAgent scores output → Below threshold = refine loop

### Problems
- Kimi K2.5 is slow and unreliable for website code
- 3-agent pipeline is over-engineered for single-site generation
- No streaming preview — user waits for full generation
- Opus planning step adds 15-30s for minimal value
- Review loop adds 10-20s — team reviews manually anyway

---

## Proposed Architecture

### Core Principle
One capable model. One pass. Streaming output. Live preview.

### Model Strategy

| Role | Current | Proposed | Why |
|------|---------|----------|-----|
| Site Generation | Kimi K2.5 | `claude-sonnet-4-20250514` | Best code quality/speed ratio. Extended thinking for complex sites |
| Chat/Editing | `claude-sonnet-4` (UI) | Same | Consistent behavior |
| Planning | `claude-opus-4` | **Remove** | Sonnet 4 can plan + execute in one pass |
| Error Fixing | `claude-sonnet-4` | Keep as fallback | Integrated into generation loop |
| Review | Separate agent | **Remove** | Team reviews manually |

**Impact:** ~30-60s faster per generation. ~50% cost reduction.

### New Pipeline

```
User Request
    |
    v
  Claude Sonnet 4 (Extended Thinking)
  Single-pass: plan + generate
  Streaming file output
    |
    v
  Daytona Sandbox
  - Write files as they stream
  - Hot-reload preview
  - Build validation
    |
    v (build error?)
  Self-Heal Loop (max 3)
  Same Sonnet 4, error context
```

### Agent SDK Integration

**Option B (ship fast):** Keep Agent SDK server-side, proxy file operations to Daytona:

```
Editor Server (Agent SDK query())
    |--- file write ---> Daytona API (write file)
    |--- build cmd ----> Daytona API (exec)
    |<-- build output -- Daytona API
    |--- fix + write --> Daytona API
```

The Agent SDK's PostToolUse hooks already intercept file writes — redirect them to Daytona instead of local fs.

### Streaming Architecture

```typescript
for await (const message of agentSDK.query({ prompt, options })) {
  if (message.tool === 'Write') {
    await daytona.writeFile(message.path, message.content);  // Immediate
    stream.push({ type: 'file_update', path: message.path }); // Client notified
    // Preview hot-reloads automatically
  }
}
```

---

## Implementation Phases

### Phase 1: Model Swap + Pipeline Simplification (1-2 days)
- Replace Kimi K2.5 with `claude-sonnet-4-20250514` in CodeGeneratorAgent
- Remove PlannerAgent (Opus) — merge planning into generation prompt
- Remove ReviewerAgent — team reviews manually
- Update `DEFAULT_MODEL` to `claude-sonnet-4-20250514`
- Enable extended thinking (10K budget) for generation
- Keep FixerAgent as self-heal with same Sonnet 4

### Phase 2: Streaming File Output (2-3 days)
- `api.agent-code.ts` streams file changes via SSE
- `useAgentCode` processes SSE events, writes to sandbox progressively
- Preview panel hot-reloads on each file write
- Progress: "Creating index.html..." -> "Styling..." -> "Adding interactivity..."

### Phase 3: Agent SDK Proper Integration (3-5 days)
- Website-specific system prompts (not generic code)
- Custom Agent SDK tools proxied to Daytona:
  - WriteFile, ReadFile, RunCommand, PreviewSite
- Conversation memory — agent remembers previous changes
- Edit mode: "Change hero color to blue" -> reads files, targeted edit

### Phase 4: UI Improvements for Technical Team (2-3 days)
- File tree in sidebar with syntax highlighting
- Diff view after each edit (inline diff)
- Terminal panel for build output/errors (collapsible)
- Quick action buttons ("Change colors", "Add section", "Update copy")
- Monaco editor for direct code editing (bypass AI for quick fixes)

### Phase 5: Performance (1-2 days)
- Pre-warm Daytona sandboxes (prewarmService.ts exists)
- Template caching — pre-generate bases, AI customizes
- Incremental builds (only changed files)

---

## System Prompts

### Generation (Single-Pass)
```
You are a senior web developer building a professional website.

Business: {businessName}
Description: {description}
Industry: {industry}
Target Audience: {targetAudience}
Brand Tone: {brandTone}
Services: {offerings}
Template: {templateSlug}

Generate a complete, production-ready website. Write each file individually.
Use modern HTML, Tailwind CSS, and minimal vanilla JS.
Responsive, accessible, fast.

Structure:
- index.html (all sections)
- styles.css (custom beyond Tailwind)
- script.js (interactions)

Focus: Clear hierarchy, strong CTAs, mobile-first, real copy (not lorem ipsum),
professional palette matching brand tone.
```

### Edit
```
You are editing an existing website. Read the current files, understand the
structure, make the minimal targeted change. Do NOT rewrite unrelated sections.
User request: {editRequest}
```

---

## Cost Estimate
- Generation: ~$0.15-0.30 (Sonnet 4 + extended thinking)
- Error fixing: ~$0.05-0.10
- **Total: ~$0.20-0.40 per site** (was ~$0.80+ with Opus + Kimi + Review)

## Timeline
| Phase | Duration | Priority |
|-------|----------|----------|
| 1. Model swap + simplify | 1-2 days | P0 |
| 2. Streaming output | 2-3 days | P0 |
| 3. Agent SDK proper | 3-5 days | P1 |
| 4. UI improvements | 2-3 days | P1 |
| 5. Performance | 1-2 days | P2 |

**Total: ~10-15 days to fully functional editor**

---

## Phase 2b: Agent Transparency Panel (for technical team)

### What the SDK Already Gives Us

The Agent SDK emits rich typed messages we're mostly ignoring:

| SDK Message Type | What It Contains | Currently Used? |
|---|---|---|
| `system` (init) | Tools list, model, cwd, mcp_servers | ✅ Partial (tool count only) |
| `assistant` | Text content + `tool_use` blocks (name, input) | ✅ Text only |
| `stream_event` | Raw Anthropic events — **includes thinking blocks** | ❌ Ignored |
| `tool_progress` | tool_name, elapsed_time_seconds | ✅ Basic ("Using Write...") |
| `result` | duration_ms, total_cost_usd, num_turns, modelUsage per model | ❌ Ignored |

### What We Should Stream to the Client

```typescript
// New SSE event types for the transparency panel
type AgentEvent =
  | { type: 'thinking'; text: string }           // Extended thinking content
  | { type: 'tool_call'; name: string; input: Record<string, unknown> }  // e.g. "Write index.html"
  | { type: 'tool_result'; name: string; duration_s: number }
  | { type: 'file_write'; path: string; lines: number }  // File created/updated
  | { type: 'file_read'; path: string }
  | { type: 'command'; cmd: string; output?: string }     // npm install, build, etc.
  | { type: 'text'; content: string }             // Agent's reasoning/narration
  | { type: 'error'; message: string }
  | { type: 'cost'; usd: number; tokens: { input: number; output: number } }
  | { type: 'done'; duration_ms: number; turns: number; cost_usd: number }
```

### UI: Collapsible Agent Activity Panel

```
┌─────────────────────────────────────────────────────┐
│ 🤖 Agent Activity                        ▼ Collapse │
├─────────────────────────────────────────────────────┤
│ 💭 Thinking (2.3s)                                  │
│   "I need to create a modern landing page for a     │
│    dental practice. The template uses a hero with    │
│    gradient background. Let me start with..."        │
│                                                      │
│ 📝 Write  index.html  (142 lines)           0.8s    │
│ 📝 Write  styles.css  (89 lines)            0.4s    │
│ 📝 Write  script.js   (34 lines)            0.3s    │
│ 📖 Read   package.json                     0.1s    │
│ ⚡ Run    npm install                       3.2s    │
│ ⚡ Run    npm run build                     1.8s    │
│ ✅ Build passed                                      │
│                                                      │
│ ──────────────────────────────────────────────────── │
│ ⏱ 12.4s  │  3 turns  │  $0.23  │  4,200 tokens     │
└─────────────────────────────────────────────────────┘
```

### Implementation

**Server side** (`processMessage` in `claudeAgentSDK.server.ts`):
- Forward `stream_event` thinking blocks → `{ type: 'thinking', text }`
- Forward `assistant` tool_use blocks → `{ type: 'tool_call', name, input }`
- Forward `tool_progress` → `{ type: 'tool_result', name, duration_s }`
- Forward `result` → `{ type: 'done', duration_ms, turns, cost_usd }`
- Parse Write/Read/Bash from tool_use inputs for file/command events

**Client side** (new `useAgentActivity` hook + `AgentActivityPanel` component):
- Accumulate events in a log array
- Render in a collapsible panel below the chat or beside the preview
- Thinking blocks shown in a muted/italic style (collapsible if long)
- File operations shown with icons + line counts
- Running cost/token counter at the bottom
- Auto-scroll to latest event

### Position in UI
- **Desktop**: Right sidebar panel (below file tree), collapsible
- **Mobile**: Bottom sheet, swipe up to expand
- **Default state**: Collapsed to summary bar ("Working... 3 files written, $0.12")
