'use client';

import React from 'react';

export function DashboardWrapper({ children }: React.PropsWithChildren) {
  return <div data-density="comfortable">{children}</div>;
}
