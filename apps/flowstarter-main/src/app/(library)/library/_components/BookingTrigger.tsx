'use client';

import { useBookingModal } from '@/app/(dynamic-pages)/(main-pages)/components/booking-modal-store';

interface BookingTriggerProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * Client-side trigger that opens the global booking modal. Lets server
 * components on the library route ship a "Book a call" / "Build one like
 * this" button without becoming client themselves. The modal itself is
 * rendered by `<BookingModalProvider />` in the library layout.
 */
export function BookingTrigger({ className, children }: BookingTriggerProps) {
  const open = useBookingModal((s) => s.open);
  return (
    <button type="button" onClick={open} className={className}>
      {children}
    </button>
  );
}
