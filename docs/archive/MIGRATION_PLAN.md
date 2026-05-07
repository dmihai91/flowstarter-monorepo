# Migration Plan: Claude Code on Daytona

## Overview
Replace custom AI agents with Claude Code running on Daytona workspaces.
Revamp editor UI to match new glassmorphism design.
Feed Convex state (project data, chat history) into Claude Code context.

## Current Architecture

```
Team Dashboard (flowstarter-main)
    ↓ Business details + AI suggestions
Draft Project (DB)
    ↓ Open in editor
Editor (flowstarter-editor)
    ↓ Custom AI agents generate code
    │ ├── business-data-agent.ts
    │ ├── code-generator-agent.ts
    │ ├── customizer-agent.ts
    │ ├── fixer-agent.ts
    │ ├── planner-agent.ts
    │ ├── reviewer-agent.ts
    │ └── template-recommender-agent.ts
    ↓
Daytona Preview Sandbox
    ↓
Build & Deploy
```

## New Architecture

```
Team Dashboard (flowstarter-main)
    ↓ Business details + AI suggestions (KEEP AS IS)
Draft Project (DB)
    ↓ Open in editor
Editor (flowstarter-editor)
    ↓ Claude Code on Daytona Workspace
    │ ├── Spin up Daytona workspace
    │ ├── Install Claude Code CLI
    │ ├── Send generation prompt
    │ └── Claude Code generates files
    ↓
Preview in same Daytona workspace
    ↓
Build & Deploy
```

## Migration Steps

### Phase 0: Editor UI Revamp
1. Apply glassmorphism styling to editor:
   - Frosted glass sidebar
   - Transparent header
   - Updated chat UI
   - Modern card components
2. Match flowstarter-main design language

### Phase 1: Backup Legacy Agents
1. Create new repo: `flowstarter-legacy-agents`
2. Move all custom agent code:
   - `app/lib/flowstarter/agents/*`
   - `app/lib/services/claude-agent/*`
   - Related tests

### Phase 2: Claude Code Integration
1. Create Daytona workspace template with:
   - Node.js environment
   - Claude Code CLI pre-installed
   - Astro project template
2. Implement ClaudeCodeService:
   - `spawnWorkspace()` - Create Daytona workspace
   - `runClaudeCode(prompt)` - Execute Claude Code CLI
   - `getGeneratedFiles()` - Retrieve output
3. Update editor to use new service

### Phase 2.5: Convex State → Claude Code Context
1. On workspace creation, inject project context:
   ```
   CONTEXT.md (auto-generated)
   ├── Business Info (from Convex)
   │   ├── Name, Industry, Description
   │   ├── Target Audience, UVP
   │   └── Goals, Brand Tone
   ├── Client Info
   │   └── Name, Email, Phone
   ├── Contact Info
   │   └── Email, Phone, Address, Website
   └── Chat History (conversation so far)
   ```
2. Claude Code reads CONTEXT.md as part of system prompt
3. Updates to Convex → sync to CONTEXT.md in workspace
4. Claude Code has full project context for generation

### Phase 3: E2E Flow
1. Team Dashboard → Create project with business details
2. Editor opens → Claude Code workspace spins up
3. User provides requirements → Claude Code generates site
4. Preview shows result
5. User can iterate with Claude Code
6. Build & Deploy

## Files to Create/Modify

### New Files
- `app/lib/services/claudeCodeService.server.ts` - Main service
- `app/lib/services/claude-code/workspaceManager.ts` - Workspace lifecycle
- `app/lib/services/claude-code/cliInterface.ts` - Claude Code CLI wrapper
- `app/routes/api.claude-code.generate.ts` - API endpoint

### Modified Files
- `app/components/editor/editor-chat/hooks/useSimpleBuildHandlers.ts`
- `app/routes/api.onboarding-chat.ts`

### Deleted (after backup)
- `app/lib/flowstarter/agents/*`
- `app/lib/services/claude-agent/*`

## Environment Variables Needed
```
CLAUDE_CODE_API_KEY=xxx  # Or use existing ANTHROPIC_API_KEY
DAYTONA_API_KEY=xxx      # Existing
DAYTONA_SERVER_URL=xxx   # Existing
```

## Testing Checklist
- [ ] Business details generation works (team dashboard)
- [ ] Draft project saves correctly
- [ ] Editor opens with Claude Code workspace
- [ ] Generation prompt produces valid code
- [ ] Preview loads correctly
- [ ] Iteration works (edit → regenerate)
- [ ] Build succeeds
- [ ] Deploy works

## Rollback Plan
If issues arise, revert to legacy agents by:
1. Restore agent code from `flowstarter-legacy-agents` repo
2. Revert service imports

---

**Ready to proceed?**
