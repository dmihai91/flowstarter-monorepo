'use client';

import { Button } from '@/components/ui/button';
import { GradientBackground } from '@/components/ui/gradient-background';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser, useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  UserPlus,
  Mail,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { TeamHeader } from '../../components/TeamHeader';
import FooterCompact from '@/components/FooterCompact';

interface InvitationResult {
  success: boolean;
  message: string;
  invitationId?: string;
}

export default function TeamInvitePage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<InvitationResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Check if user is team member (admin only for invites)
  useEffect(() => {
    if (userLoaded) {
      const metadata = user?.publicMetadata as { role?: string } | undefined;
      const role = metadata?.role?.toLowerCase();
      const isAdmin = role === 'admin';

      if (!user) {
        router.push('/team/login');
      } else if (!isAdmin) {
        // Only admins can invite
        router.push('/team/dashboard');
      } else {
        setIsLoading(false);
      }
    }
  }, [user, userLoaded, router]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSending(true);
    setResult(null);

    try {
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: `Invitation sent to ${email}`,
          invitationId: data.invitationId,
        });
        setEmail('');
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to send invitation',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Network error. Please try again.',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading || !userLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#0a0a0c]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--purple)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TeamHeader />
      <div className="h-16" />
      <GradientBackground variant="dashboard" className="fixed" />

      {/* Content */}
      <main className="flex-1 relative z-10 max-w-2xl mx-auto px-6 py-12 w-full">
          {/* Back link */}
          <Link
            href="/team/dashboard"
            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-[var(--purple)]/10 flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-[var(--purple)]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Invite Team Member
                </h1>
                <p className="text-sm text-gray-500 dark:text-white/50">
                  Send an invitation to join the team
                </p>
              </div>
            </div>
          </div>

          {/* Invite Form */}
          <div className="p-8 rounded-2xl bg-white/60 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5">
            <form onSubmit={handleInvite} className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm text-gray-600 dark:text-white/60"
                >
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
                    className="h-12 pl-12 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10"
                    autoComplete="off"
                    data-form-type="other"
                    required
                  />
                </div>
                <p className="text-xs text-gray-400 dark:text-white/30">
                  They'll receive an email with a link to create their account.
                </p>
              </div>

              {/* Result message */}
              {result && (
                <div
                  className={`p-4 rounded-xl flex items-start gap-3 ${
                    result.success
                      ? 'bg-emerald-500/10 border border-emerald-500/20'
                      : 'bg-red-500/10 border border-red-500/20'
                  }`}
                >
                  {result.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  )}
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        result.success
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-red-700 dark:text-red-400'
                      }`}
                    >
                      {result.message}
                    </p>
                    {result.success && (
                      <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">
                        The invitation will expire in 30 days.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSending || !email.trim()}
                className="w-full h-12 rounded-lg font-semibold bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 shadow-md transition-all disabled:opacity-50"
              >
                {isSending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending invitation...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Send Invitation
                  </span>
                )}
              </Button>
            </form>
          </div>

          {/* Info */}
          <div className="mt-6 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              How it works
            </h3>
            <ul className="text-xs text-gray-500 dark:text-white/50 space-y-1">
              <li>• The invitee receives an email to create their account</li>
              <li>• They're automatically granted team member access</li>
              <li>• Invitations expire after 30 days</li>
              <li>• Only admins can send invitations</li>
            </ul>
          </div>
        </main>

      <FooterCompact />
    </div>
  );
}
