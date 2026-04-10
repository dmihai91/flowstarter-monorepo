'use client';

import { Logo, ScrollAwareHeader } from '@flowstarter/flow-design-system';
import { useClerk, useUser } from '@clerk/nextjs';
import { useTranslations } from '@/lib/i18n';
import { LogOut, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface AppShellProps {
  flowstarterCodeUrl: string;
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  return email ? email[0].toUpperCase() : '?';
}

export function AppShell({ flowstarterCodeUrl }: AppShellProps) {
  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();
  const t = useTranslations();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = user?.fullName ?? user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ?? t('code.user.defaultName');
  const email = user?.emailAddresses?.[0]?.emailAddress ?? null;
  const initials = getInitials(user?.fullName, email);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [menuOpen]);

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#101014]">
      <ScrollAwareHeader
        className="z-[100] h-14"
        transparentClass="bg-[#101014] border-b border-white/[0.04]"
        scrolledClass="bg-[#101014]/80 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/[0.06]"
      >
        <div className="w-full h-full px-4 lg:px-6 flex items-center justify-between">
          {/* Left: brand */}
          <div className="flex items-center gap-3">
            <span className="sm:hidden"><Logo size="sm" /></span>
            <span className="hidden sm:block"><Logo size="md" /></span>
            <span className="px-2 py-0.5 text-[0.625rem] font-medium bg-[var(--purple)]/10 text-[var(--purple)] rounded-full hidden sm:block">
              {t('code.app.badge')}
            </span>
          </div>

          {/* Right: user menu */}
          <div className="flex items-center gap-2">
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="flex items-center gap-2.5 pl-1 pr-2 py-1
                           rounded-lg hover:bg-white/[0.05]
                           transition-colors duration-150 group"
              >
                {!isLoaded ? (
                  <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
                ) : user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={displayName}
                    className="w-8 h-8 rounded-full border-2 border-white/20 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center
                                  text-xs font-bold text-white select-none shrink-0
                                  bg-gradient-to-br from-[var(--purple)] to-blue-500
                                  border-2 border-white/20">
                    {initials}
                  </div>
                )}
                <span className="hidden sm:block text-sm font-medium text-white/70
                                 group-hover:text-white/90 transition-colors max-w-[140px] truncate">
                  {displayName}
                </span>
                <ChevronDown className={`hidden sm:block w-3.5 h-3.5 text-white/30
                                         transition-transform duration-200
                                         ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-60
                                rounded-xl border border-white/[0.08]
                                bg-[#1a1a22]/95 backdrop-blur-xl
                                shadow-[0_8px_32px_rgba(0,0,0,0.4)]
                                overflow-hidden z-50
                                animate-in fade-in slide-in-from-top-1 duration-150">
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      {user?.imageUrl ? (
                        <img
                          src={user.imageUrl}
                          alt={displayName}
                          className="w-10 h-10 rounded-full border-2 border-white/20 object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full border-2 border-white/20 bg-gradient-to-br from-[var(--purple)] to-blue-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {user?.fullName ?? displayName}
                        </p>
                        {email && (
                          <p className="text-xs text-white/40 truncate">
                            {email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-1.5">
                    <button
                      onClick={() =>
                        signOut({
                          redirectUrl: `${window.location.origin}`,
                        })
                      }
                      className="w-full flex items-center gap-2.5 px-3 py-2
                                 text-sm text-red-400/80 hover:text-red-400
                                 hover:bg-white/[0.05] rounded-lg
                                 transition-colors duration-150"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      {t('code.user.signOut')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollAwareHeader>

      {/* Spacer for fixed header */}
      <div className="h-14 shrink-0" />

      {/* T3 Code */}
      <main className="flex-1 relative">
        <iframe
          src={flowstarterCodeUrl}
          title={t('code.app.iframeTitle')}
          className="absolute inset-0 w-full h-full border-0"
          allow="clipboard-read; clipboard-write; microphone; camera; fullscreen"
        />
      </main>
    </div>
  );
}
