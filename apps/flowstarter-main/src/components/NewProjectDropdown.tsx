'use client';

import { NewProjectMenuContent } from '@/components/NewProjectMenuContent';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslations } from '@/lib/i18n';
import { ChevronDown, PlusCircle } from 'lucide-react';

interface NewProjectDropdownProps {
  variant?: 'button' | 'card';
  className?: string;
  buttonClassName?: string;
  children?: React.ReactNode; // For card variant - card content
  align?: 'start' | 'end'; // Alignment for dropdown menu
}

const DROPDOWN_CONTENT_CLASSES =
  'w-72 border border-black/5 dark:border-white/10 bg-white/50 dark:bg-white/[0.05] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.12)] cursor-pointer';

export function NewProjectDropdown({
  variant = 'button',
  className,
  buttonClassName,
  children,
  align,
}: NewProjectDropdownProps) {
  const { t } = useTranslations();

  // Determine alignment based on variant if not explicitly provided
  const menuAlign = align || (variant === 'card' ? 'start' : 'end');

  if (variant === 'card') {
    // For ActionCard - wrap children with dropdown
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className={className || 'h-full'}>{children}</div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={menuAlign}
          className={DROPDOWN_CONTENT_CLASSES}
          sideOffset={8}
        >
          <NewProjectMenuContent />
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Default button variant
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className={
            buttonClassName ||
            'gap-2 bg-gray-900 text-white hover:bg-gray-800 shadow-sm dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200'
          }
        >
          <PlusCircle className="h-4 w-4" />
          {t('nav.create')}
          <ChevronDown className="h-4 w-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={menuAlign}
        className={DROPDOWN_CONTENT_CLASSES}
        sideOffset={8}
      >
        <NewProjectMenuContent />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
