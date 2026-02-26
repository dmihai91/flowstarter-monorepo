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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  
  const metadata = user?.publicMetadata as { role?: string } | undefined;
  const isAdmin = metadata?.role?.toLowerCase() === 'admin';

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname?.startsWith(href);
  };

  const NavLink = ({ href, icon: Icon, label, exact }: { href: string; icon: any; label: string; exact?: boolean }) => (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
        isActive(href, exact)
          ? 'bg-[var(--purple)] text-white shadow-md shadow-[var(--purple)]/25'
          : 'text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white',
        collapsed && 'justify-center px-2'
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );

  return (
    <aside 
      className={cn(
        'flex-shrink-0 border-r border-gray-200/50 dark:border-white/5 bg-white/50 dark:bg-white/[0.02] backdrop-blur-sm transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="sticky top-16 p-3 space-y-6 h-[calc(100vh-4rem)] overflow-y-auto">
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

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
          {!collapsed && (
            <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider">
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
          <div>
            {!collapsed && (
              <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider">
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
      </div>
    </aside>
  );
}
