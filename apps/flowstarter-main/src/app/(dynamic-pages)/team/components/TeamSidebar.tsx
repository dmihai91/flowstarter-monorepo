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
  Globe,
  Mail,
  Shield,
  BarChart3,
  Wrench,
  UserPlus,
  ChevronsLeft,
  ChevronsRight,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

export function TeamSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { t } = useTranslations();
  const [collapsed, setCollapsed] = useLocalStorage('team-sidebar-collapsed', false);
  const { isMobileOpen, setIsMobileOpen } = useSidebar();
  
  const metadata = user?.publicMetadata as { role?: string } | undefined;
  const isAdmin = metadata?.role?.toLowerCase() === 'admin';

  const configItems = [
    { label: t('team.sidebar.domains'), href: '/team/dashboard/domains', icon: Globe },
    { label: t('team.sidebar.email'), href: '/team/dashboard/email', icon: Mail },
    { label: t('team.sidebar.analytics'), href: '/team/dashboard/analytics', icon: BarChart3 },
    { label: t('team.sidebar.services'), href: '/team/dashboard/services', icon: Wrench },
    { label: t('team.sidebar.security'), href: '/team/dashboard/security', icon: Shield },
  ];

  const adminItems = [
    { label: t('team.sidebar.invite'), href: '/team/dashboard/invite', icon: UserPlus },
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

  const NavLink = ({ href, icon: Icon, label, exact, showLabel = true }: { href: string; icon: any; label: string; exact?: boolean; showLabel?: boolean }) => (
    <Link
      href={href}
      title={!showLabel ? label : undefined}
      onClick={() => setIsMobileOpen(false)}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
        isActive(href, exact)
          ? 'bg-[var(--purple)] text-white shadow-lg shadow-[var(--purple)]/25'
          : 'text-gray-600 dark:text-white/60 hover:bg-white/55 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white',
        !showLabel && 'justify-center !px-2'
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {showLabel && <span className="truncate">{label}</span>}
    </Link>
  );

  const SidebarContent = ({ showLabel, showCollapseToggle = false }: { showLabel: boolean; showCollapseToggle?: boolean }) => (
    <div className={cn("p-4 space-y-6 h-full overflow-y-auto flex flex-col", !showLabel && "items-center")}>
      {/* Collapse Toggle - Desktop only */}
      {showCollapseToggle && (
        <div className={cn("w-full", !showLabel ? "flex justify-center" : "flex justify-end")}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white/60',
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
      <div className={cn("space-y-1", !showLabel && "w-full")}>
        <NavLink 
          href="/team/dashboard" 
          icon={LayoutDashboard} 
          label={t('team.sidebar.dashboard')} 
          exact 
          showLabel={showLabel}
        />
      </div>

      {/* Configuration */}
      <div className={cn(!showLabel && "w-full")}>
        {showLabel && (
          <h3 className="px-3 mb-2 text-[0.625rem] font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider">
            {t('team.sidebar.configuration')}
          </h3>
        )}
        <div className="space-y-1">
          {configItems.map((item) => (
            <NavLink key={item.href} {...item} showLabel={showLabel} />
          ))}
        </div>
      </div>

      {/* Admin Only */}
      {isAdmin && (
        <div className={cn(!showLabel && "w-full")}>
          {showLabel && (
            <h3 className="px-3 mb-2 text-[0.625rem] font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider">
              {t('team.sidebar.team')}
            </h3>
          )}
          <div className="space-y-1">
            {adminItems.map((item) => (
              <NavLink key={item.href} {...item} showLabel={showLabel} />
            ))}
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />
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
        className={cn(
          'md:hidden fixed inset-y-0 left-0 z-[160] w-72',
          'bg-white/80 dark:bg-[#101014]/80 backdrop-blur-2xl backdrop-saturate-150',
          'border-r border-white/60 dark:border-white/10',
          'shadow-2xl shadow-black/10 dark:shadow-black/30',
          'transform transition-transform duration-300 ease-in-out',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-white/5">
          <Link href="/team/dashboard" onClick={() => setIsMobileOpen(false)}>
            <Logo size="sm" />
          </Link>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ThemeToggle with label */}
        <div className="px-4 py-3 border-b border-gray-200/50 dark:border-white/5 flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-white/70">Theme</span>
          <ThemeToggle />
        </div>

        {/* Always show labels on mobile */}
        <SidebarContent showLabel />
      </aside>

      {/* Desktop/Tablet sidebar - Glassmorphism */}
      <aside 
        className={cn(
          'hidden md:flex flex-col flex-shrink-0 transition-all duration-300',
          'bg-white/75 dark:bg-[#101014]/70 backdrop-blur-2xl backdrop-saturate-150',
          'border-r border-white/60 dark:border-white/10 shadow-[1px_0_3px_rgba(0,0,0,0.05)]',
          collapsed ? 'w-[68px]' : 'w-64'
        )}
      >
        <div className="sticky top-16 h-[calc(100vh-4rem)] flex flex-col">
          <SidebarContent showLabel={!collapsed} showCollapseToggle />
        </div>
      </aside>
    </>
  );
}
