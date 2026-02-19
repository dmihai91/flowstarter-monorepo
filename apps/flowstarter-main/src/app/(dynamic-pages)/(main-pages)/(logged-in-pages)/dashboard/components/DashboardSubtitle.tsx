'use client';

import React from 'react';

interface DashboardSubtitleProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardSubtitle({
  children,
  className = '',
}: DashboardSubtitleProps) {
  return (
    <h3
      className={`text-sm sm:text-md font-medium tracking-tight text-gray-900 dark:text-gray-100 leading-tight mb-2 ${className}`}
    >
      {children}
    </h3>
  );
}
