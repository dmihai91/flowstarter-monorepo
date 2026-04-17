'use client';

import {
  Logo,
  ThemeToggle,
  initTheme,
  setTheme,
  applyTheme,
  type Theme,
} from '@flowstarter/flow-design-system';
import { useClerk, useUser } from '@clerk/nextjs';
import { useTranslations } from '@/lib/i18n';
import { LogOut, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  return email ? email[0].toUpperCase() : '?';
}

interface CodeHeaderProps {
  /** Show user menu (profile pic + sign out). False on login page. */
  showUser?: boolean;
}

export function CodeHeader({ showUser = false }: CodeHeaderProps) {
  const t = useTranslations();
  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();

  const [theme, setThemeState] = useState<Theme>('system');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName =
    user?.fullName ??
    user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ??
    t('code.user.defaultName');
  const email = user?.emailAddresses?.[0]?.emailAddress ?? null;
  const initials = getInitials(user?.fullName, email);

  useEffect(() => {
    const resolved = initTheme();
    setThemeState(resolved);
  }, []);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [menuOpen]);

  async function handleSignOut() {
    // Revoke the current user's T3 client session server-side before Clerk
    // tears down the wrapper session. Silently ignore failures — Clerk
    // sign-out still proceeds so the user isn't stuck.
    try {
      await fetch('/api/internal/t3-revoke', {
        method: 'POST',
        credentials: 'include',
        keepalive: true,
      });
    } catch {
      // no-op
    }
    signOut({ redirectUrl: `${window.location.origin}` });
  }

  function handleThemeChange(next: Theme, event?: React.MouseEvent) {
    const resolved = next === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : next;

    const doApply = () => {
      setTheme(next);
      applyTheme(next);
      setThemeState(next);
    };

    // Ink-spread animation from click origin
    if (event) {
      const { clientX: x, clientY: y } = event;
      const maxDist = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );
      const diameter = maxDist * 2;

      const ink = document.createElement('div');
      const bg = resolved === 'dark' ? '#07070c' : '#f5f3ff';
      Object.assign(ink.style, {
        position: 'fixed',
        width: `${diameter}px`,
        height: `${diameter}px`,
        borderRadius: '50%',
        left: `${x - maxDist}px`,
        top: `${y - maxDist}px`,
        background: bg,
        transform: 'scale(0)',
        transformOrigin: 'center',
        zIndex: '130',
        pointerEvents: 'none',
        willChange: 'transform',
      });
      document.body.appendChild(ink);

      const anim = ink.animate(
        [{ transform: 'scale(0)' }, { transform: 'scale(1)' }],
        { duration: 600, easing: 'cubic-bezier(0.4, 0, 0, 1)', fill: 'forwards' },
      );

      // Swap theme mid-animation so content repaints under the ink
      let applied = false;
      const applyOnce = () => { if (!applied) { applied = true; doApply(); } };
      setTimeout(applyOnce, 350);
      anim.onfinish = () => {
        applyOnce();
        ink.remove();
      };
    } else {
      doApply();
    }
  }

  return (
    <header
      className="sticky top-0 z-[100] h-14 shrink-0"
      style={{
        background: 'var(--header-bg)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderBottom: '1px solid var(--header-border)',
        boxShadow: 'inset 0 1px 0 var(--glass-border-highlight), 0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <div className="w-full h-full px-4 sm:px-6 flex items-center justify-between">
        {/* Left: brand */}
        <div className="flex items-center gap-2">
          <span className="sm:hidden"><Logo size="sm" /></span>
          <span className="hidden sm:block"><Logo size="md" /></span>
          <span className="px-2 py-0.5 text-[0.625rem] font-medium bg-[var(--purple)]/10 text-[var(--purple)] rounded-full">
            {t('code.app.badge')}
          </span>
        </div>

        {/* Right: theme toggle + optional user menu */}
        <div className="flex items-center gap-3">
          <ThemeToggle theme={theme} onThemeChange={handleThemeChange} />

          {showUser && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-lg transition-colors duration-150"
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--ui-bg-elevated)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                {!isLoaded ? (
                  <div
                    className="w-8 h-8 rounded-full animate-pulse"
                    style={{ backgroundColor: 'var(--ui-bg-elevated)' }}
                  />
                ) : user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={displayName}
                    className="w-8 h-8 rounded-full object-cover"
                    style={{ border: '2px solid var(--ui-border-base)' }}
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white select-none shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, var(--purple), var(--violet, #8B5CF6))',
                      border: '2px solid var(--ui-border-base)',
                    }}
                  >
                    {initials}
                  </div>
                )}
                {isLoaded && (
                  <>
                    <span
                      className="hidden sm:block text-sm font-medium max-w-[140px] truncate"
                      style={{ color: 'var(--ui-text-secondary)' }}
                    >
                      {displayName}
                    </span>
                    <ChevronDown
                      className={`hidden sm:block w-3.5 h-3.5 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
                      style={{ color: 'var(--ui-text-tertiary)' }}
                    />
                  </>
                )}
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-60 rounded-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                  style={{
                    backgroundColor: 'var(--glass-surface)',
                    backdropFilter: 'blur(20px) saturate(160%)',
                    border: '1px solid var(--ui-border-base)',
                    boxShadow: 'var(--glass-shadow)',
                  }}
                >
                  {/* User info */}
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--ui-border-base)' }}>
                    <div className="flex items-center gap-3">
                      {user?.imageUrl ? (
                        <img
                          src={user.imageUrl}
                          alt={displayName}
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                          style={{ border: '2px solid var(--ui-border-base)' }}
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
                          style={{
                            background: 'linear-gradient(135deg, var(--purple), var(--violet, #8B5CF6))',
                            border: '2px solid var(--ui-border-base)',
                          }}
                        >
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--ui-text-primary)' }}>
                          {user?.fullName ?? displayName}
                        </p>
                        {email && (
                          <p className="text-xs truncate" style={{ color: 'var(--ui-text-tertiary)' }}>
                            {email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-1.5">
                    <button
                      onClick={() => { void handleSignOut(); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors duration-150"
                      style={{ color: 'var(--red, #ef4444)' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--ui-bg-elevated)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      {t('code.user.signOut')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
