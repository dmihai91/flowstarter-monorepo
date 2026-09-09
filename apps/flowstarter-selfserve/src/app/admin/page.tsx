import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { AdminScreen } from '@/components/screens/admin';

export default async function Page() {
  if (!(await isAdmin())) redirect('/');
  return <AdminScreen />;
}
