import { SignUpClient } from './SignUpClient';
import { unstable_noStore as noStore } from 'next/cache';

export default async function SignUpPage() {
  noStore(); // Prevent any caching of this page

  return <SignUpClient />;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
