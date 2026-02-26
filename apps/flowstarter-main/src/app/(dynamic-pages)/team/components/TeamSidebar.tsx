'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import {
  LayoutDashboard,
  FolderKanban,
  UserPlus,
  Users,
  Globe,
  Mail,
  Shield,
  BarChart3,
  Settings,
  Wrench,
} from 'lucide-react';

const navItems = [
  {
    label: 'Dashboard',
    href: '/team/dashboard',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: 'Projects',
    href: '/team/dashboard',
    icon: FolderKanban,
    exact: true,
  },
];

const configItems = [
  {
    label: 'Domains',
    href: '/team/dashboard/domains',
    icon: Globe,
  },
  {
    label: 'Email',
    href: '/team/dashboard/email',
    icon: Mail,
  },
  {
    label: 'Analytics',
    href: '/team/dashboard/analytics',
    icon: BarChart3,
  },
  {
    label: 'Services',
    href: '/team/dashboard/services',
    icon: Wrench,
  },
  {
    label: 'Security',
    href: '/team/dashboard/security',
    icon: Shield,
  },
];

const adminItems = [
  {
    label: 'Invite Team Member',
    href: '/team/dashboard/invite',
    icon: UserPlus,
    adminOnly: true,
  },
];

export function TeamSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  
  const metadata = user?.publicMetadata as { role?: string } | undefined;
  const isAdmin = metadata?.role?.toLowerCase() === 'admin';

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const NavLink = ({ href, icon: Icon, label, exact }: { href: string; icon: any; label: string; exact?: boolean }) => (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        isActive(href, exact)
          ? 'bg-[var(--purple)] text-white shadow-md shadow-[var(--purple)]/25'
          : 'text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );

  return (
    <aside className="w-64 flex-shrink-0 border-r border-gray-200/50 dark:border-white/5 bg-white/50 dark:bg-white/[0.02] backdrop-blur-sm">
      <div className="sticky top-16 p-4 space-y-6 h-[calc(100vh-4rem)] overflow-y-auto">
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
          <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider">
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
            <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider">
              Team Management
            </h3>
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
