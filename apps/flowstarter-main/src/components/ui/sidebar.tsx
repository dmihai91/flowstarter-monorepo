'use client';

import { FeedbackDialog } from '@/components/FeedbackDialog';
import { useSidebar } from '@/contexts/SidebarContext';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import {
  FileText,
  LayoutDashboard,
  MessageSquare,
  Puzzle,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface SidebarItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
}

interface SidebarLinkProps {
  href?: string;
  isActive?: boolean;
  shouldExpand: boolean;
  icon: LucideIcon;
  title: string;
  onClick?: () => void;
  type?: 'link' | 'button';
}

function SidebarLink({
  href,
  isActive = false,
  shouldExpand,
  icon: Icon,
  title,
  onClick,
  type = 'link',
}: SidebarLinkProps) {
  const content = (
    <>
      <div
        className={cn(
          'flex items-center transition-all duration-300 ease-out',
          shouldExpand ? 'justify-start shrink-0' : 'justify-center w-full',
          isActive
            ? 'text-white dark:text-gray-900'
            : 'text-slate-500 group-hover:text-[#4d5dd9] dark:text-slate-400 dark:group-hover:text-[#a5b4f5]'
        )}
      >
        <Icon
          className={shouldExpand ? 'h-5 w-5' : 'h-4 w-4'}
          strokeWidth={2}
        />
      </div>
      <span
        className={cn(
          'font-semibold text-sm transition-all duration-300 ease-out truncate overflow-hidden',
          shouldExpand ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0',
          isActive
            ? 'text-white dark:text-gray-900'
            : 'text-slate-800 dark:text-slate-200 group-hover:text-[#4d5dd9] dark:group-hover:text-[#a5b4f5]'
        )}
      >
        {title}
      </span>
    </>
  );

  const className = cn(
    'flex items-center rounded-xl transition-all duration-300 ease-out group relative',
    'hover:bg-[#4d5dd9]/8 dark:hover:bg-[#4d5dd9]/12',
    shouldExpand
      ? 'gap-3 pl-3 pr-4 py-3 w-full'
      : 'justify-center w-12 h-12 gap-0 mx-auto',
    isActive &&
      (shouldExpand
        ? 'bg-gray-950 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-900 dark:hover:bg-gray-50 shadow-lg shadow-gray-950/30 dark:shadow-white/10 ring-2 ring-gray-950/10 dark:ring-white/10'
        : 'bg-gray-950 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-900 dark:hover:bg-gray-50 shadow-lg shadow-gray-950/30 dark:shadow-white/10 ring-2 ring-gray-950/10 dark:ring-white/10'),
    type === 'button' && shouldExpand && 'w-full'
  );

  if (type === 'button') {
    return (
      <button
        onClick={onClick}
        className={className}
        title={!shouldExpand ? title : undefined}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={href!}
      onClick={onClick}
      className={className}
      title={!shouldExpand ? title : undefined}
    >
      {content}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();
  const { t } = useTranslations();

  // Start collapsed by default like Supabase
  const [isHovered, setIsHovered] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  // On mobile, always expand when opened; on desktop, respect hover state
  const shouldExpand = isMobileOpen || !isCollapsed || isHovered;

  const sidebarItems: SidebarItem[] = [
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
    {
      title: t('sidebar.helpGuide'),
      href: '/help',
      icon: FileText,
    },
  ];

  return (
    <>
      {/* Mobile Overlay - Glassmorphism effect */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/10 dark:bg-black/20 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300 ease-out"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          // Shared shell styles
          'fixed left-0 top-16 bottom-0 flex flex-col backdrop-blur-xl border-r border-black/5 dark:border-white/10 glass-shadow-shell z-40',
          // Mobile: smooth slide-in transition from left to right with custom ease curve
          'transition-[transform,opacity] duration-350 ease-in-out',
          isMobileOpen
            ? 'translate-x-0 opacity-100'
            : '-translate-x-full opacity-0 lg:opacity-100',
          // Desktop: always visible
          'lg:translate-x-0',
          // Expanded vs collapsed layout - smooth transition for hover expansion only
          // Using preferred glass backgrounds: rgba(243, 243, 243, 0.30) for light and rgba(58, 58, 74, 0.30) for dark
          shouldExpand
            ? 'items-start px-4 pt-6 pb-4 w-[240px] bg-[rgba(243,243,243,0.30)] dark:bg-[rgba(58,58,74,0.30)] transition-[width,padding] duration-300 ease-out'
            : 'items-center px-0 pt-6 pb-4 w-16 bg-[rgba(243,243,243,0.30)] dark:bg-[rgba(58,58,74,0.30)] transition-[width,padding] duration-300 ease-out'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Navigation Items */}
        <nav
          className={cn(
            'flex-1 w-full overflow-y-auto flex flex-col',
            shouldExpand ? 'space-y-2' : 'space-y-3 items-center'
          )}
        >
          {sidebarItems.map((item) => {
            // Remove hash from href for comparison
            const itemPath = item.href.split('#')[0];
            // Special handling for dashboard: active for /dashboard and /dashboard/new but not other sub-routes
            const isActive =
              itemPath === '/dashboard'
                ? pathname === '/dashboard' ||
                  pathname?.startsWith('/dashboard/new')
                : pathname === itemPath || pathname?.startsWith(itemPath);

            return (
              <SidebarLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                title={item.title}
                isActive={isActive}
                shouldExpand={shouldExpand}
                onClick={() => setIsMobileOpen(false)}
              />
            );
          })}
        </nav>

        {/* Footer Section */}
        <div
          className={cn(
            'shrink-0 w-full border-t transition-[padding,border-color,justify] duration-300 ease-out flex',
            shouldExpand
              ? 'pt-4 border-gray-200/70 dark:border-gray-700/60'
              : 'pt-3 border-gray-200/50 dark:border-gray-700/50 justify-center'
          )}
        >
          <SidebarLink
            type="button"
            icon={MessageSquare}
            title={t('sidebar.feedback')}
            shouldExpand={shouldExpand}
            onClick={() => setIsFeedbackOpen(true)}
          />
        </div>
      </aside>

      <FeedbackDialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen} />
    </>
  );
}
