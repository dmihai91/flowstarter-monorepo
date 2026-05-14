import { Calendar, Mail } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type IntegrationType = 'calendly' | 'cal-com' | 'mailchimp';

export interface Integration {
  id: string;
  project_id: string;
  integration_type: IntegrationType;
  name: string;
  config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name?: string | null;
  status?: string | null;
}

// ─── Static metadata ─────────────────────────────────────────────────────────

export const INTEGRATION_META: Record<
  IntegrationType,
  {
    name: string;
    description: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
    docsUrl: string;
    keyLabel: string;
    keyHelp: string;
    keyPlaceholder: string;
  }
> = {
  calendly: {
    name: 'Calendly',
    description: 'Appointment scheduling for client bookings',
    icon: Calendar,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    docsUrl: 'https://developer.calendly.com/getting-started',
    keyLabel: 'API Key',
    keyHelp: 'Calendly → Integrations → API & Webhooks → Generate Key',
    keyPlaceholder: 'eyJhbGciOiJIUzI1NiJ9...',
  },
  'cal-com': {
    name: 'Cal.com',
    description: 'Open-source scheduling infrastructure',
    icon: Calendar,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    docsUrl: 'https://cal.com/docs/api-reference/v1/introduction',
    keyLabel: 'API Key',
    keyHelp: 'Cal.com → Settings → Developer → API Keys → Add',
    keyPlaceholder: 'cal_live_...',
  },
  mailchimp: {
    name: 'Mailchimp',
    description: 'Email marketing and newsletter management',
    icon: Mail,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    docsUrl: 'https://mailchimp.com/developer/marketing/api/',
    keyLabel: 'API Key',
    keyHelp: 'Mailchimp → Account → Extras → API keys → Create A Key',
    keyPlaceholder: 'abc123...-us1',
  },
};

export const ALL_TYPES: IntegrationType[] = [
  'calendly',
  'cal-com',
  'mailchimp',
];
