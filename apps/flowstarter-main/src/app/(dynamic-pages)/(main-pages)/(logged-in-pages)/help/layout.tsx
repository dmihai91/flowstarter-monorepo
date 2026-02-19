import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help Center | Flowstarter',
  description:
    'Get help with Flowstarter. Find answers to common questions, tutorials, and support resources.',
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
