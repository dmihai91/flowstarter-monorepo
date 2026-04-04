# Multi-Thread Support Plan

> Allow multiple conversation threads per project in the Flowstarter editor.

**Branch:** `feature/multi-thread`
**Status:** Planning
**Last updated:** 2026-04-04

---

## 1. Schema Changes (`convex/schema.ts`)

### 1a. `conversations` table — new fields

```ts
// Add to conversations table definition:
threadName: v.optional(v.string()),       // User-visible name: "Thread 1", "Brand refresh chat", etc.
threadOrder: v.optional(v.number()),      // Sort position within the project (0-based)
isDefaultThread: v.optional(v.boolean()), // true for the original/first thread per project
```

- `threadName` — defaults to `"Thread 1"` for existing rows; new threads auto-increment (`"Thread 2"`, `"Thread 3"`, …) unless user supplies a name.
- `threadOrder` — integer for sidebar ordering. Default `0` for the first thread.
- `isDefaultThread` — marks the canonical thread created during onboarding. When the editor opens a project without a specific thread ID, it resolves to this thread.

### 1b. New index on `conversations`

```ts
.index('by_project_order', ['projectId', 'threadOrder'])
```

This index powers the thread list query (sorted by creation order within a project). The existing `by_project` index (`['projectId']`) already exists and can serve simple lookups, but `by_project_order` gives us deterministic sidebar ordering.

### 1c. `projects` table — no changes required

All project-level fields (`businessDetails`, `selectedPalette`, `selectedFont`, `templateId`, `brandProfile`, `integrations`, `contactDetails`, etc.) already live on the `projects` table and are shared across all threads. No schema change needed.

### 1d. `files` table — no changes required

Files are keyed by `projectId`, not `conversationId`. All threads within a project share the same file tree. This is intentional — threads represent different conversations about the same site, not different sites.

### 1e. `editorSessions` table — already has `conversationId`

`editorSessions` already stores `conversationId: v.optional(v.id('conversations'))`. No change needed; each session naturally tracks which thread is active.

---

## 2. Convex Query/Mutation Changes (`convex/conversations.ts`)

### 2a. New query: `listByProject`

Lists all threads for a project, ordered by `threadOrder`.

```ts
export const listByProject = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const threads = await ctx.db
      .query('conversations')
      .withIndex('by_project_order', (q) => q.eq('projectId', args.projectId))
      .collect();

    return threads.map((t) => ({
      _id: t._id,
      threadName: t.threadName ?? 'Thread 1',
      threadOrder: t.threadOrder ?? 0,
      isDefaultThread: t.isDefaultThread ?? false,
      buildPhase: t.buildPhase,
      updatedAt: t.updatedAt,
      messageCount: Array.isArray(t.messages) ? t.messages.length : 0,
      lastMessagePreview: getLastMessagePreview(t.messages),
    }));
  },
});

// Helper — extract last assistant message content (truncated)
function getLastMessagePreview(messages: unknown): string | null {
  const arr = normalizeMessagesField(messages);
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i].role === 'assistant') {
      return arr[i].content.slice(0, 120);
    }
  }
  return null;
}
```

### 2b. New query: `getDefaultThread`

Resolves the default thread for a project (used when navigating by projectId without a threadId).

```ts
export const getDefaultThread = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    // Try isDefaultThread first
    const defaultThread = await ctx.db
      .query('conversations')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .filter((q) => q.eq(q.field('isDefaultThread'), true))
      .first();

    if (defaultThread) return defaultThread;

    // Fallback: oldest thread for this project
    const oldest = await ctx.db
      .query('conversations')
      .withIndex('by_project_order', (q) => q.eq('projectId', args.projectId))
      .first();

    return oldest ?? null;
  },
});
```

### 2c. New mutation: `createThread`

Creates a new thread for an existing project. Inherits project-level context but starts with empty messages.

```ts
export const createThread = mutation({
  args: {
    projectId: v.id('projects'),
    sessionId: v.string(),
    threadName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Count existing threads to auto-generate name and order
    const existing = await ctx.db
      .query('conversations')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .collect();

    const threadOrder = existing.length; // 0-based, so next = count
    const threadName = args.threadName || `Thread ${threadOrder + 1}`;

    // Get the project for context fields
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error('Project not found');

    const conversationId = await ctx.db.insert('conversations', {
      sessionId: args.sessionId,
      title: threadName,
      isActive: true,
      projectId: args.projectId,
      projectName: project.name,
      projectUrlId: project.urlId,
      threadName,
      threadOrder,
      isDefaultThread: false,
      step: 'build', // New threads skip onboarding — project already set up
      messages: [],
      createdAt: now,
      updatedAt: now,
    });

    return { conversationId, threadName, threadOrder };
  },
});
```

