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
