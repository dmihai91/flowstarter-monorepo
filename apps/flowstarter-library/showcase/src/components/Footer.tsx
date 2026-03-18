import React from 'react';
import { Logo } from '@flowstarter/flow-design-system';

interface FooterProps {
  darkMode?: boolean;
}

export function Footer({ darkMode = false }: FooterProps): React.ReactElement {
  return (
    <footer className="mt-16 border-t border-neutral-200 py-8 dark:border-neutral-800">
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
        <a href="/" className="flex items-center no-underline">
          <Logo size="xs" />
        </a>
        <p className="text-sm text-neutral-400 dark:text-neutral-500">
          © 2026 FlowStarter. Professional website templates for operators.
        </p>
      </div>
    </footer>
  );
}
