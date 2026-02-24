import { redirect } from 'next/navigation';

// Sign-up is disabled - registration is done by Flowstarter after discovery call
export default function SignUpPage() {
  redirect('/login');
}
