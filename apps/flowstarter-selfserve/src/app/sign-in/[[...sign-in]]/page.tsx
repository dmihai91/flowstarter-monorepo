'use client';

import { SignIn } from '@clerk/nextjs';
import { AuthShell, clerkAppearance } from '@/components/auth-shell';

export default function Page() {
  return (
    <AuthShell
      headline={
        <>
          Welcome <span className="grad-text">back.</span>
        </>
      }
      sub="Pick up where you left off — your demo, your build, your crew."
      bullets={['Your drafts and builds, saved', 'Live build feed on any device', 'One account for everything']}
    >
      <SignIn appearance={clerkAppearance} />
    </AuthShell>
  );
}
