'use client';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslations } from '@/lib/i18n';
import { useClerk, useUser } from '@clerk/nextjs';
import { LogOut, User } from 'lucide-react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getInitials } from '@/lib/user-utils';

export function UserMenu() {
  const [mounted, setMounted] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const { signOut } = useClerk();
  const { user } = useUser();
  const { t } = useTranslations();
  const router = useRouter();
  const pathname = usePathname();

  const isTeam = pathname?.startsWith('/admin');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !user) {
    return (
      <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
    );
  }

  const handleSignOut = async () => {
    await signOut();
    router.push(isTeam ? '/admin/login' : '/');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-9 w-9 rounded-full p-0 hover:opacity-90 transition-opacity focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            {user.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt={user.fullName || t('app.userFallback')}
                width={36}
                height={36}
                className="h-9 w-9 rounded-full border-2 border-gray-200 dark:border-white/20 object-cover"
              />
            ) : (
              <div className="h-9 w-9 rounded-full border-2 border-gray-200 dark:border-white/20 bg-gradient-to-br from-[var(--purple)] to-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                {getInitials(user)}
              </div>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="min-w-56">
          {/* Profile Header */}
          <div className="px-3 py-3 border-b border-[var(--fs-rule)]">
            <div className="flex items-center gap-3">
              {user.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt={user.fullName || t('app.userFallback')}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full border-2 border-gray-200 dark:border-white/20 object-cover shrink-0"
                />
              ) : (
                <div className="h-10 w-10 rounded-full border-2 border-gray-200 dark:border-white/20 bg-gradient-to-br from-[var(--purple)] to-blue-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                  {getInitials(user)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--fs-ink)] truncate">
                  {user.fullName || (isTeam ? 'Team Member' : 'User')}
                </p>
                <p className="text-xs text-[var(--fs-ink-faint)] truncate">
                  {user.emailAddresses?.[0]?.emailAddress}
                </p>
              </div>
            </div>
          </div>

          {isTeam ? (
            <>
              <DropdownMenuItem
                onSelect={() => router.push('/admin/dashboard/profile')}
              >
                <User className="h-4 w-4" />
                {t('app.profile')}
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem onSelect={() => router.push('/profile')}>
                <User className="h-4 w-4" />
                {t('app.profile')}
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator className="bg-gray-200 dark:bg-white/10" />

          <DropdownMenuItem
            onClick={() => setShowSignOutDialog(true)}
            variant="destructive"
          >
            <LogOut className="h-4 w-4" />
            {t('app.signOut')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <AlertDialogContent className="bg-white dark:bg-[var(--glass-surface)] border-[var(--fs-rule)]">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('app.sigOutTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('app.signOutDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[var(--fs-rule)]">
              {t('app.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSignOut} variant="destructive">
              {t('app.signOut')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
