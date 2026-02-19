# Ralph Loop State

iteration: 2
status: active
task: Build orchestrator pipeline for working site creation

## Pipeline Requirements
1. **Collect business info** - Gather user's business details
2. **Select template** - Show 3 matching templates from MCP (verify they work)
3. **Select color palette** - 8 themes per template + custom option
4. **Select font** - 9 font options per template
5. **Build site** - Orchestrator with:
   - Planner using Sonnet 4
   - Kimi K2 LLM agent for modifications
   - Review with Sonnet 4
   - Verify site builds correctly

## Additional Requirements (from user)
- Templates should be unique and outstanding
- Each template should have multiple pages (home, contacts, services, etc.)
- Template previews must work correctly from MCP server

## Current Focus
- Testing orchestrator pipeline in browser
- Verifying end-to-end site generation flow

## Servers Running
- MCP Server: http://localhost:3001 (healthy)
- Editor: http://localhost:5175 (running)

## Progress Log
### Iteration 1
- Explored flowstarter-library (MCP server on port 3001)
  - HTTP API with live preview, scaffold endpoints
  - 9 templates: beauty-salon, fitness-coach, local-business-pro, personal-brand-pro, photography-portfolio, real-estate-pro, restaurant-cafe, saas-product-pro, therapist-wellness
- Explored flowstarter-editor
  - Full onboarding flow: welcome → describe → name → business-info → template → palette → font → creating → ready
  - Convex backend for state management
  - Orchestrator with state machine, handlers for Daytona, OpenCode, Opus planner
- Key components:
  - EditorChatPanel - main onboarding UI
  - Orchestrator - coordinates site generation
  - SitePlanner/OpusPlanner - AI planning
  - ConvexStateHandler - state persistence

## Architecture Summary
```
MCP Server (flowstarter-library)
├── /api/templates/:slug/live - Live preview
├── /api/templates/:slug/scaffold - Get template files
├── /api/scaffold-to-convex - Create project from template
└── Templates: 9 templates (Astro-based)

Editor (flowstarter-editor)
├── Onboarding flow (EditorChatPanel)
├── Orchestrator (state machine)
│   ├── OpusPlanner - Sonnet 4 planning
│   ├── DaytonaHandler - Workspace management
│   └── OpenCodeHandler - Code modification agent
└── Convex backend (projects, files, orchestrations)
```

## Additional User Requirements (Added During Session)
1. Templates should support localization (i18n)
2. Ask user for languages the site should support
3. Ask user for theme preference (light/dark)
4. Create more templates if needed to always have 3 recommendations
5. Each template should have multiple pages (services, contact, about)

## Template Status
Multi-page support (ALL COMPLETE):
- ✓ fitness-coach (about, contact, index, services)
- ✓ real-estate-pro (about, contact, index, services)
- ✓ beauty-salon (about, contact, index, services)
- ✓ local-business-pro (about, contact, index, services)
- ✓ personal-brand-pro (about, contact, index, services)
- ✓ photography-portfolio (about, contact, portfolio, services)
- ✓ restaurant-cafe (about, contact, index, menu)
- ✓ saas-product-pro (contact, features, index, pricing)
- ✓ therapist-wellness (about, contact, index, services)

All 9 templates build successfully and have multi-page support.

## Implementation Plan
Phase 1: Verify MCP Server & Templates ✅
- [x] Check MCP server health
- [x] Test template live preview in browser
- [x] Fix any template rendering issues

Phase 2: Add Multi-Page Support ✅
- [x] Add pages: services, contact, about to all templates
- [x] Fixed component prop mismatches (photography-portfolio, personal-brand-pro)
- [x] All 9 templates now build successfully
- [x] Navigation links work correctly

Phase 3: Orchestrator Pipeline ✅
- [x] Configure Sonnet 4 via OpenRouter for planning
- [x] Configure Kimi K2 via OpenRouter for execution
- [x] Configure Sonnet 4 via OpenRouter for review
- [x] Updated subsequent prompts to use orchestrator for rebuilds

Phase 3.5: Daytona Configuration ✅
- [x] Daytona API credentials configured in .env
- [x] Orchestrator uses Daytona for all builds and previews
- [x] Runtime mode set to 'daytona' (cloud-based builds)

Phase 4: Add Localization Support (PENDING)
- [ ] Add i18n infrastructure to templates
- [ ] Create content files for multiple languages
- [ ] Add language selection to onboarding flow

Phase 5: Onboarding Flow Improvements (PENDING)
- [ ] Ensure 3 templates are recommended based on business type
- [ ] Add language selection step
- [ ] Add theme selection step (light/dark/auto)
- [ ] Verify template preview works in dialog

Phase 6: End-to-End Testing (IN PROGRESS)
- [ ] Test complete flow in browser
- [ ] Write automated tests
