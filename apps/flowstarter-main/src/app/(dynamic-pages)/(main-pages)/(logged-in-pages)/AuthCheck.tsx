'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function AuthCheck({ children }: { children: React.ReactNode }) {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/login');
    }
  }, [isLoaded, userId, router]);

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--gradient-background, #f8f8fc)' }}>
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-white/10" />
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--purple)] animate-spin"
            style={{ animationDuration: '0.8s' }}
          />
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated (redirect will happen)
  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--gradient-background, #f8f8fc)' }}>
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-white/10" />
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--purple)] animate-spin"
            style={{ animationDuration: '0.8s' }}
          />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
