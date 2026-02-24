'use client';

import { FeedbackDialog } from '@/components/FeedbackDialog';
import { useSidebar } from '@/contexts/SidebarContext';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import {
  Calendar,
  HelpCircle,
  LayoutDashboard,
  MessageSquare,
  Puzzle,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const CALENDLY_URL = 'https://calendly.com/flowstarter-app/discovery';

interface SidebarItem {
  title: string;
  href: string;
  icon: LucideIcon;
  external?: boolean;
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
  external?: boolean;
}

function SidebarLink({
  href,
  isActive = false,
  shouldExpand,
  icon: Icon,
  title,
  onClick,
  type = 'link',
  external = false,
}: SidebarLinkProps) {
  const content = (
    <>
      <div
        className={cn(
          'flex items-center transition-all duration-300 ease-out',
          shouldExpand ? 'justify-start shrink-0' : 'justify-center w-full',
          isActive
            ? 'text-white'
            : 'text-gray-500 group-hover:text-[var(--purple)] dark:text-gray-400 dark:group-hover:text-[var(--purple)]'
        )}
      >
        <Icon
          className={shouldExpand ? 'h-5 w-5' : 'h-4 w-4'}
          strokeWidth={2}
        />
      </div>
      <span
        className={cn(
          'font-medium text-sm transition-all duration-300 ease-out truncate overflow-hidden',
          shouldExpand ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0',
          isActive
            ? 'text-white'
            : 'text-gray-700 dark:text-gray-200 group-hover:text-[var(--purple)] dark:group-hover:text-[var(--purple)]'
        )}
      >
        {title}
      </span>
    </>
  );

  const className = cn(
    'flex items-center rounded-xl transition-all duration-300 ease-out group relative',
    'hover:bg-[var(--purple)]/10 dark:hover:bg-[var(--purple)]/15',
    shouldExpand
      ? 'gap-3 pl-3 pr-4 py-3 w-full'
      : 'justify-center w-12 h-12 gap-0 mx-auto',
    isActive &&
      'bg-[var(--purple)] text-white shadow-lg shadow-[var(--purple)]/30 ring-1 ring-[var(--purple)]/20'
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

  if (external) {
    return (
      <a
        href={href!}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className={className}
        title={!shouldExpand ? title : undefined}
      >
        {content}
      </a>
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

  const [isHovered, setIsHovered] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const shouldExpand = isMobileOpen || !isCollapsed || isHovered;

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

  const secondaryItems: SidebarItem[] = [
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

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300 ease-out"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 bottom-0 flex flex-col backdrop-blur-xl border-r border-gray-200/50 dark:border-white/10 z-40',
          'transition-[transform,opacity] duration-350 ease-in-out',
          isMobileOpen
            ? 'translate-x-0 opacity-100'
            : '-translate-x-full opacity-0 lg:opacity-100',
          'lg:translate-x-0',
          shouldExpand
            ? 'items-start px-4 pt-6 pb-4 w-[240px] bg-white/60 dark:bg-[rgba(58,58,74,0.40)] transition-[width,padding] duration-300 ease-out'
            : 'items-center px-0 pt-6 pb-4 w-16 bg-white/60 dark:bg-[rgba(58,58,74,0.40)] transition-[width,padding] duration-300 ease-out'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Main Navigation */}
        <nav
          className={cn(
            'w-full flex flex-col',
            shouldExpand ? 'space-y-1' : 'space-y-2 items-center'
          )}
        >
          {shouldExpand && (
            <p className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Main
            </p>
          )}
          {mainItems.map((item) => {
            const itemPath = item.href.split('#')[0];
            const isActive =
              itemPath === '/dashboard'
                ? pathname === '/dashboard' ||
                  pathname?.startsWith('/dashboard/new') ||
                  pathname?.startsWith('/dashboard/projects')
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

        {/* Secondary Navigation */}
        <nav
          className={cn(
            'w-full flex flex-col mt-6',
            shouldExpand ? 'space-y-1' : 'space-y-2 items-center'
          )}
        >
          {shouldExpand && (
            <p className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Support
            </p>
          )}
          {secondaryItems.map((item) => {
            const itemPath = item.href.split('#')[0];
            const isActive = !item.external && (pathname === itemPath || pathname?.startsWith(itemPath));

            return (
              <SidebarLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                title={item.title}
                isActive={isActive}
                shouldExpand={shouldExpand}
                external={item.external}
                onClick={() => setIsMobileOpen(false)}
              />
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer Section */}
        <div
          className={cn(
            'shrink-0 w-full border-t transition-[padding,border-color] duration-300 ease-out',
            shouldExpand
              ? 'pt-4 border-gray-200/70 dark:border-white/10'
              : 'pt-3 border-gray-200/50 dark:border-white/5 flex justify-center'
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
