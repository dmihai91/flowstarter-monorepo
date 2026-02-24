'use client';
import { CustomUserButton } from '@/components/CustomUserButton';
import { NewProjectDropdown } from '@/components/NewProjectDropdown';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useIsTeamMember } from '@/hooks/useIsTeamMember';
import { DashboardMobileDropdown } from './MobileActionsDropdown';

export function DashboardNavControls() {
  const { isTeamMember } = useIsTeamMember();

  return (
    <nav className="flex gap-3 sm:gap-6 items-center">
      {/* Mobile actions dropdown */}
      <DashboardMobileDropdown />

      {/* Inline actions for >= sm */}
      <div className="hidden sm:flex items-center gap-3 sm:gap-6">
        {/* Show NewProjectDropdown only for team members */}
        {isTeamMember && (
          <>
            <NewProjectDropdown buttonClassName="flex items-center text-sm font-medium px-4 py-2.5 h-auto! gap-[8px] rounded-[12px] bg-[var(--Colors-Primary,#000)] text-white hover:bg-[var(--Colors-Primary,#000)]/90 dark:bg-[var(--Colors-Primary,#FFF)] dark:text-black dark:hover:bg-[var(--Colors-Primary,#FFF)]/90 shadow-sm" />
            <div className="hidden sm:block h-6 w-px bg-border mx-1" />
          </>
        )}
        <ThemeToggle className="inline-flex" />
      </div>
      {/* Profile button - show on mobile too */}
      <CustomUserButton />
    </nav>
  );
}
