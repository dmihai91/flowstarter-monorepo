'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Building2,
  Users,
  Mail,
  Phone,
  Globe,
  MapPin,
  Loader2,
  Edit,
  ExternalLink,
  Sparkles,
  AlertCircle,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  FolderOpen,
  Share,
  Copy,
  Check,
} from 'lucide-react';
import { useProject } from './hooks/useProject';
import { TeamDashboardShell } from '../../components/TeamDashboardShell';
import { IntegrationSettings } from './components/IntegrationSettings';

const card =
  'rounded-[24px] border border-gray-200/80 bg-white/95 dark:border-white/[0.06] dark:bg-white/[0.05] shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]';

// ── Status pill ──────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: string | null | undefined }) {
  const s = (status ?? 'pending').toLowerCase();
  const map: Record<string, { label: string; color: string }> = {
    paid: {
      label: 'Paid',
      color:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    },
    active: {
      label: 'Active',
      color:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    },
    invoiced: {
      label: 'Invoiced',
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
    },
    trialing: {
      label: 'Trial',
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
    },
    overdue: {
      label: 'Overdue',
      color: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
    },
    cancelled: {
      label: 'Cancelled',
      color:
        'bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-white/40',
    },
    pending: {
      label: 'Pending',
      color:
        'bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-white/40',
    },
  };
  const { label, color } = map[s] ?? map.pending;
  return (
    <span
      className={`px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider rounded-full ${color}`}
    >
      {label}
    </span>
  );
}

function StatusIcon({ status }: { status: string | null | undefined }) {
  const s = (status ?? 'pending').toLowerCase();
  if (s === 'paid' || s === 'active')
    return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (s === 'invoiced' || s === 'trialing')
    return <Clock className="w-4 h-4 text-blue-400" />;
  if (s === 'overdue') return <XCircle className="w-4 h-4 text-red-400" />;
  return <RefreshCw className="w-4 h-4 text-gray-400 dark:text-white/25" />;
}

