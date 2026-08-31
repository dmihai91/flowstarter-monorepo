import type { ReactNode } from 'react';

export const metadata = {
  title: 'Contact',
  description:
    'Get in touch with Flowstarter: send a message, book a discovery call, or write to us directly.',
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
