import type { ReactNode } from 'react';

export const metadata = {
  title: 'Help Center',
  description:
    'Get help with your Flowstarter account, learn how the smart editor works, or book a free discovery call.',
};

export default function HelpLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