// ── Info helpers ─────────────────────────────────────────────────────────────
function Section({
  icon,
  iconBg,
  title,
  children,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={card + ' p-6'}>
      <div className="flex items-center gap-3 mb-5">
        <div
          className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}
        >
          {icon}
        </div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function Row({
  icon,
  value,
  href,
  external,
}: {
  icon: React.ReactNode;
  value: string;
  href?: string;
  external?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-4 h-4 text-gray-400 dark:text-white/30 shrink-0">
        {icon}
      </span>
      {href ? (
        <a
          href={href}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
          className="text-[var(--purple)] hover:underline inline-flex items-center gap-1 text-sm"
        >
          {value}
          {external && <ExternalLink className="w-3 h-3" />}
        </a>
      ) : (
        <span className="text-sm text-gray-700 dark:text-white/80">
          {value}
        </span>
      )}
    </div>
  );
}

function Detail({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-xs text-gray-400 dark:text-white/30 shrink-0">
        {label}
      </span>
      <span
        className={`text-xs font-medium text-gray-700 dark:text-white/80 text-right max-w-[60%] ${
          capitalize ? 'capitalize' : ''
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-gray-400 dark:text-white/30">{text}</p>;
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function ProjectDetailPage() {
  const { project, parsedChat, isLoading, error, isComplete, handleEdit } =
    useProject();

  const [isSending, setIsSending] = useState(false);
  const [clientUrl, setClientUrl] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSendToClient = async () => {
    if (!project || !parsedChat?.clientInfo?.email) return;
    setIsSending(true);
    setSendError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/send-to-client`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientEmail: parsedChat.clientInfo.email,
          clientName: parsedChat.clientInfo.name ?? 'Client',
        }),
      });
      if (!res.ok) throw new Error('Failed to create client link');
      const data = (await res.json()) as { editorUrl?: string };
      setClientUrl(data.editorUrl ?? null);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyUrl = () => {
    if (!clientUrl) return;
    navigator.clipboard.writeText(clientUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--purple)] to-[var(--purple)]/70 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          </div>
          <p className="text-sm text-gray-500 dark:text-white/40">
            Loading project…
          </p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className={card + ' p-8 max-w-md text-center'}>
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Project not found
          </h2>
          <p className="text-sm text-gray-500 dark:text-white/40 mb-6">
            {error ?? "This project doesn't exist."}
          </p>
          <Link
            href="/team/dashboard"
            className="text-sm text-[var(--purple)] hover:underline"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const p = project as typeof project & {
    setup_fee?: number;
    plan_name?: string;
    deposit_status?: string;
    deposit_amount?: number;
    final_status?: string;
    final_amount?: number;
    subscription_status?: string;
  };

  const projectStatus =
    typeof project.status === 'string' ? project.status : 'draft';

  return (
    <TeamDashboardShell
      title={project.name ?? 'Project'}
      subtitle={`${
        projectStatus.charAt(0).toUpperCase() + projectStatus.slice(1)
      } · ${p.plan_name ?? ''}`}
      icon={<FolderOpen className="w-5 h-5 text-[var(--purple)]" />}
    >
      {/* Project header */}
      <div className={card + ' p-6 mb-6'}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--purple)] to-blue-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-[var(--purple)]/20 shrink-0">
              {project.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {project.name}
                </h1>
                {parsedChat?.generatedByAI && (
                  <span className="inline-flex items-center gap-1 text-[0.65rem] px-2 py-0.5 rounded-full bg-[var(--purple)]/10 text-[var(--purple)]">
                    <Sparkles className="w-3 h-3" /> AI Generated
                  </span>
                )}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                    projectStatus === 'live'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                      : projectStatus === 'draft'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400'
                      : 'bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-white/40'
                  }`}
                >
                  {projectStatus}
                </span>
              </div>
              <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5 font-mono">
                {project.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSendToClient}
              disabled={isSending || !parsedChat?.clientInfo?.email}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--purple)] text-white text-sm font-medium hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Share className="w-4 h-4" />
              )}
              Send to client
            </button>
            <button
              onClick={handleEdit}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/[0.08] text-sm font-medium text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-all"
            >
              <Edit className="w-4 h-4" /> Edit
            </button>
          </div>
        </div>
        {project.description && (
          <p className="text-sm text-gray-600 dark:text-white/60 mt-4 leading-relaxed">
            {project.description}
          </p>
        )}
        {sendError && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl px-4 py-3">
            {sendError}
          </p>
        )}
        {clientUrl && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[var(--purple)]/20 bg-[var(--purple)]/5 px-4 py-3">
            <input
              readOnly
              value={clientUrl}
              className="flex-1 bg-transparent text-sm text-zinc-800 dark:text-white/80 outline-none truncate"
            />
            <button
              onClick={handleCopyUrl}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--purple)] text-white text-xs font-medium hover:opacity-90 transition-all shrink-0"
            >
              {copied ? (
                <Check className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Client */}
        <Section
          icon={<Users className="w-5 h-5 text-blue-500" />}
          iconBg="bg-blue-500/10"
          title="Client"
        >
          {parsedChat?.clientInfo ? (
            <div className="space-y-3">
              {parsedChat.clientInfo.name && (
                <Row icon={<Users />} value={parsedChat.clientInfo.name} />
              )}
              {parsedChat.clientInfo.email && (
                <Row
                  icon={<Mail />}
                  value={parsedChat.clientInfo.email}
                  href={`mailto:${parsedChat.clientInfo.email}`}
                />
              )}
              {parsedChat.clientInfo.phone && (
                <Row icon={<Phone />} value={parsedChat.clientInfo.phone} />
              )}
            </div>
          ) : (
            <Empty text="No client info" />
          )}
        </Section>

        {/* Business */}
        <Section
          icon={<Building2 className="w-5 h-5 text-[var(--purple)]" />}
          iconBg="bg-[var(--purple)]/10"
          title="Business"
        >
          {parsedChat?.businessInfo ? (
            <div className="space-y-2">
              {parsedChat.businessInfo.industry && (
                <Detail
                  label="Industry"
                  value={parsedChat.businessInfo.industry}
                />
              )}
              {parsedChat.businessInfo.targetAudience && (
                <Detail
                  label="Audience"
                  value={parsedChat.businessInfo.targetAudience}
                />
              )}
              {parsedChat.businessInfo.brandTone && (
                <Detail
                  label="Tone"
                  value={parsedChat.businessInfo.brandTone}
                  capitalize
                />
              )}
              {parsedChat.businessInfo.offerType && (
                <Detail
                  label="Offer type"
                  value={parsedChat.businessInfo.offerType}
                  capitalize
                />
              )}
              {parsedChat.businessInfo.uvp && (
                <div className="pt-3 mt-1 border-t border-gray-100 dark:border-white/[0.06]">
                  <p className="text-xs text-gray-400 dark:text-white/30 mb-1">
                    Value proposition
                  </p>
                  <p className="text-xs text-gray-700 dark:text-white/70">
                    {parsedChat.businessInfo.uvp}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <Empty text="No business info" />
          )}
        </Section>

        {/* Contact */}
        <Section
          icon={<Globe className="w-5 h-5 text-green-500" />}
          iconBg="bg-green-500/10"
          title="Contact"
        >
          {parsedChat?.contactInfo &&
          (parsedChat.contactInfo.email ||
            parsedChat.contactInfo.phone ||
            parsedChat.contactInfo.address ||
            parsedChat.contactInfo.website) ? (
            <div className="space-y-3">
              {parsedChat.contactInfo.email && (
                <Row
                  icon={<Mail />}
                  value={parsedChat.contactInfo.email}
                  href={`mailto:${parsedChat.contactInfo.email}`}
                />
              )}
              {parsedChat.contactInfo.phone && (
                <Row icon={<Phone />} value={parsedChat.contactInfo.phone} />
              )}
              {parsedChat.contactInfo.address && (
                <Row icon={<MapPin />} value={parsedChat.contactInfo.address} />
              )}
              {parsedChat.contactInfo.website && (
                <Row
                  icon={<Globe />}
                  value={parsedChat.contactInfo.website}
                  href={parsedChat.contactInfo.website}
                  external
                />
              )}
            </div>
          ) : (
            <Empty text="No contact info" />
          )}
        </Section>

        {/* Payment */}
        <Section
          icon={<CreditCard className="w-5 h-5 text-amber-500" />}
          iconBg="bg-amber-500/10"
          title="Payment"
        >
          <div className="space-y-4">
            {/* Plan + setup fee */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 dark:text-white/30">
                Plan
              </span>
              <span className="text-xs font-semibold text-gray-700 dark:text-white/80 uppercase">
                {p.plan_name ?? 'Not set'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 dark:text-white/30">
                Setup fee
              </span>
              <span className="text-xs font-semibold text-gray-700 dark:text-white/80">
                {p.setup_fee != null
                  ? `€${Number(p.setup_fee).toLocaleString()}`
                  : 'Not set'}
              </span>
            </div>
            <div className="pt-3 border-t border-gray-100 dark:border-white/[0.06] space-y-3">
              {/* Deposit */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusIcon status={p.deposit_status} />
                  <span className="text-xs text-gray-600 dark:text-white/60">
                    Deposit
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {p.deposit_amount != null && (
                    <span className="text-xs text-gray-500 dark:text-white/40">
                      €{Number(p.deposit_amount).toLocaleString()}
                    </span>
                  )}
                  <StatusPill status={p.deposit_status} />
                </div>
              </div>
              {/* Final */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusIcon status={p.final_status} />
                  <span className="text-xs text-gray-600 dark:text-white/60">
                    Final payment
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {p.final_amount != null && (
                    <span className="text-xs text-gray-500 dark:text-white/40">
                      €{Number(p.final_amount).toLocaleString()}
                    </span>
                  )}
                  <StatusPill status={p.final_status} />
                </div>
              </div>
              {/* Subscription */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusIcon status={p.subscription_status} />
                  <span className="text-xs text-gray-600 dark:text-white/60">
                    Subscription
                  </span>
                </div>
                <StatusPill status={p.subscription_status} />
              </div>
            </div>
          </div>
        </Section>

        {/* Integrations */}
        <IntegrationSettings projectId={project.id} />

        {/* Actions */}
        <Section
          icon={<Sparkles className="w-5 h-5 text-orange-500" />}
          iconBg="bg-orange-500/10"
          title="Actions"
        >
          <div className="space-y-3">
            <button
              onClick={handleEdit}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/[0.08] text-sm text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-all"
            >
              <Edit className="w-4 h-4" /> Edit project details
            </button>
            <button
              disabled={!isComplete}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-[var(--purple)] to-blue-500 text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" /> Generate website
            </button>
          </div>
        </Section>
      </div>
    </TeamDashboardShell>
  );
}
