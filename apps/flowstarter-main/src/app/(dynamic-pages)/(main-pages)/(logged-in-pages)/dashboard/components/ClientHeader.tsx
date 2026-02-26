'use client';

import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ClientHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/80 dark:bg-[#0a0a0c]/90 backdrop-blur-xl border-b border-black/[0.08] dark:border-white/[0.08]">
      <div className="max-w-[1200px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--purple)] to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[var(--purple)]/20">
            F
          </div>
          <span className="font-semibold text-gray-900 dark:text-white text-lg">
            Flowstarter
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Theme toggle (3-button) */}
          <ThemeToggle />

          {/* Support */}
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 text-gray-500 hover:text-gray-900 dark:text-white/50 dark:hover:text-white"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>

          {/* User menu */}
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: 'w-9 h-9 ring-2 ring-white/20 dark:ring-white/10',
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
