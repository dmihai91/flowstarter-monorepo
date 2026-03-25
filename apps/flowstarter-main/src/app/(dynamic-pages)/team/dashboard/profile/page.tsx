import { ProfileContent } from '@/components/ProfileContent';
import { TeamDashboardShell } from '../components/TeamDashboardShell';
import { User } from 'lucide-react';

export default function TeamProfilePage() {
  return (
    <TeamDashboardShell
      title="Profile"
      subtitle="Manage your personal information"
      icon={<User className="w-5 h-5 text-[var(--purple)]" />}
      maxWidth="xl"
    >
      <ProfileContent embedded />
    </TeamDashboardShell>
  );
}
