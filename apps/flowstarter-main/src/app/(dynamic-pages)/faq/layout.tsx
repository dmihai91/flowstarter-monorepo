import type { ReactNode } from 'react';

export const metadata = {
  title: 'FAQ',
  description:
    'Frequently asked questions about Flowstarter — pricing, timeline, ownership, support, and how the smart editor works.',
};

export default function FAQLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
