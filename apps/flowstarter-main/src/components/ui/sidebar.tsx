'use client';

import { FeedbackDialog } from '@/components/FeedbackDialog';
import { useSidebar } from '@/contexts/SidebarContext';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ClientUserMenu } from '@/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/dashboard/components/ClientUserMenu';
import {
  Calendar,
  HelpCircle,
  LayoutDashboard,
  MessageSquare,
  Puzzle,
  ChevronsLeft,
  ChevronsRight,
  X,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const CALENDLY_URL = 'https://calendly.com/flowstarter-app/discovery';

interface SidebarItem {
  title: string;
  href: string;
  icon: LucideIcon;
  external?: boolean;
}

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();
  const { t } = useTranslations();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const mainItems: SidebarItem[] = [
    {
      title: t('sidebar.dashboard'),
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: t('sidebar.integrations'),
      href: '/dashboard/integrations',
      icon: Puzzle,
    },
  ];

  const supportItems: SidebarItem[] = [
    {
      title: t('sidebar.bookFreeCall'),
      href: CALENDLY_URL,
      icon: Calendar,
      external: true,
    },
    {
      title: t('sidebar.helpGuide'),
      href: '/help',
      icon: HelpCircle,
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
      return pathname === '/dashboard' || 
             pathname?.startsWith('/dashboard/new') || 
             pathname?.startsWith('/dashboard/projects');
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
      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
      active
        ? 'bg-[var(--purple)] text-white shadow-lg shadow-[var(--purple)]/25'
        : 'text-gray-600 dark:text-white/60 hover:bg-white/55 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white',
      !showLabel && 'justify-center !px-2'
    );

    const content = (
      <>
        <Icon className="w-4 h-4 flex-shrink-0" />
        {showLabel && <span className="truncate">{label}</span>}
      </>
    );

    if (external) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" title={!showLabel ? label : undefined} onClick={onClick} className={cls}>
          {content}
        </a>
      );
    }

    return (
      <Link href={href} title={!showLabel ? label : undefined} onClick={onClick} className={cls}>
        {content}
      </Link>
    );
  };

  const SidebarContent = ({ showToggle = false, forceExpanded = false }: { showToggle?: boolean; forceExpanded?: boolean }) => {
    const showLabel = forceExpanded ? true : !isCollapsed;
    const effectiveCollapsed = !showLabel;
    return (
    <div className={cn("p-4 space-y-6 h-full overflow-y-auto flex flex-col", effectiveCollapsed && "items-center")}>
      {/* Collapse Toggle - Desktop only, hidden when collapsed */}
      {showToggle && showLabel && (
        <div className="w-full flex justify-end">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title="Collapse sidebar"
            className={cn(
              'p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white/60',
              'hover:bg-white/55 dark:hover:bg-white/5 transition-all'
            )}
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Navigation */}
      <div className={cn(effectiveCollapsed && "w-full")}>
        {showLabel && (
          <h3 className="px-3 mb-2 text-[10px] font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider">
            {t('sidebar.main')}
          </h3>
        )}
        <div className="space-y-1">
          {mainItems.map((item) => (
            <NavLink 
              key={item.href} 
              href={item.href}
              icon={item.icon}
              label={item.title}
              exact={item.href === '/dashboard'}
              onClick={() => setIsMobileOpen(false)}
              showLabel={showLabel}
            />
          ))}
        </div>
      </div>

      {/* Support */}
      <div className={cn(effectiveCollapsed && "w-full")}>
        {showLabel && (
          <h3 className="px-3 mb-2 text-[10px] font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider">
            {t('sidebar.support')}
          </h3>
        )}
        <div className="space-y-1">
          {supportItems.map((item) => (
            <NavLink 
              key={item.href} 
              href={item.href}
              icon={item.icon}
              label={item.title}
              external={item.external}
              onClick={() => setIsMobileOpen(false)}
              showLabel={showLabel}
            />
          ))}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Feedback */}
      <div className="border-t border-white/10 pt-4">
        <button
          onClick={() => setIsFeedbackOpen(true)}
          title={effectiveCollapsed ? t('sidebar.feedback') : undefined}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
            'text-gray-600 dark:text-white/60 hover:bg-white/55 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white',
            effectiveCollapsed && 'justify-center !px-2'
          )}
        >
          <MessageSquare className="w-4 h-4 flex-shrink-0" />
          {showLabel && <span className="truncate">{t('sidebar.feedback')}</span>}
        </button>
      </div>

    </div>
    );
  };

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
        className={cn(
          'md:hidden fixed inset-y-0 left-0 z-[160] w-72',
          'bg-white/92 dark:bg-[#12121a]/88 backdrop-blur-2xl backdrop-saturate-150',
          'border-r border-white/60 dark:border-white/10',
          'shadow-2xl shadow-black/10 dark:shadow-black/30',
          'transform transition-transform duration-300 ease-in-out',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-white/5">
          <Link href="/dashboard" onClick={() => setIsMobileOpen(false)}>
            <Logo size="sm" />
          </Link>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ThemeToggle on its own row */}
        <div className="px-4 py-3 border-b border-gray-200/50 dark:border-white/5 flex justify-center">
          <ThemeToggle />
        </div>

        {/* Always show labels on mobile */}
        <SidebarContent forceExpanded />

        {/* Profile at bottom */}
        <div className="px-4 py-3 border-t border-gray-200/50 dark:border-white/5">
          <ClientUserMenu />
        </div>
      </aside>

      {/* Desktop/Tablet sidebar - Glassmorphism */}
      <aside 
        className={cn(
          'hidden md:flex flex-col flex-shrink-0 fixed left-0 top-16 bottom-0 transition-all duration-300 z-40',
          'bg-white/90 dark:bg-[#12121a]/85 backdrop-blur-2xl backdrop-saturate-150',
          'border-r border-white/60 dark:border-white/10 shadow-[1px_0_3px_rgba(0,0,0,0.05)]',
          isCollapsed ? 'w-[68px]' : 'w-64'
        )}
      >
        <SidebarContent showToggle />
      </aside>

      <FeedbackDialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen} />
    </>
  );
}
