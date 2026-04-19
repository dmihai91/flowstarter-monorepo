'use client';

import { type ReactNode } from 'react';
import { GlassCard } from '@flowstarter/flow-design-system';

/**
 * ListShell — shared container for all filterable list views on the team dashboard.
 *
 * Provides:
 *  - GlassCard outer wrapper (consistent depth/opacity with other cards)
 *  - Unified header: title + optional right slot (count badge, action button, view toggle)
 *  - Unified filter bar slot
 *  - Loading skeleton, empty state, and content slots
 *
 * Usage:
 *   <ListShell
 *     title="Projects"
 *     count={12}
 *     filters={<FilterBar />}
 *     loading={isLoading}
 *     empty={projects.length === 0}
 *     emptyIcon={<FolderOpen />}
 *     emptyTitle="No projects yet"
 *     emptyDescription="Click New Project to get started."
 *     headerRight={<ViewToggle />}
 *   >
 *     {projects.map(p => <ProjectRow key={p.id} project={p} />)}
 *   </ListShell>
 */

interface ListShellProps {
  /** Section title */
  title: string;
  /** Optional count shown next to title */
  count?: number;
  /** Right slot in header — view toggle, action button, etc. */
  headerRight?: ReactNode;
  /** Filter bar content */
  filters?: ReactNode;
  /** Show loading skeleton */
  loading?: boolean;
  /** Custom loading skeleton — defaults to 3 generic rows */
  skeleton?: ReactNode;
  /** Whether the list is empty (after loading) */
  empty?: boolean;
  /** Icon shown in empty state */
  emptyIcon?: ReactNode;
  /** Empty state headline */
  emptyTitle?: string;
  /** Empty state description */
  emptyDescription?: string;
  /** Optional extra action in empty state */
  emptyAction?: ReactNode;
  /** The actual list content */
  children?: ReactNode;
  /** id for anchor links */
  id?: string;
  /** Additional wrapper className */
  className?: string;
}

function DefaultSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-[var(--fs-radius-lg)] border border-[var(--fs-rule)] p-4 animate-pulse"
          style={{ background: 'var(--fs-bg-elevated)' }}
        >
          <div className="flex gap-3 items-start">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--fs-rule)] mt-1.5 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 bg-[var(--fs-rule)] rounded" />
              <div className="h-3 w-32 bg-[var(--fs-rule)]/60 rounded" />
              <div className="h-3 w-full bg-[var(--fs-rule)]/60 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListShell({
  title,
  count,
  headerRight,
  filters,
  loading = false,
  skeleton,
  empty = false,
  emptyIcon,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  emptyAction,
  children,
  id,
  className = '',
}: ListShellProps) {
  return (
    <section id={id} className={`mb-8 ${className}`}>
      <GlassCard noHover>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[var(--fs-ink)] flex items-center gap-2">
            {title}
            {count !== undefined && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--fs-accent-bg)] text-[var(--fs-accent)]">
                {count}
              </span>
            )}
          </h2>
          {headerRight && <div className="flex items-center gap-2">{headerRight}</div>}
        </div>

        {/* Filter bar */}
        {filters && (
          <div className="flex flex-wrap items-center gap-2 mb-5 min-w-0">
            {filters}
          </div>
        )}

        {/* Content */}
        {loading ? (
          skeleton ?? <DefaultSkeleton />
        ) : empty ? (
          <div className="py-12 text-center">
            {emptyIcon && (
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--fs-rule)] bg-[var(--fs-bg-elevated)]">
                <span className="text-[var(--fs-ink-faint)]">{emptyIcon}</span>
              </div>
            )}
            <h3 className="text-base font-semibold text-[var(--fs-ink)] mb-1">
              {emptyTitle}
            </h3>
            {emptyDescription && (
              <p className="text-sm text-[var(--fs-ink-faint)] max-w-sm mx-auto">
                {emptyDescription}
              </p>
            )}
            {emptyAction && <div className="mt-4">{emptyAction}</div>}
          </div>
        ) : (
          children
        )}
      </GlassCard>
    </section>
  );
}

/**
 * Shared filter pill group — the tab switcher used in both lists.
 *
 * Usage:
 *   <FilterTabs
 *     tabs={STATUS_TABS}
 *     value={status}
 *     onChange={setStatus}
 *   />
 */
interface Tab {
  value: string;
  label: string;
}

export function FilterTabs({
  tabs,
  value,
  onChange,
}: {
  tabs: Tab[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 bg-[var(--fs-rule)]/40 rounded-xl p-1 overflow-x-auto max-w-full scrollbar-none">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`whitespace-nowrap shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            value === tab.value
              ? 'bg-[var(--fs-bg-elevated)] text-[var(--fs-ink)] shadow-sm'
              : 'text-[var(--fs-ink-faint)] hover:text-[var(--fs-ink-dim)]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Shared sort select — used by any list needing a sort dropdown.
 */
interface SortOption {
  value: string;
  label: string;
}

export function SortSelect({
  options,
  value,
  onChange,
}: {
  options: SortOption[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-xs rounded-xl border border-[var(--fs-rule)] bg-[var(--fs-bg-elevated)] text-[var(--fs-ink-dim)] px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--fs-accent-ring)]"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/**
 * Shared search input — used by any list.
 */
import { Search } from 'lucide-react';

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative flex-1 min-w-0">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--fs-ink-faint)]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[var(--fs-rule)] bg-[var(--fs-bg-elevated)] text-[var(--fs-ink-dim)] placeholder:text-[var(--fs-ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--fs-accent-ring)]"
      />
    </div>
  );
}

/**
 * View mode toggle — list / grid switcher used by TeamProjectsList.
 */
import { List, LayoutGrid } from 'lucide-react';

export function ViewToggle({
  value,
  onChange,
}: {
  value: 'list' | 'grid';
  onChange: (v: 'list' | 'grid') => void;
}) {
  return (
    <div
      className="inline-flex items-center rounded-[var(--fs-radius-md)] border p-1"
      style={{
        background: 'var(--fs-glass-bg)',
        borderColor: 'var(--fs-glass-edge)',
        boxShadow: 'var(--fs-shadow-xs)',
      }}
    >
      {(['list', 'grid'] as const).map((mode) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          className={`p-2 rounded-md transition-colors ${
            value === mode
              ? 'bg-[var(--fs-bg-elevated)] text-[var(--fs-ink)] shadow-sm'
              : 'text-[var(--fs-ink-faint)] hover:text-[var(--fs-ink-dim)]'
          }`}
        >
          {mode === 'list' ? (
            <List className="w-4 h-4" />
          ) : (
            <LayoutGrid className="w-4 h-4" />
          )}
        </button>
      ))}
    </div>
  );
}
