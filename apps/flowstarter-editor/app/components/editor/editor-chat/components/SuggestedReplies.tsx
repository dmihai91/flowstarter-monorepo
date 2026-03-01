import { motion } from 'framer-motion';
import type { SuggestedReply, OnboardingStep } from '~/components/editor/editor-chat/types';
import { EDITOR_LABEL_KEYS, t } from '~/lib/i18n/editor-labels';

interface SuggestedRepliesProps {
  suggestions: SuggestedReply[];
  step: OnboardingStep;
  isDark: boolean;
  onAccept: (suggestion: SuggestedReply) => void;
  onRefresh?: () => void;
}

// Service-specific icons mapped by suggestion ID
const SERVICE_ICONS: Record<string, React.ReactNode> = {
  // Post-creation action prompts
  customize: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
      />
    </svg>
  ),
  'add-feature': (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
  explain: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
      />
    </svg>
  ),

  // Wellness & Coaching
  coach: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
      />
    </svg>
  ),
  fitness: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12h1m3 0h12m3 0h1M6 12a2 2 0 01-2-2V8a1 1 0 011-1h1a1 1 0 011 1v2a2 2 0 01-2 2zm0 0a2 2 0 00-2 2v2a1 1 0 001 1h1a1 1 0 001-1v-2a2 2 0 00-2-2zm12 0a2 2 0 002-2V8a1 1 0 00-1-1h-1a1 1 0 00-1 1v2a2 2 0 002 2zm0 0a2 2 0 012 2v2a1 1 0 01-1 1h-1a1 1 0 01-1-1v-2a2 2 0 012-2z"
      />
    </svg>
  ),
  yoga: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="5" r="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v4m0 0l-4 4m4-4l4 4M4 21l4-4m12 4l-4-4" />
    </svg>
  ),
  nutrition: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 2C9.5 2 9 5 9 7c0 1.5.5 2.5 1 3l-1 10c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2l-1-10c.5-.5 1-1.5 1-3 0-2-.5-5-3-5z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v3" />
    </svg>
  ),

  // Beauty & Personal Care
  nails: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3C10 3 8 5 8 8v4c0 1 .5 2 1.5 2h5c1 0 1.5-1 1.5-2V8c0-3-2-5-4-5z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14v5a2 2 0 002 2v0a2 2 0 002-2v-5" />
      <circle cx="12" cy="7" r="1.5" fill="currentColor" />
    </svg>
  ),
  barber: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7L5 19m7-7L5 5" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  salon: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l-7 7m7-7L5 5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 5l-4 4" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  spa: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21c-4 0-7-2-7-5 0-2 1-3.5 3-4.5-.5-1-1-2.5-1-4 0-3 2.5-5.5 5-5.5s5 2.5 5 5.5c0 1.5-.5 3-1 4 2 1 3 2.5 3 4.5 0 3-3 5-7 5z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 10l3 2 3-2" />
    </svg>
  ),

  // Health & Therapy
  psychologist: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4.5c-3.5 0-6 2.5-6 6 0 2.5 1.5 4.5 3.5 5.5l-.5 4 3-2 3 2-.5-4c2-1 3.5-3 3.5-5.5 0-3.5-2.5-6-6-6z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 10c0 .5.5 1 1.5 1s1.5-.5 1.5-1-.5-2-1.5-2-1.5 1.5-1.5 2zm4.5 0c0 .5.5 1 1.5 1"
      />
    </svg>
  ),
  dental: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 2c-2.5 0-4.5 1-5.5 2.5C5.5 6 5 8 5 10c0 3 1 5 1.5 7 .5 2 1 4 1.5 5 .3.6.8 1 1.5 1 .5 0 1-.3 1.2-.8l.8-2.2c.3-.7 1-.7 1.3 0l.7 2.2c.2.5.7.8 1.2.8.7 0 1.2-.4 1.5-1 .5-1 1-3 1.5-5 .5-2 1.5-4 1.5-7 0-2-.5-4-1.5-5.5C16.5 3 14.5 2 12 2z"
      />
    </svg>
  ),
  massage: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 11c-1.5 0-3 1-3 3v4a2 2 0 002 2h12a2 2 0 002-2v-4c0-2-1.5-3-3-3"
      />
      <ellipse cx="12" cy="8" rx="5" ry="3" />
      <circle cx="12" cy="5" r="2" />
    </svg>
  ),
  physio: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="5" r="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l-3 5M12 12l3 5M8 12h8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 10l2-2M8 10l-2-2" />
    </svg>
  ),

  // Professional Services
  lawyer: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v3M3 14h18M5 14l2-5h10l2 5M7 14v5a2 2 0 002 2h6a2 2 0 002-2v-5"
      />
      <circle cx="12" cy="6" r="2" />
    </svg>
  ),
  accounting: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 8h2v2H8zM8 12h2v2H8zM8 16h2M14 8h2M14 12h2M14 16h2v-2h-2z"
      />
    </svg>
  ),
  photography: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
      />
    </svg>
  ),
  realestate: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V9l7-6 7 6v12M9 21v-6h6v6" />
      <rect x="9" y="11" width="2" height="2" />
      <rect x="13" y="11" width="2" height="2" />
    </svg>
  ),

  // Ready state action icons
  headline: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h18M3 10h14M3 15h10M3 20h6" />
    </svg>
  ),
  story: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
      />
    </svg>
  ),
  benefits: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  cta: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59"
      />
    </svg>
  ),
  photos: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
      />
    </svg>
  ),
  logo: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
      />
    </svg>
  ),
  colors: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z"
      />
    </svg>
  ),
  spacing: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
      />
    </svg>
  ),
  'contact-form': (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
      />
    </svg>
  ),
  booking: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
      />
    </svg>
  ),
  testimonials: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
      />
    </svg>
  ),
  gallery: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6zM3.75 15.75l2.25-2.25 2.25 2.25M8.25 12l3.75-3.75 4.5 4.5M16.5 8.25h.008v.008h-.008V8.25z"
      />
    </svg>
  ),
  faq: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
      />
    </svg>
  ),
  social: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
      />
    </svg>
  ),
  map: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
      />
    </svg>
  ),
  pricing: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

