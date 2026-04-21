# Editor Redesign: Skilled Operator Experience

## Overview
Complete redesign of the editor onboarding/build flow. The editor assists a **skilled operator** (not an end-user) through site creation. Design must be **outstanding** — no generic AI slop. Match the existing design system tokens.

## Design System Reference
- **Design tokens:** `app/styles/design-system-bridge.css` — use `--editor-*` CSS variables
- **UI components:** `app/components/ui/` — `Button`, `Dialog`, `Card`, `Input`, `Label`, `Badge`, etc.
- **Animations:** Framer Motion (`motion` from `framer-motion`)
- **Icons:** Lucide React (`lucide-react`)
- **Dark/Light mode:** All components MUST support both via `[data-theme='dark']` or Tailwind `dark:` classes
- **Dashboard reference for integrations:** See `../../flowstarter-main/src/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/dashboard/integrations/` — uses `GlassCard` pattern with status badges, icon containers, and modal wizards

## Current Flow (to be redesigned)
```
welcome → describe → name → quick-profile → business-uvp → business-offering → business-contact → template → personalization → integrations → creating → ready
```

## New Flow
```
welcome → describe → name → quick-profile → business-details → template → personalization → integrations → creating → ready
```

### Changes:
1. **Consolidate** `business-uvp` + `business-offering` + `business-contact` into ONE `business-details` form panel
2. **Template gallery** — show AI recommendations (top 3) AND full catalog (all templates), with live preview on right panel
3. **Integrations** — modal-based cards (Calendly + Google Analytics), matching dashboard's GlassCard + wizard pattern
4. **Build phase** — replace `BuildTimeline.tsx` with `AgentActivityLog.tsx` showing thinking + tool calls + output

## Component Specifications

### 1. `BusinessDetailsForm.tsx` (NEW — replaces 3 separate steps)
A single structured form panel with sections:
- **Value Proposition** — textarea, AI can pre-fill from description
- **Services/Offerings** — dynamic list (add/remove items), each with name + description + price (optional)
- **Contact Info** — structured fields: email, phone, address, website, social links
- **"Continue" button** at bottom
- Layout: clean card-based sections with subtle separators, icons for each section header
- Pre-fill from quick-profile data where possible

### 2. `TemplateGallery.tsx` (NEW — replaces `TemplateRecommendationGallery` + `FullTemplateGallery`)
Two sections in one scrollable panel:
- **"Recommended for You"** — top section, 3 cards with match score badge, larger thumbnails
- **"All Templates"** — full grid below, all 12 templates, with category/tag filters
- Each card shows: full-width thumbnail (NO clipping), template name, short description, palette dots
- Clicking a card selects it and shows live preview in right panel
- Selected card gets a ring/highlight treatment
- Use the existing `useRecommendations` hook for AI picks
- Use the existing `/api/templates` endpoint for full catalog

### 3. `IntegrationModal.tsx` (NEW — replaces `IntegrationsPanel.tsx`)
Grid of integration cards (GlassCard-style):
- **Calendly** — icon, name, description, status badge (connected/not), "Configure" button
- **Google Analytics** — same pattern
- Clicking "Configure" opens a **Dialog/modal** with the configuration form
- Calendly modal: URL input + validation
- GA modal: Measurement ID input (for now, OAuth wizard later)
- Match the dashboard's `IntegrationCard.tsx` visual style:
  - Rounded icon container with backdrop blur
  - Status badge (top-right) with pulse dot when connected
  - Hover scale effect on icon
  - Glass morphism card background

### 4. `AgentActivityLog.tsx` (NEW — replaces `BuildTimeline.tsx`)
Streaming log of agent activity during build, like a Cursor/Claude Code session:

**Three message types:**
- 💭 **Thinking** — agent reasoning blocks
  - Subtle background (`bg-indigo-50/50 dark:bg-indigo-950/20`)
  - Italic text, collapsible (click to expand/collapse)
  - Show first ~2 lines, expand for full reasoning
  - Example: "Analyzing business info... This is a fitness coaching site targeting premium clients. I'll use the coach-pro template with emphasis on booking CTAs and testimonials..."

