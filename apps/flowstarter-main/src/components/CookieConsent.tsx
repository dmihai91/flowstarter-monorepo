'use client';

import { useState, useEffect } from 'react';
import { X, Cookie } from 'lucide-react';
import Link from 'next/link';

const COOKIE_CONSENT_KEY = 'flowstarter_cookie_consent';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      essential: true,
      analytics: true,
      functional: true,
      timestamp: new Date().toISOString(),
    }));
    closeWithAnimation();
  };

  const handleEssentialOnly = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      essential: true,
      analytics: false,
      functional: false,
      timestamp: new Date().toISOString(),
    }));
    closeWithAnimation();
  };

  const closeWithAnimation = () => {
    setIsClosing(true);
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6 transition-all duration-300 ${
        isClosing ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
      }`}
    >
      <div className="max-w-3xl mx-auto">
        <div className="relative bg-white/90 dark:bg-[#1a1a1f]/90 backdrop-blur-2xl backdrop-saturate-150 rounded-2xl border-t border-l border-white/50 dark:border-white/[0.08] border-b border-r border-black/[0.06] dark:border-black/[0.2] shadow-[0_12px_48px_rgba(0,0,0,0.12),0_1px_0_rgba(255,255,255,0.9)_inset] dark:shadow-[0_12px_48px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.06)_inset] overflow-hidden">
          
          <div className="p-5 sm:p-6">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="w-10 h-10 rounded-xl bg-[var(--purple)]/10 flex items-center justify-center flex-shrink-0">
                <Cookie className="w-5 h-5 text-[var(--purple)]" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pr-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  We use cookies
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-white/50 leading-relaxed mb-4">
                  Essential cookies to make Flowstarter work, plus analytics to improve your experience. 
                  No advertising or cross-site tracking.{' '}
                  <Link href="/cookies" className="text-[var(--purple)] hover:underline">
                    Learn more
                  </Link>
                </p>

                {/* Buttons */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <button
                    onClick={handleAccept}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[var(--purple)] via-blue-500 to-[var(--purple)] bg-[length:200%_100%] text-white text-sm font-semibold shadow-[0_4px_16px_rgba(124,58,237,0.2)] hover:shadow-[0_6px_24px_rgba(124,58,237,0.3)] transition-all duration-200"
                  >
                    Accept all
                  </button>
                  <button
                    onClick={handleEssentialOnly}
                    className="px-5 py-2 rounded-xl bg-gray-100 dark:bg-white/[0.06] border border-gray-200/60 dark:border-white/10 text-gray-700 dark:text-white/70 text-sm font-medium hover:bg-gray-150 dark:hover:bg-white/10 transition-all duration-200"
                  >
                    Essential only
                  </button>
                  <Link
                    href="/cookies"
                    className="px-4 py-2 text-gray-400 dark:text-white/40 text-sm hover:text-gray-600 dark:hover:text-white/60 transition-colors"
                  >
                    Settings
                  </Link>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={handleEssentialOnly}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-300 dark:text-white/30 hover:text-gray-500 dark:hover:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
