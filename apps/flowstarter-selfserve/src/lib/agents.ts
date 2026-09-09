// The agent crew presentation — Vera/Iris/Quinn/Dash, ported from the design bundle.
// Pure presentation data; safe on client and server.

export type AgentId = 'research' | 'brand' | 'copy' | 'dev';

export interface AgentMeta {
  id: AgentId;
  name: string;
  role: string;
  color: string; // css var, stable across themes
  blurb: string;
}

export const AGENTS: Record<AgentId, AgentMeta> = {
  research: {
    id: 'research',
    name: 'Vera',
    role: 'Researcher',
    color: 'var(--role-research)',
    blurb: 'Figures out who your customers are and what makes them pick you.',
  },
  brand: {
    id: 'brand',
    name: 'Iris',
    role: 'Brand',
    color: 'var(--role-brand)',
    blurb: 'Gives your business a face: the name, the colors, the look.',
  },
  copy: {
    id: 'copy',
    name: 'Quinn',
    role: 'Copywriter',
    color: 'var(--role-copy)',
    blurb: 'Writes your pages the way you actually talk.',
  },
  dev: {
    id: 'dev',
    name: 'Dash',
    role: 'Developer',
    color: 'var(--role-dev)',
    blurb: 'Puts the site together and makes the forms work.',
  },
};

export const AGENT_LIST: AgentMeta[] = [AGENTS.research, AGENTS.brand, AGENTS.copy, AGENTS.dev];

// Deliverables timeline — what the crew produces during a paid build.
export interface PlanStep {
  id: string;
  agent: AgentId;
  label: string;
  artifact: string;
}

export const BUILD_PLAN: PlanStep[] = [
  { id: 'name', agent: 'brand', label: 'Name & identity', artifact: 'brand' },
  { id: 'research', agent: 'research', label: 'Audience & positioning', artifact: 'positioning' },
  { id: 'voice', agent: 'copy', label: 'Voice & homepage copy', artifact: 'copy' },
  { id: 'site', agent: 'dev', label: 'Site assembly', artifact: 'site' },
  { id: 'booking', agent: 'dev', label: 'Contact & booking', artifact: 'booking' },
];

export const ARTIFACT_META: Record<string, { label: string; icon: string; agent: AgentId }> = {
  brand: { label: 'Brand identity', icon: 'brush', agent: 'brand' },
  positioning: { label: 'Positioning', icon: 'search', agent: 'research' },
  copy: { label: 'Homepage copy', icon: 'pen', agent: 'copy' },
  site: { label: 'Website', icon: 'globe', agent: 'dev' },
  booking: { label: 'Contact & booking', icon: 'cal', agent: 'dev' },
};
