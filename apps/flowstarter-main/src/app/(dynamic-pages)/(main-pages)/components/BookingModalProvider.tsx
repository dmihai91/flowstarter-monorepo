'use client';

import { useEffect, useState } from 'react';
import { useBookingModal } from './booking-modal-store';
import { PreQualModal } from './PreQualModalLazy';

export function BookingModalProvider() {
  const { isOpen, open, close } = useBookingModal();
  // After a Stripe deposit redirect we reopen straight on the calendar step.
  const [resumeStep, setResumeStep] = useState<'calendar' | null>(null);
  const [resumeTier, setResumeTier] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);

    if (params.get('book') === '1') {
      open();
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    const deposit = params.get('deposit');
    if (deposit === 'paid') {
      // Deposit cleared — jump back into the modal at the calendar step.
      setResumeTier(params.get('tier'));
      setResumeStep('calendar');
      open();
      window.history.replaceState({}, '', window.location.pathname);
    } else if (deposit === 'cancelled') {
      // Payment abandoned — reopen the wizard so they can try again.
      open();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [open]);

  return (
    <PreQualModal
      open={isOpen}
      onClose={() => {
        setResumeStep(null);
        setResumeTier(null);
        close();
      }}
      source="page"
      initialPlan={resumeTier}
      resumeStep={resumeStep}
    />
  );
}
