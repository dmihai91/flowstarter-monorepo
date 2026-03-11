'use client';

import { useEffect, useState, useCallback } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import {
  Calendar, Clock, Users, Video, MapPin, ExternalLink,
  ChevronRight, RefreshCw,
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
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function durationMin(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
}

function LocationIcon({ type }: { type?: string }) {
  if (type === 'google_conference' || type === 'zoom' || type === 'microsoft_teams')
    return <Video className="w-3.5 h-3.5" />;
  return <MapPin className="w-3.5 h-3.5" />;
}

export function UpcomingMeetingsCard({ projectId }: Props) {
  const [events, setEvents] = useState<CalendlyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/calendly/events?projectId=${projectId}&days=14`);
      const data = (await res.json()) as { events?: CalendlyEvent[]; error?: string };
      if (data.events) {
        setEvents(data.events);
        setError(null);
      } else {
        setError(data.error || 'No events');
      }
    } catch {
      setError('Failed to load');
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Don't render if Calendly not configured
  if (error === 'Calendly not configured with API key') return null;

  return (
    <GlassCard className="p-5 col-span-1 sm:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-white/70">
            Upcoming Meetings
          </h3>
        </div>
        <button
          onClick={fetchEvents}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && events.length === 0 ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-6">
          <Calendar className="w-8 h-8 text-gray-300 dark:text-white/20 mx-auto mb-2" />
          <p className="text-sm text-gray-400 dark:text-white/40">No upcoming meetings</p>
          <p className="text-xs text-gray-300 dark:text-white/20 mt-1">
            New bookings will appear here automatically
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.slice(0, 5).map((event) => (
            <div
              key={event.uri}
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 hover:border-[var(--purple)]/20 transition-colors group"
            >
              {/* Date badge */}
              <div className="flex flex-col items-center min-w-[48px]">
                <span className="text-[0.65rem] font-medium text-[var(--purple)] uppercase">
                  {formatDate(event.startTime)}
                </span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">
                  {formatTime(event.startTime)}
                </span>
              </div>

              {/* Divider */}
              <div className="w-px h-10 bg-gray-200 dark:bg-white/10" />

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {event.name}
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-white/40">
                    <Clock className="w-3 h-3" />
                    {durationMin(event.startTime, event.endTime)} min
                  </span>
                  {event.invitees.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-white/40">
                      <Users className="w-3 h-3" />
                      {event.invitees[0].name}
                    </span>
                  )}
                  {event.location && (
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-white/40">
                      <LocationIcon type={event.location.type} />
                      {event.location.join_url ? 'Video call' : event.location.location || 'TBD'}
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
                  className="p-2 rounded-lg bg-[var(--purple)]/10 text-[var(--purple)] hover:bg-[var(--purple)]/20 transition-colors opacity-0 group-hover:opacity-100"
                  title="Join call"
                >
                  <Video className="w-4 h-4" />
                </a>
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-300 dark:text-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
          ))}

          {events.length > 5 && (
            <p className="text-xs text-center text-gray-400 dark:text-white/30 pt-1">
              +{events.length - 5} more meetings
            </p>
          )}
        </div>
      )}
    </GlassCard>
  );
}
