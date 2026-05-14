export const MIN_DISCOVERY_NOTE_WORDS = 15;

export function discoveryNotesWordCount(trimmed: string): number {
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export function discoveryNotesMeetMinimum(trimmed: string): boolean {
  return discoveryNotesWordCount(trimmed) >= MIN_DISCOVERY_NOTE_WORDS;
}

export type Step = 1 | 2 | 3 | 4;

export interface BriefData {
  // Client
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientBusinessName: string;
  // Brief
  description: string;
  industry: string;
  targetAudience: string;
  uvp: string;
  brandTone: 'professional' | 'bold' | 'friendly' | '';
  goal: 'leads' | 'sales' | 'bookings' | '';
  // Setup
  tier: 'essential' | 'pro' | 'commerce' | 'custom' | '';
  commerceMode:
    | 'none'
    | 'shopify_external'
    | 'shopify_native'
    | 'custom_inhouse'
    | '';
  isFounding: boolean;
  billingInterval: 'monthly' | 'annual';
}

export const EMPTY_BRIEF: BriefData = {
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  clientBusinessName: '',
  description: '',
  industry: '',
  targetAudience: '',
  uvp: '',
  brandTone: '',
  goal: '',
  tier: '',
  commerceMode: '',
  isFounding: false,
  billingInterval: 'monthly',
};

export const STEPS: Array<{ n: Step; title: string }> = [
  { n: 1, title: 'Discovery' },
  { n: 2, title: 'Client' },
  { n: 3, title: 'Brief' },
  { n: 4, title: 'Setup' },
];
