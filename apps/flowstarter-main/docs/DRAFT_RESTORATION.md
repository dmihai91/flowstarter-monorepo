# Draft Restoration on Wizard Refresh

## Problem
Previously, when refreshing the wizard page at `/dashboard/new`, the wizard would reset to its initial state, losing all user progress. This happened because:

1. **Client-side state** in Zustand stores was cleared on page refresh
2. **Draft autosave** was working correctly and saving to the database
3. **Draft loading** only worked when accessing a specific draft URL (`/wizard/project/{id}`)
4. The wizard at `/dashboard/new` had no way to know about the auto-saved draft

## Solution
Implemented automatic draft restoration on page refresh using a three-tier approach:

### 1. API Enhancement
Modified `/api/projects/draft` GET endpoint to fetch the **most recent draft** when no `projectId` is provided:

```typescript
// Before: Returned null when no projectId
if (!projectId) {
  return NextResponse.json({ draft: null });
}

// After: Fetches latest draft by updated_at timestamp
const { data: latestDraft } = await supabase
  .from('projects')
  .select('...')
  .eq('user_id', userId)
  .eq('is_draft', true)
  .order('updated_at', { ascending: false })
  .limit(1)
  .maybeSingle();
```

### 2. Client-Side Draft Tracking
Added localStorage-based draft tracking in `ProjectWizard.tsx`:

- **On wizard load**: Check localStorage for `flowstarter_current_draft`
- **On draft save**: Store the draft ID in localStorage
- **On draft completion**: Clear localStorage when project is created
- **On draft deletion**: Clear localStorage when user discards

### 3. Smart Draft Loading Strategy
Implemented a prioritized approach for determining which draft to load:

```typescript
Priority 1: draftId from URL prop (/wizard/project/{id})
Priority 2: fresh=true query param (explicit fresh start)
Priority 3: Draft ID from localStorage (current session)
Priority 4: 'latest' - fetch most recent draft from server
```

## Files Changed

### `/src/app/api/projects/draft/route.ts`
- Enhanced GET endpoint to return latest draft when no projectId provided
- Orders by `updated_at DESC` to get most recent

### `/src/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/dashboard/new/ProjectWizard.tsx`
- Added `useState` to manage effective draft ID
- Implemented localStorage read/write for draft tracking
- Added `fresh=true` query param support for explicit fresh starts
- Clear localStorage on project creation and draft deletion
- Updated documentation comments

### `/src/hooks/wizard/useWizardDraft.ts`
- Added `loadedDraftId` to return value
- Exposes the current draft ID to parent components

## Usage

### Continue After Refresh
1. User starts creating a project at `/dashboard/new`
2. Draft is auto-saved every 600ms (existing behavior)
3. User refreshes the page
4. **NEW**: Wizard automatically restores their progress from the most recent draft

### Explicit Fresh Start
To explicitly start a new project without loading any draft:
```
/dashboard/new?fresh=true
```

This is useful when user wants to abandon their current draft and start over without deleting it.

### Continue Specific Draft
To continue a specific draft (existing behavior):
```
/wizard/project/{draftId}
```

## Benefits

1. **Better UX**: Users no longer lose progress on accidental refresh
2. **Seamless**: Works automatically without user intervention
3. **Smart**: Uses localStorage for performance, falls back to API
4. **Clean**: Properly cleans up localStorage on completion/deletion
5. **Flexible**: Supports explicit fresh starts when needed

## Technical Details

### localStorage Key
- **Key**: `flowstarter_current_draft`
- **Value**: UUID of the current draft
- **Lifecycle**: Set on save, cleared on completion/deletion

### State Management Flow
```
Page Load
  ↓
Check URL for draftId prop → Use if present
  ↓
Check query param for fresh=true → Start fresh if present
  ↓
Check localStorage → Use stored draft ID if present
  ↓
Default to 'latest' → Fetch most recent from server
  ↓
useWizardDraft loads the draft
  ↓
Wizard state is hydrated
```

### Auto-save Flow
```
User makes changes
  ↓
600ms debounce
  ↓
POST /api/projects/draft
  ↓
Returns draft ID
  ↓
Update localStorage with draft ID
  ↓
Update React Query cache
```

## Testing Checklist

- [ ] Refresh wizard mid-flow - progress is restored
- [ ] Complete project - localStorage is cleared
- [ ] Discard draft - localStorage is cleared
- [ ] Navigate away and back - draft is loaded
- [ ] Use `?fresh=true` - new wizard without loading draft
- [ ] Multiple tabs - each maintains its own draft tracking
- [ ] Network offline - draft persists in browser
- [ ] Clear localStorage - falls back to fetching latest draft

## Future Improvements

1. **Multiple draft support**: Allow users to maintain multiple drafts
2. **Draft management UI**: Show list of all drafts, not just latest
3. **Conflict resolution**: Handle multiple tabs editing same draft
4. **Draft expiration**: Auto-delete drafts after X days of inactivity
