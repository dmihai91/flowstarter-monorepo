import type { Metadata } from 'next';
import { Suspense } from 'react';

import { WorkflowShowcaseClient } from './WorkflowShowcaseClient';
import './workflow-showcase.css';

export const metadata: Metadata = {
  colorScheme: 'light dark',
  title: 'How Flowstarter works — workflow films',
  description:
    'Watch Flowstarter turn a business idea into a tailored preview, a reviewed website, and a safely editable live service.',
};

export default function WorkflowShowcasePage() {
  return (
    <Suspense
      fallback={<div className="wf-loading">Preparing workflow films…</div>}
    >
      <WorkflowShowcaseClient />
    </Suspense>
  );
}
