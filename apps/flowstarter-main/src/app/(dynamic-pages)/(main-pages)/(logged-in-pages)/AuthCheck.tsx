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

  // Always render children immediately to prevent flash
  // Auth redirect will happen in useEffect if needed
  return <>{children}</>;
}
