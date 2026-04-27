'use client';

import { FlowBackground } from '@flowstarter/flow-design-system';

type FlowBackgroundVariant =
  | 'dashboard'
  | 'editor'
  | 'landing'
  | 'wizard'
  | 'auth';

export function FlowBackgroundLayer({
  variant,
}: {
  variant: FlowBackgroundVariant;
}) {
  return (
    <FlowBackground
      variant={variant}
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
    />
  );
}
