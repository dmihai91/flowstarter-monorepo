'use client';

import { FeedbackDialog } from '@/components/FeedbackDialog';
import { DashboardSidebarShell } from '@/components/ui/dashboard-sidebar-shell';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSidebar } from '@/contexts/SidebarContext';
import { EXTERNAL_URLS } from '@/lib/constants';
import { useTranslations } from '@/lib/i18n';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { cn } from '@/lib/utils';
import {
  sidebarNavActiveClass,
  sidebarNavBaseClass,
  sidebarNavIdleClass,
  sidebarSectionLabelClass,
} from '@/lib/glass';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Calendar,
  HelpCircle,
  LayoutDashboard,
  MessageSquare,
  X,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface SidebarItem {
  title: string;
  href: string;
  icon: LucideIcon;
  external?: boolean;
}

export function Sidebar() {
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } =
    useSidebar();
  const { t } = useTranslations();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const mainItems: SidebarItem[] = [
    {
      title: t('sidebar.dashboard'),
      href: '/dashboard',
      icon: LayoutDashboard,
    },
  ];

  const { data: dashData, isLoading: statsLoading } = useDashboardStats();
  const hasProject = !statsLoading && (dashData?.totalProjects ?? 0) > 0;

  const supportItems: SidebarItem[] = [
    {
      title: hasProject
        ? t('sidebar.scheduleCheckin')
        : t('sidebar.bookFreeCall'),
      href: hasProject
        ? EXTERNAL_URLS.calendly.checkIn
        : EXTERNAL_URLS.calendly.discovery,
      icon: Calendar,
      external: true,
    },
    {
      title: t('sidebar.helpGuide'),
      href: '/dashboard/help',
      icon: HelpCircle,
    },
    {
      title: t('sidebar.feedback'),
      href: '#feedback',
      icon: MessageSquare,
    },
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
    if (href === '/dashboard') {
      return (
        pathname === '/dashboard' || pathname?.startsWith('/dashboard/projects')
      );
    }
    return pathname?.startsWith(href);
  };

  const NavLink = ({
    href,
    icon: Icon,
    label,
    exact,
    external,
    onClick,
    showLabel,
  }: {
    href: string;
    icon: LucideIcon;
    label: string;
    exact?: boolean;
    external?: boolean;
    onClick?: () => void;
    showLabel: boolean;
  }) => {
    const active = !external && isActive(href, exact);

    const cls = cn(
      sidebarNavBaseClass,
      active ? sidebarNavActiveClass : sidebarNavIdleClass,
      !showLabel && 'justify-center !px-0 w-11 mx-auto'
    );

    const content = (
      <>
        <Icon className="w-4 h-4 flex-shrink-0" />
        {showLabel && <span className="truncate">{label}</span>}
      </>
    );

    const linkNode = external ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className={cls}
      >
        {content}
      </a>
    ) : (
      <Link href={href} onClick={onClick} className={cls}>
        {content}
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
      <div className={cn(!showLabel && 'w-full')}>
        {showLabel && (
          <h3 className={sidebarSectionLabelClass}>{t('sidebar.main')}</h3>
        )}
        <div className="space-y-1">
          {mainItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.title}
              exact={item.href === '/dashboard'}
              showLabel={showLabel}
            />
          ))}
        </div>
      </div>

      <div className={cn(!showLabel && 'w-full')}>
        {showLabel && (
          <h3 className={sidebarSectionLabelClass}>{t('sidebar.support')}</h3>
        )}
        <div className="space-y-1">
          {supportItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href === '#feedback' ? '#' : item.href}
              icon={item.icon}
              label={item.title}
              external={item.external}
              onClick={
                item.href === '#feedback'
                  ? () => {
                      setIsFeedbackOpen(true);
                      setIsMobileOpen(false);
                    }
                  : undefined
              }
              showLabel={showLabel}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <DashboardSidebarShell
        collapsed={isCollapsed}
        onToggleCollapsed={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        resolvedTheme={resolvedTheme}
        renderContent={renderContent}
        mobileTopArea={
          <>
            <div className="flex items-center justify-between p-4 border-b border-[var(--fs-rule)]">
              <Link href="/dashboard">
                <Logo size="sm" />
              </Link>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 rounded-lg text-[var(--fs-ink-faint)] hover:text-[var(--fs-ink)] hover:bg-[var(--fs-bg-elevated)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-4 py-3 border-b border-[var(--fs-rule)] flex items-center justify-between">
              <span className="text-sm text-[var(--fs-ink-dim)]">Theme</span>
              <ThemeToggle />
            </div>
          </>
        }
      />

      <FeedbackDialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen} />
    </>
  );
}
