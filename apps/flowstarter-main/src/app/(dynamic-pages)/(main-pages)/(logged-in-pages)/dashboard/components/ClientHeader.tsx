'use client';
import { ScrollAwareHeader } from '@flowstarter/flow-design-system';


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
    <ScrollAwareHeader className="z-[100] h-16 border-b border-gray-200/30 dark:border-white/10" transparentClass="bg-white/30 dark:bg-[#0a0a0c]/30 backdrop-blur-xl" scrolledClass="bg-white/60 dark:bg-[#0a0a0c]/60 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
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
            <><span className="sm:hidden"><Logo size="sm" /></span><span className="hidden sm:block"><Logo size="md" /></span></>
          </Link>
        )}

        {/* Right side - Theme switcher + User profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
          {/* Theme toggle - hidden on phone */}
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          <div className="w-px h-6 bg-gray-200 dark:bg-white/10 hidden sm:block" />

          {/* Support */}
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 sm:w-9 sm:h-9 text-gray-500 hover:text-gray-900 dark:text-white/50 dark:hover:text-white"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>

          {/* Custom User menu */}
          <ClientUserMenu />
        </div>
      </div>
    </ScrollAwareHeader>
  );
}
