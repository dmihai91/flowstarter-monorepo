'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Logo } from '@/components/ui/logo';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClientUserMenu } from './ClientUserMenu';

export function ClientHeader() {
  const pathname = usePathname();
  const isWizardPage = pathname?.startsWith('/dashboard/new') || pathname?.startsWith('/wizard');

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] h-16 bg-white/20 dark:bg-[#0a0a0c]/20 backdrop-blur-md border-b border-white/30 dark:border-white/5">
      <div className="w-full h-full px-4 lg:px-6 flex items-center justify-between">
        {/* Logo or Back button */}
        {isWizardPage ? (
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </Link>
        ) : (
          <Link href="/dashboard" className="group">
            <Logo size="md" />
          </Link>
        )}

        {/* Right side - Theme switcher + User profile */}
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Theme toggle */}
          <ThemeToggle />

          <div className="w-px h-6 bg-gray-200 dark:bg-white/10 hidden sm:block" />

          {/* Support */}
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 text-gray-500 hover:text-gray-900 dark:text-white/50 dark:hover:text-white"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>

          {/* Custom User menu */}
          <ClientUserMenu />
        </div>
      </div>
    </header>
  );
}
