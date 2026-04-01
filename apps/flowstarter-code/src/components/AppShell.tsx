'use client';

import { Logo } from '@flowstarter/flow-design-system';
import { signOut } from 'next-auth/react';
import { LogOut, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface AppShellUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface AppShellProps {
  user: AppShellUser;
  t3ChatUrl: string;
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

export function AppShell({ user, t3ChatUrl }: AppShellProps) {
  const initials  = getInitials(user.name, user.email);
  const displayName = user.name ?? user.email?.split('@')[0] ?? 'User';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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
    <div className="flex flex-col min-h-screen w-full bg-[#0a0810]">
      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="shrink-0 sticky top-0 z-50 flex items-center justify-between
                         px-4 sm:px-5 h-12
                         border-b border-white/[0.06]
                         bg-[#07070a]/90 backdrop-blur-xl">
        {/* Left: brand */}
        <div className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="px-2 py-0.5 text-[0.625rem] font-semibold tracking-wide
                           bg-[var(--violet)]/10 text-[var(--violet)] rounded-full
                           border border-[var(--violet)]/20 select-none">
            Code
          </span>
        </div>

        {/* Right: user menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="flex items-center gap-2.5 pl-1.5 pr-2 py-1
                       rounded-lg hover:bg-white/[0.05]
                       transition-colors duration-150 group"
          >
            {/* Avatar */}
            <div className="w-7 h-7 rounded-full flex items-center justify-center
                            text-[0.625rem] font-bold text-white select-none shrink-0
                            bg-gradient-to-br from-[#4D5DD9] to-[#8B5CF6]
                            ring-1 ring-white/10">
              {initials}
            </div>
            {/* Name */}
            <span className="hidden sm:block text-sm font-medium text-white/70
                             group-hover:text-white/90 transition-colors max-w-[140px] truncate">
              {displayName}
            </span>
            <ChevronDown className={`hidden sm:block w-3.5 h-3.5 text-white/30
                                     transition-transform duration-200
                                     ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56
                            rounded-xl border border-white/[0.08]
                            bg-[#111118]/95 backdrop-blur-xl
                            shadow-[0_8px_32px_rgba(0,0,0,0.4)]
                            overflow-hidden z-50
                            animate-in fade-in slide-in-from-top-1 duration-150">
              {/* User info */}
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <p className="text-sm font-semibold text-white truncate">
                  {user.name ?? displayName}
                </p>
                {user.email && (
                  <p className="text-xs text-white/40 truncate mt-0.5">
                    {user.email}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="p-1.5">
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full flex items-center gap-2.5 px-3 py-2
                             text-sm text-white/60 hover:text-white
                             hover:bg-white/[0.05] rounded-lg
                             transition-colors duration-150"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── T3 Chat iframe ────────────────────────────────────────── */}
      <main className="flex-1 relative">
        <iframe
          src={t3ChatUrl}
          title="Flowstarter Code — T3 Chat"
          className="absolute inset-0 w-full h-full border-0"
          allow="clipboard-read; clipboard-write; microphone; camera; fullscreen"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups
                   allow-popups-to-escape-sandbox allow-modals allow-downloads"
        />
      </main>
    </div>
  );
}
