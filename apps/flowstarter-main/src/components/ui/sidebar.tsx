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
  PanelLeftClose,
  PanelLeft,
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
      title: 'Book a Call',
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
      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
      active
        ? 'bg-[var(--purple)] text-white shadow-lg shadow-[var(--purple)]/25'
        : 'text-gray-600 dark:text-white/60 hover:bg-white/60 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white',
      isCollapsed && 'lg:justify-center lg:px-2'
    );

    const content = (
      <>
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className={cn('truncate', isCollapsed && 'lg:hidden')}>{label}</span>
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
    <div className="p-4 space-y-6 h-full overflow-y-auto flex flex-col">
      {/* Main Navigation */}
      <div>
        <h3 className={cn(
          'px-3 mb-2 text-[10px] font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider',
          isCollapsed && 'lg:hidden'
        )}>
          Main
        </h3>
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
      <div>
        <h3 className={cn(
          'px-3 mb-2 text-[10px] font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider',
          isCollapsed && 'lg:hidden'
        )}>
          Support
        </h3>
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
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
            'text-gray-600 dark:text-white/60 hover:bg-white/60 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white',
            isCollapsed && 'lg:justify-center lg:px-2'
          )}
        >
          <MessageSquare className="w-4 h-4 flex-shrink-0" />
          <span className={cn('truncate', isCollapsed && 'lg:hidden')}>
            {t('sidebar.feedback')}
          </span>
        </button>
      </div>

      {/* Collapse toggle at bottom - desktop only */}
      {showToggle && (
        <div className="pt-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              'text-gray-500 dark:text-white/40 hover:bg-white/60 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-white/60',
              isCollapsed && 'justify-center px-2'
            )}
          >
            {isCollapsed ? (
              <PanelLeft className="w-4 h-4" />
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed bottom-4 left-4 z-50 p-3 rounded-full bg-[var(--purple)] text-white shadow-lg shadow-[var(--purple)]/25 hover:bg-[var(--purple)]/90 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-[160] w-72',
          'bg-white/80 dark:bg-[#1a1a1f]/80 backdrop-blur-2xl backdrop-saturate-150',
          'border-r border-white/20 dark:border-white/10',
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

      {/* Desktop sidebar - Glassmorphism */}
      <aside 
        className={cn(
          'hidden lg:flex flex-col flex-shrink-0 fixed left-0 top-16 bottom-0 transition-all duration-300 z-40',
          'bg-white/60 dark:bg-white/[0.03] backdrop-blur-2xl backdrop-saturate-150',
          'border-r border-white/50 dark:border-white/10',
          isCollapsed ? 'w-[68px]' : 'w-64'
        )}
      >
        <SidebarContent showToggle />
      </aside>

      <FeedbackDialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen} />
    </>
  );
}
