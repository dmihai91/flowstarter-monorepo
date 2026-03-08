'use client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MagicWandIcon } from '@/components/ui/magic-wand-icon';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useIsTeamMember } from '@/hooks/useIsTeamMember';
import { useTranslations } from '@/lib/i18n';
import { MoreVertical } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export function DashboardMobileDropdown() {
  const { t } = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const { isTeamMember } = useIsTeamMember();

  return (
    <div className="sm:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 rounded-xl px-0 border-gray-200 dark:border-white/40 bg-white/55 dark:bg-white/5 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-white/10 transition-all"
            aria-label="More actions"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={12}
          className="min-w-56 rounded-xl bg-[rgba(243,243,243,0.95)] dark:bg-[rgba(58,58,74,0.95)] backdrop-blur-xl border-gray-200 dark:border-white/40"
        >
          {/* Project Creation Options - Team members only */}
          {isTeamMember && (
            <>
              <DropdownMenuItem
                onClick={() => {
                  // If on dashboard, scroll to the assistant section
                  if (pathname === '/dashboard') {
                    const assistantElement = document.getElementById(
                      'flowstarter-assistant'
                    );
                    if (assistantElement) {
                      assistantElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                      });
                    }
                  } else {
                    router.push('/dashboard#flowstarter-assistant');
                  }
                }}
                className="flex items-start gap-3 p-4 cursor-pointer"
              >
                <MagicWandIcon className="h-5 w-5 text-[var(--purple)] mt-0.5 flex-shrink-0" />
                <div className="flex-1 cursor-pointer min-w-0">
                  <div className="font-semibold text-sm mb-1">
                    {t('newProject.dropdown.ai.title')}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {t('newProject.dropdown.ai.description')}
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {/* Theme Toggle - Centered */}
          <div className="flex justify-center py-2">
            <ThemeToggle className="inline-flex" />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
