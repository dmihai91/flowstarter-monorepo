'use client';

import { DashboardSidebarShell } from '@/components/ui/dashboard-sidebar-shell';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
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
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useEffect } from 'react';
import {
  sidebarNavActiveClass,
  sidebarNavBaseClass,
  sidebarNavIdleClass,
  sidebarSectionLabelClass,
} from '@/lib/glass';

export function TeamSidebar() {
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const { t } = useTranslations();
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } =
    useSidebar();

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
  }) => {
    const linkNode = (
      <Link
        href={href}
        onClick={() => setIsMobileOpen(false)}
        className={cn(
          sidebarNavBaseClass,
          isActive(href, exact) ? sidebarNavActiveClass : sidebarNavIdleClass,
          !showLabel && 'justify-center !px-0 w-11 mx-auto'
        )}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        {showLabel && <span className="truncate">{label}</span>}
      </Link>
    );

    if (!showLabel) {
      return (
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>{linkNode}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkNode;
  };

  const renderContent = (showLabel: boolean) => (
    <div
      className={cn(
        'py-4 pl-4 pr-6 space-y-6 h-full flex flex-col',
        !showLabel && 'items-center'
      )}
    >
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
          {showLabel && <h3 className={sidebarSectionLabelClass}>Admin</h3>}
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
    <DashboardSidebarShell
      collapsed={isCollapsed}
      onToggleCollapsed={() => setIsCollapsed(!isCollapsed)}
      isMobileOpen={isMobileOpen}
      setIsMobileOpen={setIsMobileOpen}
      resolvedTheme={resolvedTheme}
      renderContent={renderContent}
      expandedWidthClass="w-52 lg:w-60"
      mobileTopArea={
        <div className="px-4 py-3 border-b border-[var(--fs-rule)] flex items-center justify-between">
          <span className="text-sm text-[var(--fs-ink-dim)]">Theme</span>
          <ThemeToggle />
        </div>
      }
    />
  );
}
