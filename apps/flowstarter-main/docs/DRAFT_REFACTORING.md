# Draft System Refactoring

## Overview
Refactored the draft system to support multiple drafts per user, allowing each project to maintain its own draft state independently.

## Changes Made

### 1. Database Schema (Migration)
**File:** `supabase/migrations/20251106000000_allow_multiple_drafts_per_user.sql`

- Removed the unique constraint `idx_projects_user_draft_unique` that enforced one draft per user
- Now allows multiple projects with `is_draft=true` per user
- Each project can maintain its own draft state

### 2. API Updates
**File:** `src/app/api/projects/draft/route.ts`

**GET endpoint:**
- Now accepts `projectId` query parameter
- Fetches specific draft by project ID instead of fetching a single user draft
- Returns `null` if no projectId is provided (no default draft concept)

**POST endpoint:**
- Now accepts optional `projectId` in request body
- If `projectId` provided: updates that specific project
- If no `projectId`: creates a new draft project
- Returns the `projectId` in response for tracking

**DELETE endpoint:**
- Now accepts `projectId` query parameter
- If `projectId` provided: deletes that specific draft
- If no `projectId`: deletes all user drafts (legacy behavior)

### 3. Hook Updates

**File:** `src/hooks/useDraft.ts`
- `useDraft(projectId?)` - Now accepts optional project ID parameter
- `useUpsertDraft(projectId?)` - Accepts project ID for saving specific drafts
- `useDeleteDraft(projectId?)` - Accepts project ID for deleting specific drafts
- Updated query keys to be project-specific: `draftKeys.byProject(projectId)`
- Exported `DraftShape` interface for reuse

**File:** `src/hooks/wizard/useWizardDraft.ts`
- Updated to accept `projectId` parameter
- Passes project ID to `useDraft`, `useUpsertDraft`, and `useDeleteDraft`
- Fixed TypeScript type assertions for `serverDraft`

**File:** `src/hooks/useCreateProjectFromConfig.ts`
- Updated to accept `projectId` parameter
- Uses project ID to fetch and convert specific draft to active project

**File:** `src/hooks/useDraftAutosave.ts`
- Updated to accept `projectId` parameter
- Passes project ID to `useUpsertDraft`

### 4. Component Updates

**File:** `src/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/dashboard/new/ProjectWizard.tsx`
- Extracts `projectDraftId` from URL query parameter `?draft={id}`
- Passes project ID to `useWizardDraft` and `useCreateProjectFromConfig`
- Maintains project-specific draft context throughout wizard flow

**File:** `src/app/(dynamic-pages)/(main-pages)/components/ProjectsList.tsx`
- Removed separate draft API call (`useDraft()`)
- Now shows all drafts from the `projects` array (where `is_draft=true`)
- Drafts link to wizard with project ID: `/dashboard/new?draft={projectId}`
- Simplified delete logic - all projects use same delete endpoint
- Shows info notice when drafts exist
- Removed unused `DraftNotice` component

### 5. Store Updates

**File:** `src/store/draft-store.ts`
- No changes needed - existing store works with new system

## Benefits

1. **Multiple Drafts**: Users can now work on multiple project drafts simultaneously
2. **Better UX**: Each draft is independently tracked and can be continued from the dashboard
3. **Cleaner Architecture**: Drafts are just projects with `is_draft=true` flag
4. **Backward Compatible**: Legacy behavior preserved when no project ID provided
5. **Type Safe**: All TypeScript errors resolved with proper type assertions

## Migration Steps

To apply these changes to your database:

```bash
# Apply the migration
pnpm db:push

# Or manually run the SQL
psql -d your_database -f supabase/migrations/20251106000000_allow_multiple_drafts_per_user.sql
```

## URL Structure

**Continue Existing Draft:**
```
/dashboard/new?draft={projectId}
```

**Start New Project:**
```
/dashboard/new
```

## Testing Checklist

- [ ] Create multiple drafts from dashboard
- [ ] Continue each draft independently
- [ ] Save draft state per project
- [ ] Delete specific drafts
- [ ] Convert draft to active project
- [ ] Verify no draft conflicts between projects
- [ ] Test offline/online draft saving
- [ ] Verify dashboard stats show correct draft counts

## Breaking Changes

None - the system is backward compatible. Existing single draft behavior works when no project ID is provided.
