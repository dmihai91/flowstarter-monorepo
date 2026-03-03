'use client';

import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { useAuth, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LayoutDashboard, LogOut, User } from 'lucide-react';
import { useClerk } from '@clerk/nextjs';

export function SupportHeader() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <header className="sticky top-0 z-50 bg-white/55 dark:bg-[#0a0a0c]/50 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/60 dark:border-white/10 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center shrink-0">
          <Logo size="md" />
        </Link>
        
        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          
          {isLoaded && isSignedIn && user && (
            <>
              <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-white/10" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden ring-2 ring-white/50 dark:ring-white/10 hover:ring-[var(--purple)]/30 transition-all shrink-0">
                    {user.imageUrl ? (
                      <Image
                        src={user.imageUrl}
                        alt={user.firstName || 'User'}
                        width={36}
                        height={36}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[var(--purple)]/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-[var(--purple)]" />
                      </div>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-white/10">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-white/50 truncate">
                      {user.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ redirectUrl: '/' })}
                    className="text-red-600 dark:text-red-400 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          
          {isLoaded && !isSignedIn && (
            <Link href="/login">
              <Button variant="outline" size="sm" className="rounded-lg text-xs sm:text-sm">
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
