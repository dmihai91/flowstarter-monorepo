'use client';
import { ScrollAwareHeader } from '@flowstarter/flow-design-system';


import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Logo } from '@/components/ui/logo';
import { ArrowLeft, MessageSquare, Menu } from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';
import { Button } from '@/components/ui/button';
import { ClientUserMenu } from './ClientUserMenu';

export function ClientHeader() {
  const pathname = usePathname();
  const { setIsMobileOpen } = useSidebar();
  const isWizardPage = pathname?.startsWith('/dashboard/new') || pathname?.startsWith('/wizard');

  return (
    <ScrollAwareHeader className="z-[100] h-16 border-b border-gray-200/30 dark:border-white/10" transparentClass="bg-white/95 dark:bg-[#12121a]/90 backdrop-blur-sm border-b border-gray-200/40 dark:border-white/10" scrolledClass="bg-white/60 dark:bg-[#12121a]/85 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_1px_2px_rgba(0,0,0,0.03)] border-b border-gray-200/30 dark:border-white/10">
      <div className="w-full h-full px-4 lg:px-6 flex items-center justify-between">
        {/* Left side - hamburger + logo */}
        <div className="flex items-center gap-2">
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setIsMobileOpen(true)}
            className="md:hidden p-1.5 -ml-1 rounded-lg text-gray-500 hover:text-gray-900 dark:text-white/50 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-white/5 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

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
        </div>

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