### 2d. New mutation: `renameThread`

```ts
export const renameThread = mutation({
  args: {
    id: v.id('conversations'),
    threadName: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      threadName: args.threadName,
      title: args.threadName, // Keep title in sync
      updatedAt: Date.now(),
    });
    return args.id;
  },
});
```

### 2e. New mutation: `deleteThread`

Deletes a thread (conversation + its messages). Cannot delete the default thread unless it's the only one.

```ts
export const deleteThread = mutation({
  args: { id: v.id('conversations') },
  handler: async (ctx, args) => {
    const convo = await ctx.db.get(args.id);
    if (!convo) throw new Error('Thread not found');

    if (convo.isDefaultThread && convo.projectId) {
      const siblings = await ctx.db
        .query('conversations')
        .withIndex('by_project', (q) => q.eq('projectId', convo.projectId))
        .collect();
      if (siblings.length > 1) {
        throw new Error('Cannot delete the default thread while other threads exist. Delete other threads first or set a different default.');
      }
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});
```

### 2f. Changes to existing mutations

**`conversations.remove`** — Currently deletes the project + all files when a conversation is deleted. With multi-thread, this is dangerous. Change behavior:

- If the thread being deleted is the **last thread** for the project → delete project + files (current behavior).
- If other threads remain → only delete the conversation document, leave the project intact.

**`conversations.create` / `conversations.createWithProject`** — Add `threadName`, `threadOrder`, `isDefaultThread` fields with defaults:

```ts
// In create handler, add:
threadName: 'Thread 1',
threadOrder: 0,
isDefaultThread: true,
```

---

## 3. Editor URL Structure

### Current state

```
/project/{conversationId}
```

The route param is called `projectId` but is actually a Convex `Id<'conversations'>`. See `project.$projectId.tsx:56`:

```tsx
<ProjectEditorContent key={projectId} projectId={projectId as Id<'conversations'>} />
```

### Option A: Keep `/project/{conversationId}` (recommended)

Each thread has a unique URL. Thread switching = client-side navigation to a different conversationId.

| Pros | Cons |
|------|------|
| Zero routing changes | URL doesn't reveal project identity |
| Bookmarkable per-thread | Someone reading the URL can't tell which project it belongs to |
| Existing handoff tokens work as-is | |
| Simple browser history (back = previous thread) | |

### Option B: `/project/{projectId}/thread/{conversationId}`

Nested route that makes the project explicit.

| Pros | Cons |
|------|------|
| URL is semantically clear | Requires new Remix route file + nested layout |
| Deep-linkable to project overview | Handoff token format needs updating |
| Could support `/project/{projectId}` → redirect to default thread | More complex route resolution |

### Recommendation: **Option A** for v1

Keep `/project/{conversationId}` unchanged. Add a new route `/project/by-project/{projectId}` that resolves the default thread and redirects:

```
/project/by-project/{projectId}  →  302 → /project/{defaultConversationId}
```

This is implemented as a new route file `project.by-project.$projectId.tsx`:

```tsx
// app/routes/project.by-project.$projectId.tsx
export default function ProjectRedirect() {
  const { projectId } = useParams();
  const defaultThread = useQuery(api.conversations.getDefaultThread,
    projectId ? { projectId: projectId as Id<'projects'> } : 'skip'
  );

  useEffect(() => {
    if (defaultThread) {
      navigate(`/project/${defaultThread._id}`, { replace: true });
    }
  }, [defaultThread]);

  return <LoadingScreen message="Loading project..." />;
}
```

Migrate to Option B in a later phase if needed.

---

## 4. Editor UI Changes

### 4a. Thread Switcher Location

Add a **thread panel** to the existing sidebar (`EditorLayout`). It sits above or below the file tree, toggled by a tab or icon button.

**Component tree:**

```
EditorLayout
├── Sidebar
│   ├── ThreadPanel          ← NEW
│   │   ├── ThreadList
│   │   │   └── ThreadListItem (× N)
│   │   └── NewThreadButton
│   └── FileTree (existing)
└── EditorChatPanel (existing)
```

