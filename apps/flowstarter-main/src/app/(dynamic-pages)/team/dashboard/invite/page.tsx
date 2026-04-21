'use client';

import { useTranslations } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  UserPlus,
  Mail,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  TeamDashboardShell,
  ShellCard,
} from '../components/TeamDashboardShell';
import { useMutation } from '@tanstack/react-query';

interface InvitationResult {
  success: boolean;
  message: string;
  invitationId?: string;
}

export default function TeamInvitePage() {
  const { t } = useTranslations();
  const { user, isLoaded: userLoaded } = useUser();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<InvitationResult | null>(null);

  useEffect(() => {
    if (userLoaded) {
      const metadata = user?.publicMetadata as { role?: string } | undefined;
      const role = metadata?.role?.toLowerCase();
      const isAdmin = role === 'admin';

      if (!user) {
        router.push('/team/login');
      } else if (!isAdmin) {
        router.push('/team/dashboard');
      } else {
        setIsLoading(false);
      }
    }
  }, [user, userLoaded, router]);

  const inviteMutation = useMutation({
    mutationFn: async (inviteEmail: string) => {
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: inviteEmail }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || t('team.invite.failedToSend'));
      }
      return data as { invitationId?: string };
    },
    onSuccess: (data) => {
      setResult({
        success: true,
        message: `Invitation sent to ${email}`,
        invitationId: data.invitationId,
      });
      setEmail('');
      toast.success('Invitation sent!');
    },
    onError: (err) => {
      const message = (err as Error).message || t('team.invite.failedToSend');
      setResult({ success: false, message });
      toast.error(message);
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setResult(null);
    inviteMutation.mutate(email.trim());
  };

  if (isLoading || !userLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--purple)]" />
      </div>
    );
  }

  return (
    <TeamDashboardShell
      title="Invite Team Member"
      subtitle="Send an invitation to join the team"
      icon={<UserPlus className="w-5 h-5 text-[var(--purple)]" />}
      showBackButton
      backHref="/team/dashboard/team"
      backLabel="Team members"
    >
      <ShellCard>
        <form onSubmit={handleInvite} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm text-[var(--fs-ink-dim)]">
              Email address
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 pl-12 rounded-lg bg-white dark:bg-white/5 border border-[var(--fs-rule)]"
                autoComplete="off"
                data-form-type="other"
                required
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-white/30">
              They'll receive an email with a link to create their account.
            </p>
          </div>

          {result && (
            <div
              className={`p-4 rounded-xl flex items-start gap-3 ${
                result.success
                  ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                  : 'bg-red-500/10 text-red-700 dark:text-red-400'
              }`}
            >
              {result.success ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <span className="text-sm">{result.message}</span>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={inviteMutation.isPending || !email.trim()}
              className="flex items-center gap-2 px-6 py-2 rounded-lg font-semibold text-sm bg-[var(--purple)] text-white hover:bg-[var(--purple)]/90 transition-all disabled:opacity-50"
            >
              {inviteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        </form>
      </ShellCard>

      <div className="mt-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
        <h3 className="text-sm font-medium text-[var(--fs-ink)] mb-2">
          How it works
        </h3>
        <ul className="text-xs text-[var(--fs-ink-faint)] space-y-1">
          <li>• The invitee receives an email to create their account</li>
          <li>• They're automatically granted team member access</li>
          <li>• Invitations expire after 30 days</li>
          <li>• Only admins can send invitations</li>
        </ul>
      </div>
    </TeamDashboardShell>
  );
}
