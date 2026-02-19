# Flowstarter Editor Refactoring Plan

This document tracks the refactoring status of the codebase against the guidelines defined in [AGENTS.md](AGENTS.md) and the [.skills/](.skills/) documentation.

**Last Updated:** January 2026

---

## Summary

| Category | Issues Found | Priority | Status |
|----------|--------------|----------|--------|
| Oversized Components (>250 lines) | 45 files | Critical | 🔴 Not Started |
| Oversized Services (>500 lines) | 5 files | Critical | 🔴 Not Started |
| `any` Type Usage | 17+ files | High | 🔴 Not Started |
| Oversized Hooks (>250 lines) | 8 files | High | 🔴 Not Started |
| Missing `memo()` | 83+ components | Medium | 🔴 Not Started |
| Console Statements | 52+ occurrences | Medium | 🔴 Not Started |
| Naming Violations | ~10 files | Low | 🔴 Not Started |

---

## Phase 1: Critical (Performance & Stability)

### 1.1 Oversized Services (1000+ lines)

| File | Lines | Status | Suggested Split |
|------|-------|--------|-----------------|
| `lib/services/daytonaService.server.ts` | 1538 | 🔴 | See below |
| `lib/services/claudeAgentService.server.ts` | 1282 | 🔴 | See below |

#### daytonaService.server.ts (1538 lines)

**Current**: One massive service handling workspace CRUD, file operations, exec commands, builds, and previews.

**Proposed split**:
```
app/lib/services/daytona/
├── index.ts                    # Re-exports & main facade
├── DaytonaClient.ts            # Base HTTP client (~150 lines)
├── WorkspaceService.ts         # Create/delete/get workspaces (~300 lines)
├── FileService.ts              # File upload/download/sync (~300 lines)
├── ExecService.ts              # Command execution (~200 lines)
├── BuildService.ts             # bun install, build (~200 lines)
├── PreviewService.ts           # Preview URL management (~150 lines)
└── types.ts                    # Shared types (~50 lines)
```

#### claudeAgentService.server.ts (1282 lines)

**Current**: Agent service handling message processing, tool execution, and streaming.

**Proposed split**:
```
app/lib/services/agent/
├── index.ts                    # Re-exports & main interface
├── AgentCore.ts                # Core agent loop (~300 lines)
├── ToolExecutor.ts             # Tool call handling (~300 lines)
├── MessageProcessor.ts         # Message parsing/formatting (~200 lines)
├── StreamHandler.ts            # SSE/streaming logic (~200 lines)
└── types.ts                    # Agent types (~50 lines)
```

### 1.2 Oversized Components (800+ lines)

| File | Lines | Status | Suggested Split |
|------|-------|--------|-----------------|
| `components/workbench/FileTree.tsx` | 934 | 🔴 | `FileTreeNode`, `FileTreeFolder`, `FileTreeFile`, `FileTreeContextMenu`, `FileTreeDragDrop` |
| `components/chat/BaseChat.tsx` | 834 | 🔴 | `BaseChatLayout`, `ChatMessageList`, `ChatFeatures`, `ChatToolbar` |
| `components/editor/components/ConversationSidebar.tsx` | 822 | 🔴 | `ConversationList`, `ConversationItem`, `ConversationSearch`, `ConversationActions` |
| `components/workbench/DaytonaPreview.tsx` | 815 | 🔴 | `PreviewFrame`, `PreviewControls`, `PreviewLoading`, `FloatingOrb`, `GridPattern` |
| `components/chat/Chat.client.tsx` | 686 | 🔴 | `ChatContainer`, `ChatStateManager`, `ChatHandlers` |

#### FileTree.tsx (934 lines)

**Proposed split**:
```
app/components/workbench/FileTree/
├── index.ts                    # Re-exports FileTree
├── FileTree.tsx                # Main container (~200 lines)
├── FileTreeNode.tsx            # Single file/folder node (~150 lines)
├── FileTreeContextMenu.tsx     # Right-click menu (~100 lines)
├── FileTreeDragDrop.tsx        # DnD logic (~100 lines)
├── useFileTreeState.ts         # State hook (~100 lines)
├── useFileTreeActions.ts       # Actions hook (~100 lines)
└── fileTreeUtils.ts            # Sorting, filtering (~100 lines)
```

#### BaseChat.tsx (834 lines)

**Proposed split**:
```
app/components/chat/BaseChat/
├── index.ts                    # Re-exports BaseChat
├── BaseChat.tsx                # Slim coordinator (~200 lines)
├── ChatMessageList.tsx         # Message rendering (~150 lines)
├── ChatInput.tsx               # Input field & controls (~150 lines)
├── ChatHeader.tsx              # Header section (~100 lines)
├── ChatToolbar.tsx             # Toolbar actions (~100 lines)
├── useChatHandlers.ts          # Event handlers (~100 lines)
└── useChatState.ts             # State management (~100 lines)
```

### 1.3 Large Store Files