### 4b. `ThreadPanel` component

**File:** `app/components/editor/ThreadPanel.tsx`

```tsx
interface ThreadPanelProps {
  projectId: Id<'projects'>;
  activeThreadId: Id<'conversations'>;
}
```

Uses `useQuery(api.conversations.listByProject, { projectId })` for the thread list.

### 4c. `ThreadListItem` component

Shows for each thread:
- Thread name (editable on double-click)
- Last message preview (truncated, gray text)
- Relative timestamp ("2h ago", "Yesterday")
- Active indicator (left border or background highlight)
- Context menu: Rename, Delete (disabled for default if multiple threads exist)

### 4d. `NewThreadButton` component

- "+" icon button at the bottom of the thread list
- On click: calls `conversations.createThread` mutation
- After creation: navigates to `/project/{newConversationId}`
- Optional: prompt for thread name (or auto-generate and let user rename later)

### 4e. Thread Naming Strategy

- Auto-generated: `"Thread 1"`, `"Thread 2"`, etc.
- User can rename via double-click on thread name or context menu → Rename
- Default thread is labeled `"Thread 1"` with a pin/star icon

### 4f. Active Thread Indicator

- The thread corresponding to the current URL (`conversationId` from route params) gets a highlighted background + left accent border in the sidebar list.

---

## 5. Handoff Changes (main app → editor)

### 5a. Current handoff flow

1. Dashboard (`flowstarter-main`) calls `POST /api/editor/handoff` with project config
2. Handoff route creates/finds the Convex project, creates a conversation, returns a signed token
3. Dashboard redirects to `${EDITOR_URL}/project/${conversationId}?handoff=${token}`

### 5b. Multi-thread handoff

**No change to the handoff API contract.** The handoff route already creates a single conversation for the project. That conversation becomes the default thread (`isDefaultThread: true`, `threadOrder: 0`).

The only change: when syncing to Convex during handoff, include the new fields:

```ts
// In the handoff Convex sync (createWithProject call):
threadName: 'Thread 1',
threadOrder: 0,
isDefaultThread: true,
```

### 5c. Creating threads from within the editor

Threads are created **entirely in-editor** via the `NewThreadButton`. No round-trip to the dashboard needed. The `createThread` mutation handles everything.

### 5d. Creating threads from the dashboard (future)

If the dashboard later wants to create a new thread (e.g., "Start a new conversation about this project"), it can:
1. Call a new API endpoint `POST /api/editor/handoff` with `{ projectId, newThread: true }`
2. The handoff route creates a new conversation via `createThread` mutation
3. Returns a token + redirect URL to the new thread's conversationId

This is **out of scope for v1** — dashboard only creates the initial thread.

---

## 6. Data Isolation Per Thread

### 6a. Shared across all threads (project-level)

These fields live on the `projects` table and are accessed by projectId:

| Field | Table | Notes |
|-------|-------|-------|
| `name` | projects | Project/business name |
| `description` | projects | Project description |
| `businessDetails` | projects | Business name, audience, features, goals |
| `templateId` / `templateName` | projects | Selected template |
| `selectedPalette` | projects | Color palette |
| `selectedFont` | projects | Typography |
| `brandProfile` | projects | Brand tone, value prop, differentiators |
| `integrations` | projects | Booking, newsletter |
| `contactDetails` | projects | Email, phone, socials |
| `daytonaWorkspaceId` | projects | Shared dev environment |
| `workspaceUrl` / `workspaceStatus` | projects | Shared workspace state |
| All files | files | Keyed by projectId |
| All snapshots | snapshots | Keyed by projectId |
| All assets | assets | Keyed by projectId |

### 6b. Per-thread (conversation-level)

These fields live on the `conversations` table and are unique per thread:

| Field | Notes |
|-------|-------|
| `messages` | Chat history for this thread |
| `buildPhase` | Current build phase (`describe`, `template`, `build`, `complete`) |
| `step` | Onboarding step |
| `pipelineState` | Orchestration pipeline progress |
| `businessInfo` (on conversation) | Draft state during onboarding — only relevant for Thread 1 |
| `selectedPalette` (on conversation) | Draft state during onboarding — once project is created, project-level palette wins |
| `selectedFont` (on conversation) | Same — draft state |
| `selectedLogo` (on conversation) | Same — draft state |
| `integrations` (on conversation) | Same — draft state |
| `contactDetails` (on conversation) | Same — draft state |
| `threadName` | Display name |
| `threadOrder` | Sort position |
| `isDefaultThread` | Whether this is the primary thread |
| `isActive` | Session-level active state |

