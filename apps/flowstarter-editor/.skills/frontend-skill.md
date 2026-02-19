# Frontend Skill

Guidelines for building frontend components and features in Flowstarter Editor.

## Tech Stack

- **Framework:** React 19 + Remix + Vite
- **Language:** TypeScript (strict mode)
- **Styling:** UnoCSS + Tailwind + CSS Variables
- **State:** Nanostores (NOT Redux/Zustand)
- **UI Primitives:** Radix UI (for accessibility)
- **Editor:** CodeMirror
- **Terminal:** xterm.js

## Component Architecture

### File Structure

```
app/components/
├── @settings/           # Settings panels
│   ├── core/           # Types, constants, registry
│   ├── shared/         # Shared components
│   └── tabs/           # Tab content components
├── chat/               # Chat interface
├── editor/             # Code editor
├── header/             # App header
├── sidebar/            # Navigation sidebar
├── workbench/          # IDE workspace
│   ├── FileTree/       # File browser
│   ├── Preview/        # Live preview
│   └── Terminal/       # Terminal emulator
└── ui/                 # Reusable primitives
```

### Component Template

```tsx
import { memo, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { classNames } from '~/utils/classNames';
import { createScopedLogger } from '~/utils/logger';
import type { ComponentProps } from './types';

const logger = createScopedLogger('ComponentName');

interface ComponentNameProps {
  id: string;
  label: string;
  disabled?: boolean;
  onAction?: (id: string) => void;
}

export const ComponentName = memo(function ComponentName({
  id,
  label,
  disabled = false,
  onAction,
}: ComponentNameProps) {
  const handleAction = useCallback(() => {
    if (disabled) return;
    logger.debug('Action triggered', { id });
    onAction?.(id);
  }, [id, disabled, onAction]);

  return (
    <div
      className={classNames(
        'flex items-center gap-2 p-2 rounded-md',
        'bg-flowstarter-elements-background-depth-1',
        'border border-flowstarter-elements-borderColor',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span className="text-flowstarter-elements-textPrimary">{label}</span>
      <button
        onClick={handleAction}
        disabled={disabled}
        className={classNames(
          'px-3 py-1 rounded text-sm',
          'bg-flowstarter-elements-button-primary-background',
          'text-flowstarter-elements-button-primary-text',
          'hover:bg-flowstarter-elements-button-primary-backgroundHover',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        Action
      </button>
    </div>
  );
});
```

## State Management with Nanostores

### Creating Stores

```typescript
// app/lib/stores/feature.ts
import { atom, map, computed } from 'nanostores';

// Atom for single values
export const isLoading = atom<boolean>(false);

// Map for object state
export const files = map<Record<string, FileEntry>>({});

// Computed for derived values
export const fileCount = computed(files, (fileMap) => {
  return Object.keys(fileMap).length;
});

// Actions as plain functions
export function addFile(path: string, content: string) {
  files.setKey(path, { path, content, modified: Date.now() });
}

export function removeFile(path: string) {
  const current = files.get();
  const { [path]: _, ...rest } = current;
  files.set(rest);
}
```

### Using Stores in Components

```tsx
import { useStore } from '@nanostores/react';
import { files, isLoading, addFile } from '~/lib/stores/feature';

function FileList() {
  const fileMap = useStore(files);
  const loading = useStore(isLoading);

  if (loading) return <Loading />;

  return (
    <ul>
      {Object.values(fileMap).map((file) => (
        <li key={file.path}>{file.path}</li>
      ))}
    </ul>
  );
}
```

### HMR Preservation

```typescript
// Preserve store state during hot reload
export const myStore: WritableAtom<State> =
  import.meta.hot?.data.myStore ?? atom<State>(defaultState);

if (import.meta.hot) {
  import.meta.hot.data.myStore = myStore;
}
```

## Styling

### CSS Variables (Theme)

All colors use CSS variables for theme support:

```css
/* Primary backgrounds */
--flowstarter-elements-background-depth-1: #1a1a1a;
--flowstarter-elements-background-depth-2: #242424;
--flowstarter-elements-background-depth-3: #2a2a2a;

/* Text colors */
--flowstarter-elements-textPrimary: #ffffff;
--flowstarter-elements-textSecondary: #a0a0a0;
--flowstarter-elements-textTertiary: #707070;

/* Borders */
--flowstarter-elements-borderColor: #333333;

/* Buttons */
--flowstarter-elements-button-primary-background: #3b82f6;
--flowstarter-elements-button-primary-text: #ffffff;
--flowstarter-elements-button-primary-backgroundHover: #2563eb;
```

