'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import Image from 'next/image';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useTranslations } from '@/lib/i18n';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useSidebar } from '@/contexts/SidebarContext';
import {
  LayoutDashboard,
  BarChart3,
  UserPlus,
  Users,
  ShieldCheck,
  FolderOpen,
  Sparkles as SparklesIcon,
  ChevronsLeft,
  ChevronsRight,
  X,
  type LucideIcon,
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
    { label: t('team.sidebar.analytics'), href: '/team/dashboard/analytics', icon: BarChart3 },
  ];

  const adminItems = [
    { label: t('team.sidebar.invite'), href: '/team/dashboard/invite', icon: UserPlus },
  ];

  const adminOnlyItems = [
    { label: 'All projects', href: '/team/dashboard/projects/list', icon: FolderOpen  },
    { label: 'AI usage',     href: '/team/dashboard/ai-usage',      icon: SparklesIcon },
    { label: 'Clients',      href: '/team/dashboard/clients',        icon: Users       },
    { label: 'Team members', href: '/team/dashboard/team',           icon: ShieldCheck },
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

  const NavLink = ({ href, icon: Icon, label, exact, showLabel = true }: { href: string; icon: LucideIcon; label: string; exact?: boolean; showLabel?: boolean }) => (
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

  function SidebarProfile() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  if (!user) return null;
  const initials = (user.fullName ?? user.primaryEmailAddress?.emailAddress ?? '?')
    .split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="border-t border-gray-100 dark:border-white/[0.06] pt-3 space-y-1">
      <button
        onClick={() => router.push('/team/dashboard/profile')}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/55 dark:hover:bg-white/5 transition-colors text-left"
      >
        {user.imageUrl ? (
          <Image src={user.imageUrl} alt={user.fullName ?? ''} width={32} height={32} className="w-8 h-8 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--purple)] to-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">{initials}</div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.fullName ?? 'Account'}</p>
          <p className="text-[0.65rem] text-gray-400 dark:text-white/30 truncate">{user.primaryEmailAddress?.emailAddress}</p>
        </div>
      </button>
      <button
        onClick={() => signOut(() => router.push('/team/login'))}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500 dark:text-white/40 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/5 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Sign out
      </button>
    </div>
  );
}

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

      {/* Admin-only pages */}
      {isAdmin && (
        <div className={cn(!showLabel && "w-full")}>
          {showLabel && (
            <h3 className="px-3 mb-2 text-[0.625rem] font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider">
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

      {/* Spacer */}
      <div className="flex-1" />

      {/* Profile footer — mobile only (showLabel = true on mobile sidebar) */}
      {showLabel && <SidebarProfile />}
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
          'md:hidden fixed inset-y-0 left-0 z-[160] w-72 rounded-r-2xl',
          'bg-white/95 dark:bg-white/[0.05] backdrop-blur-2xl backdrop-saturate-150',
          'border border-white/80 dark:border-white/[0.06]',
          'shadow-[8px_0_32px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.9)_inset] dark:shadow-[8px_0_32px_rgba(0,0,0,0.25),0_1px_0_rgba(255,255,255,0.06)_inset]',
          'transform transition-transform duration-300 ease-in-out',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between p-4 border-b border-white/60 dark:border-white/10">
          <Link href="/team/dashboard" onClick={() => setIsMobileOpen(false)}>
            <Logo size="sm" />
          </Link>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-white/55 dark:hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ThemeToggle with label */}
        <div className="px-4 py-3 border-b border-white/60 dark:border-white/10 flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-white/70">Theme</span>
          <ThemeToggle />
        </div>

        {/* Always show labels on mobile */}
        <SidebarContent showLabel />
      </aside>

      {/* Desktop/Tablet sidebar - Glassmorphism */}
      <aside 
        className={cn(
          'hidden md:flex flex-col flex-shrink-0 overflow-hidden transition-all duration-300',
          'bg-white/95 dark:bg-white/[0.05] backdrop-blur-2xl backdrop-saturate-150',
          'border-r border-white/80 dark:border-white/[0.06]',
          'shadow-[4px_0_24px_rgba(0,0,0,0.06),inset_-1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2),inset_-1px_0_0_rgba(255,255,255,0.04)]',
          collapsed ? 'w-[68px]' : 'w-64'
        )}
      >
        <div className="h-full flex flex-col overflow-hidden">
          <SidebarContent showLabel={!collapsed} showCollapseToggle />
        </div>
      </aside>
    </>
  );
}
