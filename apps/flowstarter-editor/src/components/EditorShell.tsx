'use client';

import { useUser, useClerk } from '@clerk/nextjs';
import { LogOut, ChevronDown, ExternalLink } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface EditorShellProps {
  projectId: string;
  t3Url: string;
  mode: 'editor' | 'client';
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

export function EditorShell({ projectId, t3Url, mode }: EditorShellProps) {
  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = user?.fullName ?? user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ?? 'User';
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

  const isClient = mode === 'client';

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#101014]">
      {/* Header */}
      <header className="shrink-0 sticky top-0 z-50 flex items-center justify-between
                         px-4 lg:px-6 h-14
                         border-b border-white/[0.04]
                         bg-[#101014]">
        {/* Left: brand + project */}
        <div className="flex items-center gap-3">
          <div
            className="h-7 w-7 rounded-md flex items-center justify-center text-white font-bold text-xs"
            style={{
              backgroundImage: 'linear-gradient(135deg, #4D5DD9 0%, #8B5CF6 100%)',
            }}
          >
            F
          </div>
          <span className="text-sm font-medium text-white/70">
            {isClient ? 'Edit my site' : 'Flowstarter Editor'}
          </span>
          {!isClient && (
            <span className="px-2 py-0.5 text-[0.6rem] font-medium bg-[var(--purple,#8B5CF6)]/10 text-[#8B5CF6] rounded-full">
              Editor
            </span>
          )}
        </div>

        {/* Right: user menu */}
        <div className="flex items-center gap-2">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="flex items-center gap-2 pl-1 pr-2 py-1
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
                                bg-gradient-to-br from-[#4D5DD9] to-[#8B5CF6]
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
              <div className="absolute right-0 top-full mt-2 w-56
                              rounded-xl border border-white/[0.08]
                              bg-[#1a1a22]/95 backdrop-blur-xl
                              shadow-[0_8px_32px_rgba(0,0,0,0.4)]
                              overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.fullName ?? displayName}
                  </p>
                  {email && (
                    <p className="text-xs text-white/40 truncate mt-0.5">{email}</p>
                  )}
                </div>
                <div className="p-1.5">
                  <button
                    onClick={() => signOut({ redirectUrl: window.location.origin })}
                    className="w-full flex items-center gap-2.5 px-3 py-2
                               text-sm text-red-400/80 hover:text-red-400
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
        </div>
      </header>

      {/* T3 Code iframe */}
      <main className="flex-1 relative">
        <iframe
          src={t3Url}
          title="Flowstarter Editor"
          className="absolute inset-0 w-full h-full border-0"
          allow="clipboard-read; clipboard-write; microphone; camera; fullscreen"
        />
      </main>
    </div>
  );
}
