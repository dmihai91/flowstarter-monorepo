'use client';

import { FeedbackDialog } from '@/components/FeedbackDialog';
import { useSidebar } from '@/contexts/SidebarContext';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/logo';
import {
  Calendar,
  HelpCircle,
  LayoutDashboard,
  MessageSquare,
  Puzzle,
  ChevronsLeft,
  ChevronsRight,
  Menu,
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
  }: { 
    href: string; 
    icon: LucideIcon; 
    label: string; 
    exact?: boolean;
    external?: boolean;
    onClick?: () => void;
  }) => {
    const active = !external && isActive(href, exact);
    
    const className = cn(
      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
      active
        ? 'bg-[var(--purple)] text-white shadow-lg shadow-[var(--purple)]/25'
        : 'text-gray-600 dark:text-white/60 hover:bg-white/60 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white',
      isCollapsed && 'justify-center !px-2'
    );

    const content = (
      <>
        <Icon className="w-4 h-4 flex-shrink-0" />
        {!isCollapsed && <span className="truncate">{label}</span>}
      </>
    );

    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          title={isCollapsed ? label : undefined}
          onClick={onClick}
          className={className}
        >
          {content}
        </a>
      );
    }

    return (
      <Link
        href={href}
        title={isCollapsed ? label : undefined}
        onClick={onClick}
        className={className}
      >
        {content}
      </Link>
    );
  };

  const SidebarContent = ({ showToggle = false }: { showToggle?: boolean }) => (
    <div className={cn("p-4 space-y-6 h-full overflow-y-auto flex flex-col", isCollapsed && "items-center")}>
      {/* Collapse Toggle - Top */}
      {showToggle && (
        <div className={cn("w-full", isCollapsed ? "flex justify-center" : "flex justify-end")}>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white/60',
              'hover:bg-white/60 dark:hover:bg-white/5 transition-all'
            )}
          >
            {isCollapsed ? (
              <ChevronsRight className="w-4 h-4" />
            ) : (
              <ChevronsLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      )}

      {/* Main Navigation */}
      <div className={cn(isCollapsed && "w-full")}>
        {!isCollapsed && (
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
            />
          ))}
        </div>
      </div>

      {/* Support */}
      <div className={cn(isCollapsed && "w-full")}>
        {!isCollapsed && (
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
          title={isCollapsed ? t('sidebar.feedback') : undefined}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
            'text-gray-600 dark:text-white/60 hover:bg-white/60 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white',
            isCollapsed && 'justify-center !px-2'
          )}
        >
          <MessageSquare className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span className="truncate">{t('sidebar.feedback')}</span>}
        </button>
      </div>

    </div>
  );

  return (
    <>
      {/* Mobile menu button - shows on phones only */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed bottom-6 left-6 z-[200] p-4 rounded-2xl bg-[var(--purple)] text-white shadow-xl shadow-[var(--purple)]/30 hover:bg-[var(--purple)]/90 active:scale-95 transition-all"
        aria-label="Open menu"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <Menu className="w-6 h-6" />
      </button>

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
          'bg-white/70 dark:bg-[#12121a]/70 backdrop-blur-2xl backdrop-saturate-150',
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
        <SidebarContent />
      </aside>

      {/* Desktop/Tablet sidebar - Glassmorphism */}
      <aside 
        className={cn(
          'hidden md:flex flex-col flex-shrink-0 fixed left-0 top-16 bottom-0 transition-all duration-300 z-40',
          'bg-white/50 dark:bg-[#12121a]/50 backdrop-blur-2xl backdrop-saturate-150',
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
