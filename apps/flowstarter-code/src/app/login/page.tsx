import { LoginPageContent } from './LoginPageContent';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  const session = await auth();
  if (session.userId) {
    redirect('/');
  }

  return <LoginPageContent />;
}
