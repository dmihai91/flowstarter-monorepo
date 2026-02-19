# AI Agent Coding Guidelines for Flowstarter Editor

This document provides instructions for AI agents (Claude, Cursor, Copilot, etc.) working on the Flowstarter Editor codebase. These guidelines ensure consistent, high-quality code generation.

---

## Skills (Required Reading)

**Before starting any task, read the relevant skill:**

| Skill | When to Use | Location |
|-------|-------------|----------|
| **editor-frontend** | UI work, components, animations, styling | `.claude/skills/editor-frontend/SKILL.md` |
| **editor-backend** | Gretly, FlowOps, agents, autoheal system | `.claude/skills/editor-backend/SKILL.md` |
| **convex-patterns** | Database queries, mutations, real-time hooks | `.claude/skills/convex-patterns/SKILL.md` |
| **daytona-sandbox** | Preview infrastructure, sandbox lifecycle, errors | `.claude/skills/daytona-sandbox/SKILL.md` |

These skills contain architecture details, code patterns, and conventions you MUST follow.

---

## Project Overview

Flowstarter Editor is a web-based IDE that helps users create websites through AI-assisted code generation. The architecture includes:

- **Frontend:** React 19 + Remix + Vite + TypeScript
- **Backend:** Convex for real-time data, Daytona for cloud sandboxes
- **Styling:** UnoCSS + Tailwind + CSS Variables + Glassmorphism
- **State Management:** Nanostores (NOT Redux/Zustand)
- **AI Agents:** FlowOps framework + Gretly orchestrator (three-tier)
- **Autoheal:** Self-healing build system with deterministic + LLM fixes

---

## Critical Rules (MUST Follow)

### 1. File Size Limits

```
Maximum 250 lines per file
Maximum 20 lines per function
```

When a file exceeds limits:
1. Extract types to `types.ts`
2. Extract utilities to `utils.ts`
3. Extract hooks from components
4. Split by responsibility
5. Create `index.ts` facade

### 2. No `any` Types

```typescript
// BAD - Never use any
function process(data: any): any { ... }

// GOOD - Explicit types
interface DataInput { value: string; }
function process(data: DataInput): DataOutput { ... }
```

### 3. State Management

Use **Nanostores** exclusively:

```typescript
// Creating stores
import { atom, map } from 'nanostores';

export const isLoading = atom<boolean>(false);
export const files = map<Record<string, FileEntry>>({});

// Using in components
import { useStore } from '@nanostores/react';

function Component() {
  const loading = useStore(isLoading);
  const fileMap = useStore(files);
}
```

### 4. Component Pattern

```tsx
import { memo, useCallback } from 'react';
import { useStore } from '@nanostores/react';

interface ComponentProps {
  id: string;
  onAction?: (id: string) => void;
}

export const Component = memo(function Component({ id, onAction }: ComponentProps) {
  const handleAction = useCallback(() => {
    onAction?.(id);
  }, [id, onAction]);

  return <button onClick={handleAction}>Action</button>;
});
```

### 5. Error Handling

```typescript
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('ServiceName');

async function fetchData(): Promise<Result<Data>> {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return { success: true, data: await response.json() };
  } catch (error) {
    logger.error('Failed:', error);
    return { success: false, error };
  }
}
```

### 6. No Console Statements

```typescript
// BAD - No console.log
console.log('debug', data);

// GOOD - Use scoped logger
const logger = createScopedLogger('ComponentName');
logger.debug('debug', { data });
```

---

## Directory Structure

```
flowstarter-editor/
├── .claude/skills/       # Claude Code skill files
│   ├── editor-frontend/  # UI, components, styling
│   └── editor-backend/   # Gretly, FlowOps, agents
├── app/
│   ├── components/       # React components
│   │   ├── @settings/    # Settings panels
│   │   ├── chat/         # Chat interface
│   │   ├── editor/       # Code editor
│   │   ├── workbench/    # IDE workspace
│   │   └── ui/           # Reusable primitives
│   ├── lib/
│   │   ├── flowops/      # Generic agent framework
│   │   ├── flowstarter/  # App-specific agents
│   │   ├── gretly/       # Orchestration engine
│   │   ├── stores/       # Nanostores state
│   │   ├── services/     # Backend services
│   │   └── hooks/        # Custom React hooks
│   ├── routes/           # Remix routes & API
│   └── types/            # TypeScript types
├── convex/               # Convex backend
├── __tests__/            # Test files
└── e2e/                  # Playwright tests
```

