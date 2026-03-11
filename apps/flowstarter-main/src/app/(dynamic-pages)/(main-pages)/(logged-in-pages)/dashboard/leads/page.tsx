'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import {
  Users, Mail, Phone, MessageSquare, Clock, Filter,
  CheckCircle2, Star, Archive, AlertTriangle, RefreshCw,
  ChevronDown, ExternalLink,
} from 'lucide-react';

interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  source: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  extra: Record<string, unknown>;
}

interface StatusCount {
  status: string;
  count: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Users }> = {
  new: { label: 'New', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20', icon: Star },
  contacted: { label: 'Contacted', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20', icon: Mail },
  qualified: { label: 'Qualified', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20', icon: CheckCircle2 },
  converted: { label: 'Converted', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20', icon: Star },
  archived: { label: 'Archived', color: 'text-gray-500 bg-gray-50 dark:bg-gray-900/20', icon: Archive },
  spam: { label: 'Spam', color: 'text-red-500 bg-red-50 dark:bg-red-900/20', icon: AlertTriangle },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function LeadsPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [counts, setCounts] = useState<StatusCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedLead, setExpandedLead] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/list?projectId=${projectId}&status=${filter}`);
      const data = (await res.json()) as { leads: Lead[]; counts: StatusCount[] };
      setLeads(data.leads || []);
      setCounts(data.counts || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, [projectId, filter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const updateStatus = async (leadId: string, status: string) => {
    await fetch('/api/leads/list', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId, status }),
    });
    fetchLeads();
  };

  const totalNew = counts.find((c) => c.status === 'new')?.count || 0;
  const totalAll = counts.reduce((sum, c) => sum + (c.status !== 'spam' ? c.count : 0), 0);

  if (!projectId) {
    return (
      <div className="p-8 text-center">
        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Select a project to view leads</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--purple)]" />
            Leads
            {totalNew > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-xs font-medium">
                {totalNew} new
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 dark:text-white/50 mt-1">
            {totalAll} total leads from your website
          </p>
        </div>
        <button onClick={fetchLeads} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5">
          <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {['all', 'new', 'contacted', 'qualified', 'converted', 'archived'].map((s) => {
          const count = s === 'all' ? totalAll : (counts.find((c) => c.status === s)?.count || 0);
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === s
                  ? 'bg-[var(--purple)] text-white'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-white/10'
              }`}
            >
              {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label || s}
              {count > 0 && <span className="ml-1.5 opacity-75">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Leads list */}
      {loading && leads.length === 0 ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <Mail className="w-10 h-10 text-gray-300 dark:text-white/20 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-white/40 font-medium">No leads yet</p>
          <p className="text-sm text-gray-400 dark:text-white/30 mt-1">
            Leads will appear here when visitors submit the contact form on your site
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {leads.map((lead) => {
            const statusConf = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
            const StatusIcon = statusConf.icon;
            const isExpanded = expandedLead === lead.id;

            return (
              <GlassCard key={lead.id} className="p-4 hover:border-[var(--purple)]/20 transition-colors">
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => setExpandedLead(isExpanded ? null : lead.id)}
                >
                  {/* Status badge */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${statusConf.color}`}>
                    <StatusIcon className="w-4 h-4" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white text-sm truncate">
                        {lead.name || lead.email || 'Anonymous'}
                      </span>
                      {lead.source && (
                        <span className="text-[0.65rem] text-gray-400 bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded">
                          {lead.source}
                        </span>
                      )}
                    </div>
                    {lead.message && (
                      <p className="text-xs text-gray-500 dark:text-white/40 truncate mt-0.5">
                        {lead.message}
                      </p>
                    )}
                  </div>

                  {/* Time + expand */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400">{timeAgo(lead.created_at)}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      {lead.email && (
                        <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-gray-600 dark:text-white/60 hover:text-[var(--purple)]">
                          <Mail className="w-3.5 h-3.5" /> {lead.email}
                        </a>
                      )}
                      {lead.phone && (
                        <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-gray-600 dark:text-white/60 hover:text-[var(--purple)]">
                          <Phone className="w-3.5 h-3.5" /> {lead.phone}
                        </a>
                      )}
                    </div>

                    {lead.message && (
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/[0.03]">
                        <p className="text-sm text-gray-700 dark:text-white/70 flex items-start gap-2">
                          <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" />
                          {lead.message}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {new Date(lead.created_at).toLocaleString()}
                    </div>

                    {/* Status actions */}
                    <div className="flex gap-2 flex-wrap">
                      {['new', 'contacted', 'qualified', 'converted', 'archived'].map((s) => {
                        if (s === lead.status) return null;
                        const conf = STATUS_CONFIG[s];
                        return (
                          <Button
                            key={s}
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={(e) => { e.stopPropagation(); updateStatus(lead.id, s); }}
                          >
                            Mark as {conf?.label || s}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
