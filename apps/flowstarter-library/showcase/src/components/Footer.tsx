import React from 'react';

export function Footer(): React.ReactElement {
  return (
    <footer className="mt-16 border-t border-neutral-200 py-8 dark:border-neutral-800">
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-purple-500 to-purple-700">
            <span className="text-xs font-bold text-white">F</span>
          </div>
          <span className="text-sm font-semibold text-neutral-900 dark:text-white">FlowStarter</span>
          <span className="text-sm text-neutral-400 dark:text-neutral-500">Template Library</span>
        </div>
        <p className="text-sm text-neutral-400 dark:text-neutral-500">
          © 2026 FlowStarter. Professional website templates for operators.
        </p>
      </div>
    </footer>
  );
}
