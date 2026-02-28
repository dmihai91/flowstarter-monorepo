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
import { useClerk, useUser } from '@clerk/nextjs';
import { LogOut, Settings, User } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function ClientUserMenu() {
  const [mounted, setMounted] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const { signOut } = useClerk();
  const { user } = useUser();
  const router = useRouter();

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
    router.push('/');
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
              alt={user.fullName || 'User'}
              width={36}
              height={36}
              className="h-9 w-9 rounded-full border-2 border-gray-200 dark:border-white/20 object-cover"
            />
          ) : (
            <div className="h-9 w-9 rounded-full border-2 border-gray-200 dark:border-white/20 bg-gradient-to-br from-[var(--purple)] to-blue-500 flex items-center justify-center text-white text-sm font-semibold">
              {getInitials()}
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="min-w-56 bg-white/95 dark:bg-[rgba(58,58,74,0.95)] backdrop-blur-xl border-gray-200 dark:border-white/20"
      >
        {/* Profile Header */}
        <div className="px-3 py-3 border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            {user.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt={user.fullName || 'User'}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full border-2 border-gray-200 dark:border-white/20 object-cover shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-full border-2 border-gray-200 dark:border-white/20 bg-gradient-to-br from-[var(--purple)] to-blue-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                {getInitials()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user.fullName || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user.emailAddresses?.[0]?.emailAddress}
              </p>
            </div>
          </div>
        </div>

        <DropdownMenuItem onSelect={() => router.push('/profile')}>
          <User className="h-4 w-4" />
          Profile
        </DropdownMenuItem>

        <DropdownMenuItem onSelect={() => router.push('/dashboard/integrations')}>
          <Settings className="h-4 w-4" />
          Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-gray-200 dark:bg-white/10" />

        <DropdownMenuItem
          onClick={() => setShowSignOutDialog(true)}
          className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    {/* Sign out confirmation dialog */}
    <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
      <AlertDialogContent className="bg-white dark:bg-[#1a1a1f] border-gray-200 dark:border-white/10">
        <AlertDialogHeader>
          <AlertDialogTitle>Sign out?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to sign out of your account?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-gray-200 dark:border-white/10">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSignOut}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Sign out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