### Using classNames Utility

```tsx
import { classNames } from '~/utils/classNames';

<div
  className={classNames(
    // Base styles
    'flex items-center gap-2 p-4',
    // Conditional styles
    isActive && 'bg-flowstarter-elements-item-backgroundActive',
    isDisabled && 'opacity-50 cursor-not-allowed',
    // Dynamic styles
    size === 'small' ? 'text-sm' : 'text-base'
  )}
/>
```

### 8-Point Spacing System

Use consistent spacing based on 8px increments:

```tsx
// Tailwind classes
<div className="p-2">   {/* 8px */}
<div className="p-4">   {/* 16px */}
<div className="p-6">   {/* 24px */}
<div className="gap-2"> {/* 8px */}
<div className="gap-4"> {/* 16px */}
```

## React Patterns

### Memoization

```tsx
// Memoize components that receive stable props
export const ExpensiveList = memo(function ExpensiveList({ items }: Props) {
  return items.map((item) => <ExpensiveItem key={item.id} {...item} />);
});

// Memoize callbacks
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// Memoize expensive computations
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.name.localeCompare(b.name));
}, [items]);
```

### Error Boundaries

```tsx
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="p-4 bg-red-500/10 border border-red-500 rounded-md">
      <h2 className="text-red-500 font-semibold">Something went wrong</h2>
      <pre className="text-sm text-red-400 mt-2">{error.message}</pre>
      <button onClick={resetErrorBoundary} className="mt-4 btn-primary">
        Try again
      </button>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <MainContent />
    </ErrorBoundary>
  );
}
```

### Lazy Loading

```tsx
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

function Parent() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### Custom Hooks

```tsx
// app/lib/hooks/useProjectFiles.ts
import { useState, useCallback, useEffect } from 'react';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('useProjectFiles');

interface UseProjectFilesResult {
  files: FileEntry[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useProjectFiles(projectId: string | null): UseProjectFilesResult {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchProjectFiles(projectId);
      setFiles(data);
    } catch (err) {
      logger.error('Failed to fetch files', { projectId, error: err });
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { files, loading, error, refresh };
}
```

## Accessibility

### Radix UI Primitives

Use Radix UI for accessible components:

```tsx
import * as Dialog from '@radix-ui/react-dialog';

function Modal({ open, onOpenChange, title, children }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-flowstarter-elements-background-depth-1 rounded-lg p-6">
          <Dialog.Title className="text-lg font-semibold">
            {title}
          </Dialog.Title>
          {children}
          <Dialog.Close asChild>
            <button className="absolute top-4 right-4">
              <IconX />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

### Keyboard Navigation

```tsx
function ListItem({ onSelect, onDelete }) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelect();
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        onDelete();
        break;
    }
  };

  return (
    <div
      role="option"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {/* content */}
    </div>
  );
}
```

### Focus Management

```tsx
import { useRef, useEffect } from 'react';

function Dialog({ open }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus();
    }
  }, [open]);

  return (
    <div role="dialog" aria-modal="true">
      <button ref={closeButtonRef}>Close</button>
    </div>
  );
}
```

## Performance

### Virtualization for Long Lists

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
  });

  return (
    <div ref={parentRef} className="h-[400px] overflow-auto">
      <div
        style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {items[virtualItem.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Debouncing User Input

```tsx
import { useDebouncedCallback } from 'use-debounce';

function SearchInput({ onSearch }) {
  const debouncedSearch = useDebouncedCallback((value: string) => {
    onSearch(value);
  }, 300);

  return (
    <input
      type="text"
      onChange={(e) => debouncedSearch(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

## Testing

### Component Testing with Vitest

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with label', () => {
    render(<Button label="Click me" />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button label="Click" onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button label="Click" disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

## Component Checklist

Before submitting a component:

- [ ] Uses memo() if props are stable
- [ ] Uses useCallback for event handlers
- [ ] Uses useStore from @nanostores/react (NOT useState for shared state)
- [ ] Follows naming conventions (PascalCase for components)
- [ ] Has explicit TypeScript interfaces for props
- [ ] Uses CSS variables for theme colors
- [ ] Includes proper ARIA attributes
- [ ] Handles keyboard navigation
- [ ] Has focus indicators
- [ ] Uses classNames utility for conditional classes
- [ ] Includes error boundary where appropriate
- [ ] Under 250 lines (or split into sub-components)
