'use client';

import { useEffect } from 'react';
import { useBookingModal } from './booking-modal-store';
import { PreQualModal } from './PreQualModalLazy';

export function BookingModalProvider() {
  const { isOpen, open, close } = useBookingModal();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('book') === '1') {
        open();
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [open]);

  return <PreQualModal open={isOpen} onClose={close} source="page" />;
}