- 🔧 **Tool Call** — file operations, commands
  - Monospace font for file paths and commands
  - Show action icon (file-plus, file-edit, terminal, etc.)
  - Compact format: `[icon] Creating src/pages/index.astro`
  - Expandable to show file content or command output
  - Color-coded: create=green, edit=blue, delete=red, command=gray

- ⚠️ **Error → Fix** — error detection and resolution
  - Error: red left-border, error message
  - Fix: orange left-border, agent's reasoning about the fix, then the fix action
  - Show the chain: Error → Thinking about fix → Fix applied

**Layout:**
- Scrollable log, auto-scrolls to bottom
- Timestamps on right (subtle, relative: "2s ago")
- Progress bar at very top of the log
- Each entry animates in (fade + slide from bottom)
- Filter buttons at top: All | Thinking | Actions | Errors

### 5. Updated `EditorChatPanel.tsx`
Simplify from 500+ lines to a **phase router**:
- Switch on current step, render the appropriate panel component
- Chat input only visible during chat-based steps (describe, name) and build phase (for operator commands)
- Clean component boundaries — each phase is a self-contained component

## Files to Remove (cleanup)
- `components/BuildTimeline.tsx` — replaced by AgentActivityLog
- `components/ContactDetailsPanel.tsx` — consolidated into BusinessDetailsForm
- `components/BusinessSummary.tsx` — no longer needed
- `components/SuggestedReplies.tsx` — operator doesn't need suggested replies
- `components/FullTemplateGallery.tsx` — consolidated into TemplateGallery
- `components/TemplateRecommendationGallery.tsx` — consolidated into TemplateGallery
- `components/BusinessContextCard.tsx` — consolidated into BusinessDetailsForm
- `hooks/businessDiscoveryHelpers.ts` — no longer separate steps

## Files to Keep (don't touch unless necessary)
- `components/QuickProfileSelector.tsx` — works well as-is
- `components/PaletteSelector.tsx` — works well
- `components/FontSelector.tsx` — works well
- `components/LogoSection.tsx` — works well
- `components/PersonalizationPanel.tsx` — works well, wraps palette/font/logo
- `components/ChatInput.tsx` — keep for chat and build phases
- `components/CreatingIndicator.tsx` — may be useful alongside AgentActivityLog
- All hooks in `hooks/` except businessDiscoveryHelpers (keep API, sync, template hooks)
- `types.ts` — update STREAMLINED_STEPS but keep the type system

## Types Update (`types.ts`)
Update `STREAMLINED_STEPS` to:
```typescript
export const STREAMLINED_STEPS: OnboardingStep[] = [
  'welcome',
  'describe',
  'name',
  'quick-profile',
  'business-details',  // was: business-uvp, business-offering, business-contact
  'template',
  'personalization',
  'integrations',
  'creating',
  'ready',
];
```

Add `'business-details'` to `OnboardingStep` type if not present.
Keep backward compatibility — old steps can still exist in the type but won't be in STREAMLINED_STEPS.

## Design Quality Standards
- **No walls of text** — use icons, badges, visual hierarchy
- **Proper spacing** — consistent padding (p-4, p-6), margins
- **Micro-interactions** — hover states, transitions, focus rings
- **Loading states** — skeleton screens, not spinners
- **Empty states** — helpful, not just "nothing here"
- **Responsive** — works at various panel widths (the editor panels resize)
- **Accessible** — proper ARIA labels, keyboard navigation, focus management

## Build Steps
1. Create `BusinessDetailsForm.tsx`
2. Create `TemplateGallery.tsx`
3. Create `IntegrationModal.tsx`
4. Create `AgentActivityLog.tsx`
5. Update `EditorChatPanel.tsx` to use new components
6. Update `types.ts` with new step
7. Update routing in `useSendHandler.ts` for new step
8. Remove deprecated files
9. Ensure dark/light mode works for all new components
10. Test that the app compiles without errors

## Important Notes
- The editor is a **Remix** app (not Next.js)
- Tailwind CSS v3 is used
- The app runs on Cloudflare Workers in production
- Don't break existing hooks/API routes — only change the UI layer
- The right panel preview component is separate — don't touch it
- Convex sync hooks should continue working — they react to state changes
