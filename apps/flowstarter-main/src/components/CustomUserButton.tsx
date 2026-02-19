'use client';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslations } from '@/lib/i18n';
import { useProjectAIStore } from '@/store/ai-suggestions-store';
import { useDraftStore } from '@/store/draft-store';
import { initialProjectConfig, useWizardStore } from '@/store/wizard-store';
import { useClerk, useUser } from '@clerk/nextjs';
import { LogOut, Settings } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface CustomUserButtonProps {
  className?: string;
}

export const CustomUserButton = ({ className }: CustomUserButtonProps) => {
  const [mounted, setMounted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { signOut, openUserProfile } = useClerk();
  const { user } = useUser();
  const { t } = useTranslations();
  const { reset: resetDraft } = useDraftStore();
  const { reset: resetAI } = useProjectAIStore();
  const { reset: resetWizard } = useWizardStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration issues by using consistent initial render
  if (!mounted || !user) {
    return (
      <div
        className={`w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 border-[3px] border-gray-900 dark:border-white ${
          className || ''
        }`}
      />
    );
  }

  const resetAllStores = () => {
    resetDraft();
    resetAI();
    resetWizard(initialProjectConfig);
  };

  const getInitials = () => {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) return firstName[0].toUpperCase();
    if (user.emailAddresses?.[0]?.emailAddress) {
      return user.emailAddresses[0].emailAddress[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-10 w-10 rounded-full p-0 hover:opacity-90 transition-opacity focus-visible:ring-0 focus-visible:ring-offset-0 mt-1"
          >
            {user.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt={user.fullName || 'User'}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full border-[3px] border-gray-900 dark:border-white object-cover shadow-sm"
              />
            ) : (
              <div className="h-10 w-10 rounded-full border-[3px] border-gray-900 dark:border-white bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                {getInitials()}
              </div>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="min-w-56 bg-[rgba(243,243,243,0.95)] dark:bg-[rgba(58,58,74,0.95)] backdrop-blur-xl border-gray-200 dark:border-white/40"
        >
          {/* Profile Header with Picture - Mobile */}
          <div className="sm:hidden px-4 py-3 border-b border-gray-200 dark:border-white/40 flex items-center gap-3">
            {user.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt={user.fullName || 'User'}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full border-[3px] border-gray-900 dark:border-white object-cover shadow-sm flex-shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-full border-[3px] border-gray-900 dark:border-white bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm flex-shrink-0">
                {getInitials()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user.fullName || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user.emailAddresses?.[0]?.emailAddress}
              </p>
            </div>
          </div>
          {/* Profile Header - Desktop */}
          <div className="hidden sm:block px-2 py-3 border-b border-gray-200 dark:border-white/40">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {user.fullName || 'User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user.emailAddresses?.[0]?.emailAddress}
            </p>
          </div>
          <DropdownMenuItem onClick={() => openUserProfile()}>
            <Settings className="h-4 w-4" />
            Manage Account
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-gray-200 dark:bg-white/20" />
          <DropdownMenuItem
            onClick={() => setConfirmOpen(true)}
            className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/20"
          >
            <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
            <span className="text-red-600 dark:text-red-400">
              {t('app.signOut')}
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChangeAction={setConfirmOpen}
        title={t('app.sigOutTitle')}
        description={t('app.signOutDescription')}
        cancelLabel={t('app.cancel')}
        confirmLabel={t('app.signOut')}
        confirmVariant="destructive"
        onConfirmAction={() => {
          setConfirmOpen(false);
          resetAllStores();
          queueMicrotask(() => signOut());
        }}
      />
    </div>
  );
};
