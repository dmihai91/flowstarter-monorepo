'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  LayoutDashboard,
  Globe,
  Mail,
  Shield,
  BarChart3,
  Wrench,
  UserPlus,
  PanelLeftClose,
  PanelLeft,
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
        collapsed && 'lg:justify-center lg:px-2'
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className={cn('truncate', collapsed && 'lg:hidden')}>{label}</span>
    </Link>
  );

  const SidebarContent = ({ showToggle = false }: { showToggle?: boolean }) => (
    <div className="p-4 space-y-6 h-full overflow-y-auto">
      {/* Main Navigation */}
      <div className="space-y-1">
        <NavLink 
          href="/team/dashboard" 
          icon={LayoutDashboard} 
          label="Dashboard" 
          exact 
        />
      </div>

      {/* Configuration */}
      <div>
        <h3 className={cn(
          'px-3 mb-2 text-[10px] font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider',
          collapsed && 'lg:hidden'
        )}>
          Configuration
        </h3>
        <div className="space-y-1">
          {configItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </div>
      </div>

      {/* Admin Only */}
      {isAdmin && (
        <div>
          <h3 className={cn(
            'px-3 mb-2 text-[10px] font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider',
            collapsed && 'lg:hidden'
          )}>
            Team
          </h3>
          <div className="space-y-1">
            {adminItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Collapse toggle at bottom - desktop only */}
      {showToggle && (
        <div className="pt-4 border-t border-white/10">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              'text-gray-500 dark:text-white/40 hover:bg-white/60 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-white/60',
              collapsed && 'justify-center px-2'
            )}
          >
            {collapsed ? (
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
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-4 left-4 z-50 p-3 rounded-full bg-[var(--purple)] text-white shadow-lg shadow-[var(--purple)]/25 hover:bg-[var(--purple)]/90 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
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
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-white/5">
          <Link href="/team/dashboard" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--purple)] to-blue-500 flex items-center justify-center shadow-lg shadow-[var(--purple)]/20">
              <span className="text-white font-bold text-xs">F</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">Flowstarter</span>
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

      {/* Desktop sidebar - Glassmorphism */}
      <aside 
        className={cn(
          'hidden lg:flex flex-col flex-shrink-0 transition-all duration-300',
          'bg-white/60 dark:bg-white/[0.03] backdrop-blur-2xl backdrop-saturate-150',
          'border-r border-white/50 dark:border-white/10',
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
