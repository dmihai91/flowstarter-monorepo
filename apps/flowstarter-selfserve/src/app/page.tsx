import { pricingCopy } from '@/lib/config';
import { LandingScreen } from '@/components/screens/landing';

export default function Page() {
  return (
    <LandingScreen pricing={pricingCopy()} contactEmail={process.env.CONTACT_EMAIL ?? 'hello@flowstarter.app'} />
  );
}
