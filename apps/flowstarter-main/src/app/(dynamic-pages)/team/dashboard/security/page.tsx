'use client';

import { PageContainer } from '@/components/PageContainer';
import { DashboardWrapper } from '@/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/dashboard/components/DashboardWrapper';
import { GlassCard } from '@/components/ui/glass-card';
import { TeamHeader } from '../../components/TeamHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Shield,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  Loader2,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Copy,
  Check,
} from 'lucide-react';

export default function TeamSecurityPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);

  // 2FA setup state
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [setupError, setSetupError] = useState<string | null>(null);
  const [setupSuccess, setSetupSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  // Disable 2FA state
  const [isDisabling, setIsDisabling] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);

  useEffect(() => {
    if (userLoaded) {
      const metadata = user?.publicMetadata as { role?: string } | undefined;
      const role = metadata?.role?.toLowerCase();
      const isTeam = role === 'team' || role === 'admin';

      if (!user) {
        router.push('/team/login');
      } else if (!isTeam) {
        router.push('/team/login');
      } else {
        checkTotpStatus();
        setIsLoading(false);
      }
    }
  }, [user, userLoaded, router]);

  const checkTotpStatus = () => {
    if (user) {
      const hasTOTP = user.twoFactorEnabled;
      setTotpEnabled(hasTOTP);
    }
  };

  const startTotpSetup = async () => {
    if (!user) return;

    setIsSettingUp(true);
    setSetupError(null);

    try {
      const totp = await user.createTOTP();
      setQrCodeUrl(totp.uri);
      setSecret(totp.secret);
    } catch (error) {
      console.error('Error starting TOTP setup:', error);
      setSetupError('Failed to start authenticator setup. Please try again.');
      setIsSettingUp(false);
    }
  };

  const verifyAndEnableTotp = async () => {
    if (!user || !verificationCode) return;

    setIsVerifying(true);
    setSetupError(null);

    try {
      await user.verifyTOTP({ code: verificationCode });
      setTotpEnabled(true);
      setSetupSuccess(true);
      setIsSettingUp(false);
      setQrCodeUrl(null);
      setSecret(null);
      setVerificationCode('');
    } catch (error) {
      console.error('Error verifying TOTP:', error);
      setSetupError('Invalid code. Please check and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const disableTotp = async () => {
    if (!user || !disableCode) return;

    setIsDisabling(true);
    setSetupError(null);

    try {
      await user.disableTOTP({ code: disableCode });
      setTotpEnabled(false);
      setShowDisableConfirm(false);
      setDisableCode('');
    } catch (error) {
      console.error('Error disabling TOTP:', error);
      setSetupError('Invalid code. Please try again.');
    } finally {
      setIsDisabling(false);
    }
  };

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const cancelSetup = () => {
    setIsSettingUp(false);
    setQrCodeUrl(null);
    setSecret(null);
    setVerificationCode('');
    setSetupError(null);
  };

  if (isLoading || !userLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#0a0a0c]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--purple)]" />
      </div>
    );
  }

  return (
    <DashboardWrapper>
      <TeamHeader />

      <PageContainer gradientVariant="dashboard">
        <GlassCard className="p-6 sm:p-8 max-w-2xl mx-auto">
          {/* Back button */}
          <Link
            href="/team/dashboard"
            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-xl bg-[var(--purple)]/10 text-[var(--purple)]">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Security Settings
              </h1>
              <p className="text-sm text-gray-500 dark:text-white/50">
                Manage your account security
              </p>
            </div>
          </div>

          {/* Success message */}
          {setupSuccess && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                Two-factor authentication has been enabled successfully!
              </p>
            </div>
          )}

          {/* 2FA Card */}
          <div className="p-6 rounded-2xl bg-white/55 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    totpEnabled
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-400'
                  }`}
                >
                  {totpEnabled ? (
                    <ShieldCheck className="w-5 h-5" />
                  ) : (
                    <ShieldOff className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Two-Factor Authentication
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-white/50">
                    {totpEnabled
                      ? 'Your account is protected with 2FA'
                      : 'Add an extra layer of security'}
                  </p>
                </div>
              </div>

              {!isSettingUp && !showDisableConfirm && (
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    totpEnabled
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {totpEnabled ? 'Enabled' : 'Not enabled'}
                </span>
              )}
            </div>

            {/* Setup Flow */}
            {isSettingUp && qrCodeUrl && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                  <div className="flex items-start gap-3">
                    <Smartphone className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-gray-900 dark:text-white mb-1">
                        Scan with your authenticator app
                      </p>
                      <p className="text-gray-500 dark:text-white/50">
                        Use Google Authenticator, Authy, 1Password, or any TOTP
                        app
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center py-6">
                  <div className="p-4 bg-white rounded-2xl shadow-lg">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                        qrCodeUrl
                      )}`}
                      alt="QR Code for authenticator"
                      className="w-48 h-48"
                    />
                  </div>
                </div>

                {secret && (
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5">
                    <p className="text-xs text-gray-500 dark:text-white/50 mb-2">
                      Or enter this code manually:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-white dark:bg-white/10 rounded-lg text-sm font-mono text-gray-900 dark:text-white">
                        {secret}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={copySecret}
                        className="shrink-0"
                      >
                        {copied ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-sm text-gray-600 dark:text-white/60">
                    Enter the 6-digit code from your app
                  </Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) =>
                      setVerificationCode(e.target.value.replace(/\D/g, ''))
                    }
                    className="h-14 text-center text-2xl tracking-[0.5em] font-mono"
                  />
                </div>

                {setupError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {setupError}
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={cancelSetup}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={verifyAndEnableTotp}
                    disabled={verificationCode.length !== 6 || isVerifying}
                    className="flex-1"
                  >
                    {isVerifying && (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    )}
                    {isVerifying ? 'Verifying...' : 'Enable 2FA'}
                  </Button>
                </div>
              </div>
            )}

            {/* Disable confirmation */}
            {showDisableConfirm && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Enter your authenticator code to disable 2FA. This will make
                    your account less secure.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-gray-600 dark:text-white/60">
                    Authentication code
                  </Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={disableCode}
                    onChange={(e) =>
                      setDisableCode(e.target.value.replace(/\D/g, ''))
                    }
                    className="h-12 text-center text-xl tracking-[0.5em] font-mono"
                  />
                </div>

                {setupError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {setupError}
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDisableConfirm(false);
                      setDisableCode('');
                      setSetupError(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={disableTotp}
                    disabled={disableCode.length !== 6 || isDisabling}
                    variant="destructive"
                    className="flex-1"
                  >
                    {isDisabling && (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    )}
                    {isDisabling ? 'Disabling...' : 'Disable 2FA'}
                  </Button>
                </div>
              </div>
            )}

            {/* Enable/Disable buttons */}
            {!isSettingUp && !showDisableConfirm && (
              <div className="mt-4">
                {totpEnabled ? (
                  <Button
                    variant="outline"
                    onClick={() => setShowDisableConfirm(true)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    Disable Two-Factor Authentication
                  </Button>
                ) : (
                  <Button onClick={startTotpSetup}>
                    <QrCode className="w-4 h-4 mr-2" />
                    Set Up Authenticator App
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="mt-6 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Why use two-factor authentication?
            </h3>
            <ul className="text-xs text-gray-500 dark:text-white/50 space-y-1">
              <li>
                • Protects your account even if your password is compromised
              </li>
              <li>• Required for team members to access sensitive data</li>
              <li>• Uses time-based codes that expire every 30 seconds</li>
            </ul>
          </div>
        </GlassCard>
      </PageContainer>
    </DashboardWrapper>
  );
}
