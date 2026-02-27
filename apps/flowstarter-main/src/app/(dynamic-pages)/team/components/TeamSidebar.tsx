'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Logo } from '@/components/ui/logo';
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
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

const configItems = [
  { label: 'Domains', href: '/team/dashboard/domains', icon: Globe },
  { label: 'Email', href: '/team/dashboard/email', icon: Mail },
  { label: 'Analytics', href: '/team/dashboard/analytics', icon: BarChart3 },
  { label: 'Services', href: '/team/dashboard/services', icon: Wrench },
  { label: 'Security', href: '/team/dashboard/security', icon: Shield },
];

const adminItems = [
  { label: 'Invite Team Member', href: '/team/dashboard/invite', icon: UserPlus },
];

export function TeamSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const [collapsed, setCollapsed] = useLocalStorage('team-sidebar-collapsed', false);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const metadata = user?.publicMetadata as { role?: string } | undefined;
  const isAdmin = metadata?.role?.toLowerCase() === 'admin';

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close mobile sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname?.startsWith(href);
  };

  const NavLink = ({ href, icon: Icon, label, exact }: { href: string; icon: any; label: string; exact?: boolean }) => (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      onClick={() => setMobileOpen(false)}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
        isActive(href, exact)
          ? 'bg-[var(--purple)] text-white shadow-lg shadow-[var(--purple)]/25'
          : 'text-gray-600 dark:text-white/60 hover:bg-white/60 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white',
        collapsed && 'justify-center !px-2'
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );

  const SidebarContent = ({ showToggle = false }: { showToggle?: boolean }) => (
    <div className={cn("p-4 space-y-6 h-full overflow-y-auto flex flex-col", collapsed && "items-center")}>
      {/* Collapse Toggle - Top */}
      {showToggle && (
        <div className={cn("w-full", collapsed ? "flex justify-center" : "flex justify-end")}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white/60',
              'hover:bg-white/60 dark:hover:bg-white/5 transition-all'
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
      <div className={cn("space-y-1", collapsed && "w-full")}>
        <NavLink 
          href="/team/dashboard" 
          icon={LayoutDashboard} 
          label="Dashboard" 
          exact 
        />
      </div>

      {/* Configuration */}
      <div className={cn(collapsed && "w-full")}>
        {!collapsed && (
          <h3 className="px-3 mb-2 text-[10px] font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider">
            Configuration
          </h3>
        )}
        <div className="space-y-1">
          {configItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </div>
      </div>

      {/* Admin Only */}
      {isAdmin && (
        <div className={cn(collapsed && "w-full")}>
          {!collapsed && (
            <h3 className="px-3 mb-2 text-[10px] font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider">
              Team
            </h3>
          )}
          <div className="space-y-1">
            {adminItems.map((item) => (
              <NavLink key={item.href} {...item} />
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
      {/* Mobile menu button - shows on phones only */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed bottom-6 left-6 z-[200] p-4 rounded-2xl bg-[var(--purple)] text-white shadow-xl shadow-[var(--purple)]/30 hover:bg-[var(--purple)]/90 active:scale-95 transition-all"
        aria-label="Open menu"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'md:hidden fixed inset-y-0 left-0 z-[160] w-72',
          'bg-white/95 dark:bg-[#12121a]/95 backdrop-blur-2xl backdrop-saturate-150',
          'border-r border-gray-200/80 dark:border-white/10',
          'shadow-2xl shadow-black/20 dark:shadow-black/50',
          'transform transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-white/5">
          <Link href="/team/dashboard" onClick={() => setMobileOpen(false)}>
            <Logo size="sm" />
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
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
          'hidden md:flex flex-col flex-shrink-0 transition-all duration-300',
          'bg-white/80 dark:bg-[#12121a]/80 backdrop-blur-2xl backdrop-saturate-150',
          'border-r border-gray-200/80 dark:border-white/10',
          'shadow-[4px_0_24px_rgba(0,0,0,0.04)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)]',
          collapsed ? 'w-[68px]' : 'w-64'
        )}
      >
        <div className="sticky top-16 h-[calc(100vh-4rem)] flex flex-col">
          <SidebarContent showToggle />
        </div>
      </aside>
    </>
  );
}
