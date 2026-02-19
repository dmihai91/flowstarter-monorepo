# Clean Code Skill

Guidelines for writing clean, maintainable code in the Flowstarter Editor codebase.

## Core Principles

### 1. Single Responsibility Principle (SRP)

Every file, function, and class should have one clear purpose.

```typescript
// BAD: Multiple responsibilities
function handleUserAction(userId: string, action: string) {
  const user = await fetchUser(userId);
  await logActivity(userId, action);
  await sendNotification(user.email, action);
  await updateUserStats(userId);
}

// GOOD: Single responsibility per function
async function recordUserAction(userId: string, action: string) {
  const user = await userService.getById(userId);
  await activityLogger.log(userId, action);
  await notificationService.send(user.email, action);
  await statsService.update(userId);
}
```

### 2. File Size Limits

**Maximum 250 lines per file.** When a file exceeds this limit:

1. Extract types to a separate `types.ts`
2. Extract pure utilities to a `utils.ts`
3. Extract hooks from components
4. Split by logical responsibility
5. Create an `index.ts` facade for exports

### 3. Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| React Components | PascalCase | `FileTree.tsx`, `ChatMessage.tsx` |
| Component Props | PascalCase + Props | `FileTreeProps`, `ChatMessageProps` |
| Hooks | use + camelCase | `useFileTree.ts`, `useChatState.ts` |
| Stores (nanostores) | camelCase | `files.ts`, `chat.ts` |
| API Routes | api.featureName | `api.gretly-generate.ts` |
| Utilities | camelCase | `fileUtils.ts`, `logger.ts` |
| Types | PascalCase | `FileEntry`, `GretlyResult` |
| Constants | SCREAMING_SNAKE_CASE | `DEFAULT_MODEL`, `MAX_RETRIES` |
| Private fields | # prefix | `#modifiedFiles`, `#state` |

### 4. TypeScript Best Practices

#### No `any` Types

```typescript
// BAD
function processData(data: any): any {
  return data.value;
}

// GOOD
interface DataInput {
  value: string;
  metadata?: Record<string, unknown>;
}

function processData(data: DataInput): string {
  return data.value;
}
```

#### Explicit Interfaces

Always define interfaces for data structures:

```typescript
// GOOD
interface UserState {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

interface UserActions {
  updateName: (name: string) => Promise<void>;
  updateEmail: (email: string) => Promise<void>;
}
```

#### Discriminated Unions for State

```typescript
// GOOD
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

function renderState<T>(state: RequestState<T>) {
  switch (state.status) {
    case 'idle':
      return <Idle />;
    case 'loading':
      return <Loading />;
    case 'success':
      return <Success data={state.data} />;
    case 'error':
      return <Error error={state.error} />;
  }
}
```

### 5. Function Design

#### Keep Functions Short

Aim for functions under 20 lines. If longer, extract sub-functions.

```typescript
// BAD: Long function doing too much
async function processOrder(order: Order) {
  // 50+ lines of validation, processing, notifications...
}

// GOOD: Composed from smaller functions
async function processOrder(order: Order) {
  const validatedOrder = validateOrder(order);
  const processedOrder = await executeOrder(validatedOrder);
  await notifyCustomer(processedOrder);
  await updateInventory(processedOrder);
  return processedOrder;
}
```

#### Pure Functions Where Possible

```typescript
// GOOD: Pure function - no side effects
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// Separate side effects
async function saveOrder(order: Order): Promise<void> {
  await database.orders.insert(order);
}
```

### 6. Error Handling

#### Use Result Types

```typescript
interface Result<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

async function fetchUser(id: string): Promise<Result<User>> {
  try {
    const user = await userRepository.findById(id);
    if (!user) {
      return { success: false, error: new Error('User not found') };
    }
    return { success: true, data: user };
  } catch (error) {
    logger.error('[fetchUser] Failed:', error);
    return { success: false, error: error instanceof Error ? error : new Error('Unknown error') };
  }
}
```

#### Scoped Logging

```typescript
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('UserService');

function processUser(userId: string) {
  logger.debug('Processing user', { userId });
  // ...
  logger.error('Failed to process user', { userId, error });
}
```

### 7. Comments

#### Code Should Be Self-Documenting

```typescript
// BAD: Obvious comment
// Increment counter by 1
counter++;

// BAD: Redundant comment
// Get user by ID
const user = getUserById(id);

// GOOD: Explains WHY, not WHAT
// Using exponential backoff to handle rate limiting from the API
const delay = Math.pow(2, attempt) * 1000;
```

#### JSDoc for Public APIs

```typescript
/**
 * Creates a new project workspace in Daytona.
 *
 * @param projectId - Unique identifier for the project
 * @param config - Workspace configuration options
 * @returns Promise resolving to the created workspace
 * @throws {WorkspaceError} If workspace creation fails
 *
 * @example
 * const workspace = await createWorkspace('proj_123', {
 *   template: 'react-vite',
 *   resources: { cpu: 2, memory: 4096 }
 * });
 */
async function createWorkspace(
  projectId: string,
  config: WorkspaceConfig
): Promise<Workspace> {
  // ...
}
```

### 8. Imports Organization

Order imports consistently:

```typescript
// 1. Node built-ins
import path from 'path';

// 2. External packages
import { atom, map } from 'nanostores';
import { useStore } from '@nanostores/react';

// 3. Internal absolute imports (by layer)
import { api } from '~/convex/_generated/api';
import { createScopedLogger } from '~/utils/logger';

// 4. Internal relative imports
import { FileTreeNode } from './FileTreeNode';
import type { FileTreeProps } from './types';
```

### 9. Avoid Magic Numbers/Strings

```typescript
// BAD
if (retries > 3) { ... }
if (status === 'ready') { ... }

// GOOD
const MAX_RETRIES = 3;
const WorkspaceStatus = {
  READY: 'ready',
  CREATING: 'creating',
  ERROR: 'error',
} as const;

if (retries > MAX_RETRIES) { ... }
if (status === WorkspaceStatus.READY) { ... }
```

### 10. Immutability

Prefer immutable operations:

```typescript
// BAD: Mutating array
function addItem(items: Item[], newItem: Item) {
  items.push(newItem);
  return items;
}

// GOOD: Immutable operation
function addItem(items: Item[], newItem: Item): Item[] {
  return [...items, newItem];
}

// GOOD: Using Map for immutable updates
files.setKey(filePath, { ...file, content: newContent });
```

## Code Review Checklist

Before submitting code, verify:

- [ ] No files exceed 250 lines
- [ ] No functions exceed 20 lines
- [ ] No `any` types used
- [ ] All data structures have explicit interfaces
- [ ] Error handling uses Result types
- [ ] Logging uses scoped loggers
- [ ] Naming follows conventions
- [ ] No magic numbers/strings
- [ ] Imports are organized
- [ ] Comments explain "why" not "what"