### 6c. Important: Draft vs. canonical data

The conversation stores draft copies of palette, font, businessInfo, etc. during onboarding. Once the project is created and these values are persisted to the `projects` table, the project-level values are canonical. New threads (created after onboarding) should read palette/font/etc. from the project, not from any conversation.

The editor components that read these values should prefer `project.selectedPalette` over `conversation.selectedPalette` when the project exists. This is likely already the case but should be verified during implementation.

---

## 7. Migration Plan

### 7a. Schema migration

Convex schema changes are **additive** — new optional fields don't break existing data. Deployment is safe with zero downtime.

1. Add `threadName`, `threadOrder`, `isDefaultThread` as `v.optional(...)` fields to the `conversations` table
2. Add `by_project_order` index
3. Deploy schema — Convex handles index backfill automatically

### 7b. Data backfill

Write a one-off mutation to set defaults on existing conversations:

```ts
export const backfillThreadFields = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query('conversations').collect();
    let updated = 0;

    for (const convo of all) {
      if (convo.threadName === undefined) {
        await ctx.db.patch(convo._id, {
          threadName: 'Thread 1',
          threadOrder: 0,
          isDefaultThread: true,
          updatedAt: Date.now(),
        });
        updated++;
      }
    }

    return { updated };
  },
});
```

Run once after deploy. Remove the mutation afterward.

### 7c. Backwards compatibility

- All new fields are `v.optional(...)` — old clients that don't send them still work
- `listByProject` and `getDefaultThread` handle missing fields with `?? defaults`
- Existing `/project/{conversationId}` URLs continue to work unchanged
- Handoff tokens don't need format changes

---

## 8. Effort Estimates

| Section | Task | Hours |
|---------|------|-------|
| **Schema** | Add fields + index to `conversations` table | 0.5 |
| **Convex queries** | `listByProject`, `getDefaultThread` | 1.5 |
| **Convex mutations** | `createThread`, `renameThread`, `deleteThread` | 2 |
| **Convex mutations** | Update `create`, `createWithProject`, `remove` for multi-thread safety | 2 |
| **Migration** | Backfill mutation + run | 0.5 |
| **Route** | `project.by-project.$projectId.tsx` redirect route | 1 |
| **UI: ThreadPanel** | Thread list, item, active indicator | 3 |
| **UI: NewThreadButton** | Create flow + navigation | 1 |
| **UI: Thread rename** | Double-click edit, context menu | 1.5 |
| **UI: Thread delete** | Confirmation dialog, guard default thread | 1 |
| **Handoff** | Add `threadName`/`threadOrder`/`isDefaultThread` to handoff sync | 0.5 |
| **Testing** | E2E: create thread, switch, delete, rename; migration; handoff | 3 |
| **Polish** | Empty states, loading skeletons, keyboard nav | 1.5 |
| | **Total** | **~19 hours** |

---

## 9. Implementation Order

1. **Schema + migration** — Deploy first, no user-facing changes
2. **Convex queries/mutations** — Backend complete, testable via Convex dashboard
3. **Redirect route** — `/project/by-project/{projectId}` working
4. **ThreadPanel UI** — Sidebar with thread list (read-only initially)
5. **NewThreadButton** — Create + navigate
6. **Thread rename/delete** — CRUD complete
7. **Handoff updates** — Wire new fields into handoff sync
8. **Testing + polish**

---

## 10. Open Questions

1. **Thread limit per project?** — Should we cap at N threads (e.g., 10) to prevent abuse? Easy to add a guard in `createThread`.
2. **Thread archiving vs. deletion?** — Should deleted threads be soft-deleted (add `archivedAt` field) or hard-deleted? Hard delete is simpler for v1.
3. **Cross-thread file conflicts** — Two threads can trigger builds that write to the same files. The last build wins. Should we warn the user? Out of scope for v1, but worth noting.
4. **Thread-specific snapshots** — Currently snapshots are per-project. If a user wants to snapshot a specific thread's build state, should snapshots link to conversationId too? Defer to v2.
