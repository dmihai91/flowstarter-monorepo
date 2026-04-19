'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useTranslations } from '@/lib/i18n';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useSidebar } from '@/contexts/SidebarContext';
import {
  LayoutDashboard,
  BarChart3,
  Users,
  ShieldCheck,
  Sparkles as SparklesIcon,
  Inbox,
  ChevronsLeft,
  ChevronsRight,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

export function TeamSidebar() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const { t } = useTranslations();
  const [collapsed, setCollapsed] = useLocalStorage(
    'team-sidebar-collapsed',
    false
  );
  const { isMobileOpen, setIsMobileOpen } = useSidebar();

  const metadata = user?.publicMetadata as { role?: string } | undefined;
  const role = metadata?.role?.toLowerCase();
  // Show admin items optimistically until auth loads, then gate on actual role
  const isAdmin = !isLoaded || role === 'admin' || role === 'team';

  const adminOnlyItems = [
    {
      label: 'Client requests',
      href: '/team/dashboard#client-requests-list',
      icon: Inbox,
    },
    { label: 'Analytics', href: '/team/dashboard/analytics', icon: BarChart3 },
    { label: 'AI usage', href: '/team/dashboard/ai-usage', icon: SparklesIcon },
    { label: 'Clients', href: '/team/dashboard/clients', icon: Users },
    { label: 'Team members', href: '/team/dashboard/team', icon: ShieldCheck },
  ];

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname, setIsMobileOpen]);

  // Close mobile sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [setIsMobileOpen]);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname?.startsWith(href);
  };

  const NavLink = ({
    href,
    icon: Icon,
    label,
    exact,
    showLabel = true,
  }: {
    href: string;
    icon: LucideIcon;
    label: string;
    exact?: boolean;
    showLabel?: boolean;
  }) => (
    <Link
      href={href}
      title={!showLabel ? label : undefined}
      onClick={() => setIsMobileOpen(false)}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
          isActive(href, exact)
          ? 'bg-[var(--fs-accent)] text-white shadow-lg shadow-[var(--fs-accent)]/25'
          : 'text-[var(--fs-ink-dim)] hover:bg-white/55 dark:hover:bg-white/5 hover:text-[var(--fs-ink)]',
        !showLabel && 'justify-center !px-2'
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {showLabel && <span className="truncate">{label}</span>}
    </Link>
  );

  const SidebarContent = ({
    showLabel,
    showCollapseToggle = false,
  }: {
    showLabel: boolean;
    showCollapseToggle?: boolean;
  }) => (
    <div
      className={cn(
        'p-4 space-y-6 h-full overflow-y-auto flex flex-col',
        !showLabel && 'items-center'
      )}
    >
      {/* Collapse Toggle - Desktop only */}
      {showCollapseToggle && (
        <div
          className={cn(
            'w-full',
            !showLabel ? 'flex justify-center' : 'flex justify-end'
          )}
        >
          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'p-2 rounded-lg text-[var(--fs-ink-faint)] hover:text-[var(--fs-ink-dim)]',
              'hover:bg-white/55 dark:hover:bg-white/5 transition-all'
            )}
          >
            {collapsed ? (
              <ChevronsRight className="w-4 h-4" />
            ) : (
              <ChevronsLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      )}

      {/* Main Navigation */}
      <div className={cn('space-y-1', !showLabel && 'w-full')}>
        <NavLink
          href="/team/dashboard"
          icon={LayoutDashboard}
          label={t('team.sidebar.dashboard')}
          exact
          showLabel={showLabel}
        />
      </div>

      {/* Admin-only pages */}
      {isAdmin && (
        <div className={cn(!showLabel && 'w-full')}>
          {showLabel && (
              <h3 className="px-3 mb-2 text-[0.625rem] font-semibold text-[var(--fs-ink-faint)] uppercase tracking-wider">
              Admin
            </h3>
          )}
          <div className="space-y-1">
            {adminOnlyItems.map((item) => (
              <NavLink key={item.href} {...item} showLabel={showLabel} />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        style={{ background: 'var(--fs-glass-bg)', borderColor: 'var(--fs-glass-edge)' }}
        className={cn(
          'md:hidden fixed inset-y-0 left-0 z-[160] w-72 rounded-r-2xl',
          'backdrop-blur-2xl backdrop-saturate-150',
          'border',
          'shadow-[8px_0_32px_rgba(0,0,0,0.08)] dark:shadow-[8px_0_32px_rgba(0,0,0,0.25)]',
          'transform transition-transform duration-300 ease-in-out',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--fs-rule)]">
          <Link href="/team/dashboard" onClick={() => setIsMobileOpen(false)}>
            <Logo size="sm" />
          </Link>
          <button
            onClick={() => setIsMobileOpen(false)}
              className="p-2 rounded-xl text-[var(--fs-ink-faint)] hover:text-[var(--fs-ink)] hover:bg-white/55 dark:hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ThemeToggle with label */}
        <div className="px-4 py-3 border-b border-[var(--fs-rule)] flex items-center justify-between">
          <span className="text-sm text-[var(--fs-ink-dim)]">
            Theme
          </span>
          <ThemeToggle />
        </div>

        {/* Always show labels on mobile */}
        <SidebarContent showLabel />
      </aside>

      {/* Desktop/Tablet sidebar - Glassmorphism */}
      <aside
        style={{ background: 'var(--fs-glass-bg)', borderColor: 'var(--fs-glass-edge)' }}
        className={cn(
          'hidden md:flex flex-col flex-shrink-0 overflow-hidden transition-all duration-300',
          'backdrop-blur-2xl backdrop-saturate-150',
          'border-r',
          'shadow-[4px_0_24px_rgba(0,0,0,0.06),inset_-1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2),inset_-1px_0_0_rgba(255,255,255,0.04)]',
          collapsed ? 'w-[68px]' : 'w-48 lg:w-64'
        )}
      >
        <div className="h-full flex flex-col overflow-hidden">
          <SidebarContent showLabel={!collapsed} showCollapseToggle />
        </div>
      </aside>
    </>
  );
}
