import { pricingCopy, CAPACITY } from '@/lib/config';
import { slotsLeftThisMonth } from '@/lib/slots';
import { LandingScreen } from '@/components/screens/landing';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const slotsLeft = await slotsLeftThisMonth();
  return (
    <LandingScreen
      pricing={pricingCopy()}
      contactEmail={process.env.CONTACT_EMAIL ?? 'hello@flowstarter.app'}
      slots={{ left: slotsLeft, cap: CAPACITY.buildsPerMonth }}
    />
  );
}