---

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `FileTree.tsx`, `ChatMessage.tsx` |
| Props | PascalCase + Props | `FileTreeProps`, `ChatMessageProps` |
| Hooks | use + camelCase | `useFileTree.ts`, `useChatState.ts` |
| Stores | camelCase | `files.ts`, `settings.ts` |
| API Routes | api.feature-name | `api.gretly-generate.ts` |
| Utilities | camelCase | `fileUtils.ts`, `logger.ts` |
| Types | PascalCase | `FileEntry`, `GretlyResult` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRIES`, `DEFAULT_MODEL` |
| Private fields | # prefix | `#modifiedFiles`, `#state` |

---

## Code Generation Guidelines

### When Generating New Features

1. **Read the skill files first** - Follow patterns in `.claude/skills/` directory
2. **Check existing patterns** - Look for similar implementations
3. **Use established imports** - Reference existing utilities and hooks
4. **Follow file structure** - Place code in appropriate directories
5. **Add proper types** - Never use `any` without justification
6. **Include error handling** - All async operations should handle failures
7. **Add logging** - Use `createScopedLogger` for debugging
8. **Use memo()** - Wrap components that receive stable props

### When Modifying Existing Code

1. **Read the full file first** - Understand context before changes
2. **Preserve existing patterns** - Don't refactor unrelated code
3. **Keep changes minimal** - Only modify what's necessary
4. **Maintain backwards compatibility** - Don't break existing APIs
5. **Update tests** - If behavior changes, update tests
6. **Check file size** - If over 250 lines, consider splitting

---

## API Route Pattern

```typescript
// app/routes/api.feature-name.ts
import { json, type ActionFunctionArgs } from '@remix-run/node';
import { z } from 'zod';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('api.feature-name');

const RequestSchema = z.object({
  projectId: z.string().min(1),
  action: z.enum(['create', 'update', 'delete']),
});

export async function action({ request }: ActionFunctionArgs) {
  try {
    const body = await request.json();
    const validated = RequestSchema.parse(body);

    const result = await processAction(validated);
    return json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    logger.error('Failed:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

## Convex Integration

```typescript
import { useQuery, useMutation } from 'convex/react';
import { api } from '~/convex/_generated/api';

// Query data (reactive)
const files = useQuery(api.files.getProjectFiles, { projectId });

// Mutate data
const createFile = useMutation(api.files.create);
await createFile({ path, content, projectId });
```

---

## Styling Guidelines

See `.claude/skills/editor-frontend/SKILL.md` for the complete glassmorphism design system.

### CSS Variables

```tsx
<div className="bg-flowstarter-elements-background-depth-1">
  <span className="text-flowstarter-elements-textPrimary">
    Primary text
  </span>
</div>
```

### Glassmorphism Pattern

```tsx
<div className="
  backdrop-blur-xl
  bg-white/70 dark:bg-gray-900/70
  border border-white/20
  rounded-xl
  shadow-lg shadow-black/5
">
```

---

## Checklist for Code Changes

Before submitting code changes, verify:

- [ ] Read relevant skill file in `.claude/skills/`
- [ ] TypeScript compiles without errors (`pnpm build`)
- [ ] No ESLint warnings/errors (`pnpm lint`)
- [ ] Unit tests pass (`pnpm test`)
- [ ] New features have corresponding tests
- [ ] No `console.log` statements (use `logger` instead)
- [ ] No hardcoded secrets or API keys
- [ ] No `any` types used
- [ ] Components use `memo()` appropriately
- [ ] Files are under 250 lines
- [ ] Functions are under 20 lines
- [ ] Error handling is comprehensive
