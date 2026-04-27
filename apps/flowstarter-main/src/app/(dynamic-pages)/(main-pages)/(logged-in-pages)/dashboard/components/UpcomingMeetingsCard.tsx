'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { GlassCard } from '@/components/ui/glass-card';
import {
  Calendar,
  Clock,
  Users,
  Video,
  MapPin,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

interface CalendlyEvent {
  uri: string;
  name: string;
  startTime: string;
  endTime: string;
  location?: { type: string; location?: string; join_url?: string };
  invitees: Array<{ name: string; email: string }>;
  rescheduleUrl?: string;
}

interface Props {
  projectId: string;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function durationMin(start: string, end: string): number {
  return Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 60000
  );
}

function LocationIcon({ type }: { type?: string }) {
  if (
    type === 'google_conference' ||
    type === 'zoom' ||
    type === 'microsoft_teams'
  )
    return <Video className="w-3.5 h-3.5" />;
  return <MapPin className="w-3.5 h-3.5" />;
}

export function UpcomingMeetingsCard({ projectId }: Props) {
  const qc = useQueryClient();

  const {
    data,
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: ['calendly-events', projectId],
    queryFn: async () => {
      const res = await fetch(
        `/api/calendly/events?projectId=${projectId}&days=14`
      );
      const data = (await res.json()) as {
        events?: CalendlyEvent[];
        error?: string;
      };
      if (data.error) throw new Error(data.error);
      return data.events ?? [];
    },
    staleTime: 5 * 60_000, // Calendly data is slow to change — 5 min
    gcTime: 10 * 60_000,
    retry: false, // Don't retry on "not configured" errors
  });

  const events = data ?? [];
  const error = queryError instanceof Error ? queryError.message : null;
  const fetchEvents = () =>
    qc.invalidateQueries({ queryKey: ['calendly-events', projectId] });

  // Don't render if Calendly not configured
  if (error === 'Calendly not configured with API key') return null;

  return (
    <GlassCard className="p-5 col-span-1 sm:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--fs-accent-bg)]">
            <Calendar className="h-4 w-4 text-[var(--fs-accent)]" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--fs-ink-dim)]">
            Upcoming Meetings
          </h3>
        </div>
        <button
          onClick={fetchEvents}
          className="rounded-lg p-1.5 transition-colors hover:bg-[var(--fs-bg-elevated)]"
          title="Refresh"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-gray-400 ${
              loading ? 'animate-spin' : ''
            }`}
          />
        </button>
      </div>

      {loading && events.length === 0 ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-[var(--fs-bg-elevated)]"
            />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-6">
          <Calendar className="mx-auto mb-2 h-8 w-8 text-[var(--fs-ink-disabled)]" />
          <p className="text-sm text-[var(--fs-ink-faint)]">
            No upcoming meetings
          </p>
          <p className="mt-1 text-xs text-[var(--fs-ink-disabled)]">
            New bookings will appear here automatically
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.slice(0, 5).map((event) => (
            <div
              key={event.uri}
              className="group flex items-center gap-3 rounded-lg border border-[var(--fs-rule)] bg-[var(--fs-bg-elevated)] p-3 transition-colors hover:border-[var(--fs-rule-accent)]"
            >
              {/* Date badge */}
              <div className="flex flex-col items-center min-w-[48px]">
                <span className="text-[0.65rem] font-medium uppercase text-[var(--fs-accent)]">
                  {formatDate(event.startTime)}
                </span>
                <span className="text-lg font-semibold text-[var(--fs-ink)] leading-tight">
                  {formatTime(event.startTime)}
                </span>
              </div>

              {/* Divider */}
              <div className="h-10 w-px bg-[var(--fs-rule)]" />

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--fs-ink)] truncate">
                  {event.name}
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1 text-xs text-[var(--fs-ink-faint)]">
                    <Clock className="w-3 h-3" />
                    {durationMin(event.startTime, event.endTime)} min
                  </span>
                  {event.invitees.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-[var(--fs-ink-faint)]">
                      <Users className="w-3 h-3" />
                      {event.invitees[0].name}
                    </span>
                  )}
                  {event.location && (
                    <span className="flex items-center gap-1 text-xs text-[var(--fs-ink-faint)]">
                      <LocationIcon type={event.location.type} />
                      {event.location.join_url
                        ? 'Video call'
                        : event.location.location || 'TBD'}
                    </span>
                  )}
                </div>
              </div>

              {/* Join/View button */}
              {event.location?.join_url ? (
                <a
                  href={event.location.join_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-[var(--fs-accent-bg)] p-2 text-[var(--fs-accent)] opacity-0 transition-colors group-hover:opacity-100 hover:bg-[var(--fs-accent-bg)]/80"
                  title="Join call"
                >
                  <Video className="w-4 h-4" />
                </a>
              ) : (
                <ChevronRight className="w-4 h-4 text-[var(--fs-ink-disabled)] opacity-0 transition-opacity group-hover:opacity-100" />
              )}
            </div>
          ))}

          {events.length > 5 && (
            <p className="pt-1 text-center text-xs text-[var(--fs-ink-faint)]">
              +{events.length - 5} more meetings
            </p>
          )}
        </div>
      )}
    </GlassCard>
  );
}
