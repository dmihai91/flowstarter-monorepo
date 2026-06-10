'use client';

import { SignUp } from '@clerk/nextjs';
import { AuthShell, clerkAppearance } from '@/components/auth-shell';

export default function Page() {
  return (
    <AuthShell
      headline={
        <>
          Let’s get you <span className="grad-text">building.</span>
        </>
      }
      sub="A free account keeps your draft, unlocks 3 refinements, and lets the crew start the moment you do."
      bullets={['Free — just an email', '3 refinement prompts on your demo', 'Nothing is charged until you start the build']}
    >
      <SignUp appearance={clerkAppearance} />
    </AuthShell>
  );
}