| File | Lines | Status | Suggested Split |
|------|-------|--------|-----------------|
| `lib/stores/workbench.ts` | 1350 | 🔴 | See below |
| `lib/stores/files.ts` | ~700 | 🔴 | Extract file operations to utilities |
| `lib/stores/settings.ts` | 361 | 🟡 | `providerSettings.ts`, `appSettings.ts`, `tabSettings.ts` |

#### workbench.ts (1350 lines)

**Proposed split**:
```
app/lib/stores/workbench/
├── index.ts                    # Re-exports combined store
├── editorStore.ts              # Selected file, editor instance (~200 lines)
├── fileTreeStore.ts            # File tree expansion, visibility (~200 lines)
├── terminalStore.ts            # Terminal state, panels (~200 lines)
├── previewStore.ts             # Preview URLs, ports (~200 lines)
├── actions.ts                  # Shared actions (~200 lines)
└── types.ts                    # Store types (~50 lines)
```

### 1.4 Remove `any` Types (High Priority)

Files with explicit `any` types that need proper typing:

| File | Location | Issue | Fix |
|------|----------|-------|-----|
| `components/chat/Chatbox.tsx` | Lines 32-34 | `provider: any`, `providerList: any[]` | Create `IProvider`, `IProviderList` interfaces |
| `components/workbench/ScreenshotStateManager.tsx` | Lines 22-29 | `window as any` casts | Create `ExtendedWindow` type |
| `components/chat/Artifact.tsx` | Line 184 | `filePath: any` | Use `string` or `FilePath` type |
| `components/chat/BaseChat.tsx` | Multiple | Any casts in message handling | Create `Message` union types |
| `components/chat/AssistantMessage.tsx` | Props | `{ type: string; value: any }` | Create `MessageValue` discriminated union |
| `lib/hooks/useConvexSync.ts` | Multiple | `businessInfo?: any` | Define `BusinessInfo` interface |
| `lib/hooks/useSimpleBuildHandlers.ts` | Variable | `result: any` | Type API response |
| `components/@settings/shared/components/SearchInterface.tsx` | Callback | `value: any` | Create `SettingValue` union |

**Additional files with `any`:**
- `lib/utils/EnvMasking.ts`
- `components/chat/ProgressIndicator.tsx`
- `components/workbench/LockManager.tsx`
- `lib/GTMProvider.tsx`
- `components/sidebar/ImportFolderButton.tsx`
- And 11+ more files

---

## Phase 2: Important (Code Quality)

### 2.1 Oversized Hooks (250+ lines)

| File | Lines | Status | Suggested Split |
|------|-------|--------|-----------------|
| `lib/hooks/useStickToBottom.tsx` | 606 | 🔴 | `useScrollState`, `useScrollAnimation`, `useScrollElements` |
| `lib/hooks/useDaytonaPreview.ts` | 600 | 🔴 | `usePreviewState`, `useFileSync`, `useAutoFix` |
| `components/editor/editor-chat/hooks/useEditorChatState.ts` | 557 | 🔴 | Further decompose or document |
| `lib/hooks/useAgentExecution.ts` | 389 | 🔴 | `useAgentState`, `useAgentStream`, `useAgentFiles` |
| `lib/hooks/useConversations.ts` | 364 | 🔴 | Extract data fetching logic |

### 2.2 Components Missing `memo()`

High-priority components that should use `memo()`:

| Component | Reason |
|-----------|--------|
| `ControlPanel.tsx` | Expensive rendering, frequent parent updates |
| `Menu.client.tsx` | Complex sidebar with many re-renders |
| `Chatbox.tsx` | Frequent prop updates from typing |
| `PersonalizationPanel.tsx` | Palette/font selection triggers |
| `TemplateRecommendationGallery.tsx` | Gallery with many items |
| `PaletteSelector.tsx` | Color selection updates |
| `SuggestedReplies.tsx` | List rendering optimization |

**Statistics:**
- 45 components using `memo()` ✓
- 83+ components using plain function declarations (should add `memo()`)

### 2.3 Remove Console Statements

~52 `console.log` statements found across the codebase. Replace with scoped logger:

```typescript
// Before
console.log('debug', data);

// After
import { createScopedLogger } from '~/utils/logger';
const logger = createScopedLogger('ComponentName');
logger.debug('debug', { data });
```

**Files with console statements:**
- `lib/stores/settings.ts` (lines 292, 311)
- Multiple component files
- Several hook files

---

## Phase 3: Enhancement (Maintainability)

### 3.1 Naming Convention Violations

| File | Issue | Fix |
|------|-------|-----|
| `components/ui/text-shimmer.tsx` | Lowercase filename | Rename to `TextShimmer.tsx` |
| `components/ui/slide-content.tsx` | Lowercase filename | Rename to `SlideContent.tsx` |
| Similar files in `/ui` directory | Inconsistent casing | Standardize to PascalCase |

### 3.2 Oversized Props Interfaces

