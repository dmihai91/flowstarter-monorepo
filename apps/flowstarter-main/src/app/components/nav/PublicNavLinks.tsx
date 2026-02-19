'use client';
import { Button } from '@/components/ui/button';
import { CustomNavLink } from '@/components/ui/custom-nav-link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useTranslations } from '@/lib/i18n';
import { MoreVertical } from 'lucide-react';

export function PublicNavLinks() {
  const { t } = useTranslations();

  return (
    <>
      {/* Mobile navigation dropdown */}
      <div className="lg:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 rounded-xl px-0 border-gray-200 dark:border-white/40 bg-white/50 dark:bg-white/5 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-white/10 transition-all"
              aria-label="Navigation menu"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="min-w-44 bg-[rgba(243,243,243,0.95)] dark:bg-[rgba(58,58,74,0.95)] backdrop-blur-xl border-gray-200 dark:border-white/40"
            hideArrow
          >
            <DropdownMenuItem asChild>
              <CustomNavLink className="cursor-pointer" href="/#features">
                {t('nav.features')}
              </CustomNavLink>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <CustomNavLink className="cursor-pointer" href="/#pricing">
                {t('nav.pricing')}
              </CustomNavLink>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <CustomNavLink className="cursor-pointer" href="/#benefits">
                {t('nav.benefits')}
              </CustomNavLink>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <span className="inline-flex items-center gap-2">
                <ThemeToggle className="inline-flex" />
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop navigation links */}
      <CustomNavLink
        className="text-sm hidden lg:block font-medium underline-offset-4"
        href="/#features"
      >
        {t('nav.features')}
      </CustomNavLink>
      <CustomNavLink
        className="text-sm hidden lg:block font-medium underline-offset-4"
        href="/#pricing"
      >
        {t('nav.pricing')}
      </CustomNavLink>
      <CustomNavLink
        className="text-sm hidden lg:block font-medium underline-offset-4"
        href="/#benefits"
      >
        {t('nav.benefits')}
      </CustomNavLink>
    </>
  );
}
