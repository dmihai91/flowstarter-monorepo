'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useTranslations } from '@/lib/i18n';
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
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useEffect } from 'react';

export function TeamSidebar() {
  const { resolvedTheme } = useTheme();
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

  const sidebarChromeStyle = {
    background:
      resolvedTheme === 'dark'
        ? 'rgba(20, 22, 34, 0.9)'
        : 'rgba(255, 255, 255, 0.97)',
    borderRight:
      resolvedTheme === 'dark'
        ? '1px solid rgba(255, 255, 255, 0.1)'
        : '1px solid rgba(18, 10, 34, 0.08)',
    boxShadow:
      resolvedTheme === 'dark'
        ? '6px 0 18px rgba(2, 6, 23, 0.24)'
        : '6px 0 18px rgba(15, 23, 42, 0.06)',
    backdropFilter: 'blur(20px) saturate(160%)',
    WebkitBackdropFilter: 'blur(20px) saturate(160%)',
  } as const;

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
            'w-full sticky top-2 z-20',
            !showLabel ? 'flex justify-center' : 'flex justify-end'
          )}
        >
          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'p-2.5 rounded-xl border border-gray-300 dark:border-white/25',
              'bg-white text-[var(--fs-ink)] dark:bg-[#22253a] dark:text-white',
              'hover:bg-gray-100 dark:hover:bg-[#2a2e46] shadow-md transition-all'
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
      {/* Mobile overlay — below header */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed top-16 inset-x-0 bottom-0 z-[150] bg-black/40 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar — starts below header (top-16 = 64px) */}
      <aside
        style={sidebarChromeStyle}
        className={cn(
          'md:hidden fixed top-16 bottom-0 left-0 z-[160] w-72 rounded-r-2xl',
          'transform transition-transform duration-300 ease-in-out',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* ThemeToggle with label */}
        <div className="px-4 py-3 border-b border-[var(--fs-rule)] flex items-center justify-between">
          <span className="text-sm text-[var(--fs-ink-dim)]">Theme</span>
          <ThemeToggle />
        </div>

        {/* Always show labels on mobile */}
        <SidebarContent showLabel />
      </aside>

      {/* Desktop/Tablet sidebar */}
      <aside
        style={sidebarChromeStyle}
        className={cn(
          'hidden md:flex flex-col flex-shrink-0 overflow-hidden transition-all duration-300',
          collapsed ? 'w-[68px]' : 'w-48 lg:w-64'
        )}
      >
        <div
          className={cn(
            'px-2 pt-2',
            collapsed ? 'flex justify-center' : 'flex justify-end'
          )}
        >
          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="h-8 w-8 rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-white/25 dark:bg-[#22253a] dark:text-white dark:hover:bg-[#2a2e46]"
          >
            {collapsed ? (
              <ChevronsRight className="mx-auto h-4 w-4" />
            ) : (
              <ChevronsLeft className="mx-auto h-4 w-4" />
            )}
          </button>
        </div>
        <div className="h-full flex flex-col overflow-hidden">
          <SidebarContent showLabel={!collapsed} />
        </div>
      </aside>
    </>
  );
}