// Default sparkle icon for unmatched suggestions
const DEFAULT_ICON = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
    />
  </svg>
);

// Get icon by suggestion ID
const getSuggestionIcon = (suggestion: SuggestedReply) => {
  return SERVICE_ICONS[suggestion.id] || DEFAULT_ICON;
};

export function SuggestedReplies({ suggestions, step, isDark, onAccept, onRefresh }: SuggestedRepliesProps) {
  if (suggestions.length === 0) {
    return null;
  }

  if (step === 'welcome' || step === 'describe') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="ml-0 sm:ml-10 mt-3 sm:mt-4"
        data-testid="suggested-replies"
      >
        <div className="flex items-center justify-between mb-3">
          <p
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)' }}
          >
            {t(EDITOR_LABEL_KEYS.SUGGESTIONS_LABEL)}
          </p>
          {onRefresh && (
            <motion.button
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={onRefresh}
              className="p-1 rounded-full transition-colors"
              style={{
                color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
                background: 'transparent',
              }}
              title={t(EDITOR_LABEL_KEYS.SUGGESTIONS_SHUFFLE)}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
            </motion.button>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={suggestion.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.12, delay: index * 0.03 }}
              whileHover={{ scale: 1.01, x: 2 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onAccept(suggestion)}
              data-testid={`suggestion-${suggestion.id}`}
              className="group px-3 py-2.5 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 text-left"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.65) 100%)',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 255, 255, 0.7)',
                boxShadow: isDark
                  ? '0 2px 8px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
                  : '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              }}
            >
              <span
                className="flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity mt-0.5"
                style={{ color: isDark ? 'rgba(77, 93, 217, 0.7)' : 'rgba(77, 93, 217, 0.8)' }}
              >
                {getSuggestionIcon(suggestion)}
              </span>
              <span className="leading-snug line-clamp-2">{suggestion.text}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    );
  }

  if (step === 'ready') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="ml-0 sm:ml-10 mt-3 sm:mt-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(77, 93, 217, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(77, 93, 217, 0.1) 0%, rgba(6, 182, 212, 0.06) 100%)',
            }}
          >
            <svg
              className="w-3 h-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke={isDark ? 'rgba(77, 93, 217, 0.7)' : 'rgba(77, 93, 217, 0.8)'}
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}
          >
            {t(EDITOR_LABEL_KEYS.SUGGESTIONS_CUSTOMIZE)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={suggestion.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.12, delay: index * 0.04 }}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onAccept(suggestion)}
              className="group px-3 py-2.5 rounded-xl text-sm flex items-center gap-2.5 text-left"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.6) 100%)',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 255, 255, 0.6)',
                boxShadow: isDark
                  ? '0 2px 8px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                  : '0 2px 8px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(16px) saturate(150%)',
                WebkitBackdropFilter: 'blur(16px) saturate(150%)',
              }}
            >
              <span
                className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150"
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(77, 93, 217, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)'
                    : 'linear-gradient(135deg, rgba(77, 93, 217, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%)',
                  color: isDark ? 'rgba(77, 93, 217, 0.7)' : 'rgba(77, 93, 217, 0.8)',
                }}
              >
                {getSuggestionIcon(suggestion)}
              </span>
              <span className="flex-1 leading-tight">{suggestion.text}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    );
  }

  // Name step and business-info step - show compact pill suggestions
  if (step === 'name' || step === 'business-summary') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="ml-0 sm:ml-10 mt-3 sm:mt-4"
      >
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => {
            // Highlight the accept/confirm action
            const isPrimary = suggestion.id === 'accept-name' || suggestion.id === 'confirm';

            return (
              <motion.button
                key={suggestion.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.12, delay: index * 0.03 }}
                whileHover={{ scale: 1.03, transition: { duration: 0.1 } }}
                whileTap={{ scale: 0.98, transition: { duration: 0.05 } }}
                onClick={() => onAccept(suggestion)}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-100"
                style={{
                  background: isPrimary
                    ? (isDark ? 'rgba(77, 93, 217, 0.25)' : 'rgba(77, 93, 217, 0.12)')
                    : isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.06)',
                  border: isPrimary
                    ? (isDark ? '1px solid rgba(77, 93, 217, 0.4)' : '1px solid rgba(77, 93, 217, 0.3)')
                    : isDark
                      ? '1px solid rgba(255, 255, 255, 0.12)'
                      : '1px solid rgba(0, 0, 0, 0.1)',
                  color: isPrimary ? (isDark ? '#8B9FFF' : '#4D5DD9') : isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
                  boxShadow: 'none',
                }}
              >
                {suggestion.text}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    );
  }

  return null;
}
