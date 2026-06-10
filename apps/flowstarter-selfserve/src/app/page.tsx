import { pricingCopy } from '@/lib/config';
import { EntryScreen } from '@/components/screens/entry';

export default function Page() {
  return <EntryScreen pricing={pricingCopy()} contactEmail={process.env.CONTACT_EMAIL ?? 'hello@flowstarter.app'} />;
}
