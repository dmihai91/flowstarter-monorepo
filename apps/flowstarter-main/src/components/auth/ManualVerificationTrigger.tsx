'use client';

import { Button } from '@/components/ui/button';
import { useSignUp } from '@clerk/nextjs';
import { useState } from 'react';

export function ManualVerificationTrigger({ email }: { email?: string }) {
  const { signUp } = useSignUp();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Only show in development and when we have a signup session
  if (process.env.NODE_ENV !== 'development' || !signUp || !email) {
    return null;
  }

  const handleResendVerification = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      console.log('🔄 Manually triggering verification email...');

      // Try to prepare verification again
      const verification = await signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      });

      console.log('✅ Manual verification trigger successful:', verification);
      setMessage(
        '✅ Verification email trigger sent! Check console and email.'
      );
    } catch (error) {
      console.error('❌ Manual verification failed:', error);
      setMessage(
        '❌ Failed to trigger verification email. Check console for details.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
      <div className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
        🔧 <strong>Development Helper:</strong> Manually trigger verification
        email
      </div>
      <div className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
        Email: {email}
      </div>
      <Button
        onClick={handleResendVerification}
        disabled={isLoading}
        size="sm"
        variant="outline"
        className="text-xs"
      >
        {isLoading ? 'Triggering...' : 'Resend Verification Email'}
      </Button>
      {message && (
        <div className="mt-2 text-xs text-yellow-700 dark:text-yellow-300">
          {message}
        </div>
      )}
    </div>
  );
}