| Component | Props Size | Suggestion |
|-----------|------------|------------|
| `Chatbox.tsx` | 77 props | Create `ProviderProps`, `FileProps`, `StreamProps` subinterfaces |
| `BaseChat.tsx` | 80+ props | Use prop composition pattern |

### 3.3 Large Functions (20+ lines)

Found in:
- `FileTree.tsx`: `buildFileList()`, `compareNodes()`
- `BaseChat.tsx`: Message processing functions
- `CodeMirrorEditor.tsx`: Extension configuration

---

## Code Cleanup Tasks

### Remove Dead Code
- [ ] WebContainer references (replaced by Daytona)
- [ ] Electron-related code
- [ ] Git integration (GitCloneButton, useGit, etc.)
- [ ] Netlify deploy
- [ ] Vercel deploy
- [ ] Cloudflare deploy
- [ ] Unused AI providers (keep only OpenRouter)
- [ ] MCP marketplace/integrations

---

## Refactoring Guidelines

### How to Refactor a Large Component

1. **Create directory structure:**
   ```
   ComponentName/
   ├── index.ts          # Re-exports main component
   ├── ComponentName.tsx # Main component (<250 lines)
   ├── types.ts          # All TypeScript interfaces
   ├── utils.ts          # Pure utility functions
   ├── hooks.ts          # Component-specific hooks
   ├── SubComponent1.tsx # Extracted sub-component
   └── SubComponent2.tsx # Extracted sub-component
   ```

2. **Extract types first:**
   ```typescript
   // types.ts
   export interface ComponentNameProps { ... }
   export interface SubComponentProps { ... }
   ```

3. **Extract sub-components:**
   ```typescript
   // SubComponent.tsx
   import { memo } from 'react';
   import type { SubComponentProps } from './types';

   export const SubComponent = memo(function SubComponent(props: SubComponentProps) {
     // <100 lines
   });
   ```

4. **Create facade:**
   ```typescript
   // index.ts
   export { ComponentName } from './ComponentName';
   export type { ComponentNameProps } from './types';
   ```

### How to Remove `any` Types

1. **Identify the actual type:**
   - Check how the value is used
   - Look at the source of the data
   - Check API responses or function signatures

2. **Create appropriate interface:**
   ```typescript
   // Before
   function process(data: any) { ... }

   // After
   interface DataInput {
     id: string;
     value: number;
   }
   function process(data: DataInput) { ... }
   ```

3. **Use discriminated unions for variants:**
   ```typescript
   type MessageContent =
     | { type: 'text'; value: string }
     | { type: 'code'; value: string; language: string }
     | { type: 'image'; value: string; alt: string };
   ```

### How to Add `memo()`

```typescript
// Before
export function Component(props: Props) {
  return <div>...</div>;
}

// After
import { memo } from 'react';

export const Component = memo(function Component(props: Props) {
  return <div>...</div>;
});
```

---

## Progress Tracking

### Legend

- 🔴 Not Started
- 🟡 In Progress
- 🟢 Complete
- ⏸️ Blocked

### Implementation Priority

1. **High Priority** (most impactful):
   - `daytonaService.server.ts` - Core service, blocks other work
   - `workbench.ts` - Central store, affects many components
   - Remove all `any` types

2. **Medium Priority**:
   - `BaseChat.tsx` - Frequently modified
   - `FileTree.tsx` - Complex interactions
   - Add `memo()` to components

3. **Lower Priority** (can wait):
   - `ConversationSidebar.tsx`
   - `DaytonaPreview.tsx`
   - `claudeAgentService.server.ts`
   - Naming convention fixes

### Current Sprint

| Task | Assignee | Status | PR |
|------|----------|--------|-----|
| - | - | - | - |

### Completed

| Task | Date | PR |
|------|------|-----|
| - | - | - |

---

## Notes

### Dependencies Between Tasks

1. Types must be extracted before splitting components
2. Service refactoring may require API route updates
3. Store refactoring requires updating all consumers
4. `any` removal in shared types affects multiple files

### Risk Areas

- **FileTree.tsx** - Complex drag/drop logic, careful testing needed
- **claudeAgentService** - Core AI functionality, needs thorough testing
- **daytonaService** - Integration with external service, mock carefully

### Testing Requirements

All refactored code must have:
- Unit tests for extracted functions
- Component tests for new sub-components
- Integration tests for service modules
- E2E tests if user-facing behavior changes

**Current Coverage:** ~70% (estimated)
**Target Coverage:** 90%

---

## References

- [AGENTS.md](AGENTS.md) - Main coding guidelines
- [.skills/clean-code-skill.md](.skills/clean-code-skill.md) - Clean code patterns
- [.skills/frontend-skill.md](.skills/frontend-skill.md) - Frontend patterns
- [.skills/backend-skill.md](.skills/backend-skill.md) - Backend patterns
- [.skills/testing-skill.md](.skills/testing-skill.md) - Testing patterns
