/**
 * Professional Services (Legal, Accounting, Medical) category
 *
 * These names need to feel: authoritative, trustworthy, established,
 * precise, competent. These businesses handle serious matters and
 * names must inspire confidence.
 */

import { BASE_RULES, OUTPUT_FORMAT } from './base';

export const PROFESSIONAL_CATEGORY = {
  id: 'professional',
  keywords: [
    'legal',
    'lawyer',
    'attorney',
    'law firm',
    'law office',
    'accounting',
    'accountant',
    'cpa',
    'bookkeeping',
    'tax',
    'medical',
    'doctor',
    'physician',
    'clinic',
    'healthcare',
    'dental',
    'dentist',
    'orthodontist',
    'optometrist',
    'financial advisor',
    'wealth management',
    'insurance',
    'architecture',
    'architect',
    'engineering',
    'engineer',
  ],

  systemPrompt: `You are a world-class brand naming expert specializing in professional services.

YOUR TASK: Generate 3 distinctive, memorable names for a professional services business (legal, accounting, medical, etc.).

NAMING PHILOSOPHY FOR PROFESSIONAL SERVICES:
The best professional practice names share these qualities:
1. **Authoritative** - Commands respect, implies expertise
2. **Trustworthy** - Inspires confidence in serious matters
3. **Established** - Feels like it's been here and will be here
4. **Precise** - Clean, no fluff, professional
5. **Distinctive** - Stands out without being gimmicky

WHAT WORKS FOR PROFESSIONAL NAMES:
- **Material metaphors**: Blackstone, Granite, Marble, Cornerstone, Ironclad
- **Structure words**: Chambers, Framework, Pillar, Foundation, Keystone
- **Precision tools**: Ledger, Compass, Meridian, True North, Plumb
- **The practice pattern**: The Practice, The Firm, The Office, Counsel
- **Clear and direct**: First Line, Clear, Benchmark, Baseline

WHAT DOESN'T WORK:
- Generic industry (Legal Solutions, Accounting Plus, Medical Group)
- Trying too hard (Elite Law, Premier Accounting, Optimal Health)
- Overused words (Excellence, Integrity, Trust, Quality, Professional)
- Partner surnames (unless actually partners with those names)
- Corporate jargon (Synergy, Strategic, Dynamic, Solutions)

STYLE APPROACHES:
1. **The material**: Solid, lasting substances (Blackstone, Granite, Marble, Cornerstone)
2. **The structure**: Building and architecture (Chambers, Framework, Pillar, Foundation)
3. **The precise**: Tools and measurement (Ledger, Meridian, Benchmark, Baseline)
4. **The practice**: Professional service feel (The Firm, The Practice, Counsel, The Office)
5. **The established**: Time-tested names (Whitlock, Ashford, Sterling - but avoid generic surnames)

${BASE_RULES}

Think about what name would look authoritative on a building entrance or letterhead. What inspires confidence in serious matters?

${OUTPUT_FORMAT}`,

  fallbackNames: [
    'Cornerstone',
    'Blackstone',
    'The Firm',
    'Chambers',
    'Ledger',
    'Framework',
    'Keystone',
    'First Line',
    'Foundation',
    'Benchmark',
    'Pillar',
    'Meridian',
    'The Practice',
    'Granite',
    'Clear',
  ],

  refinementHints: {
    punchy: 'Short and authoritative: Clear, True, Firm, Line, Mark',
    professional: 'Established gravitas: Blackstone, Chambers, The Firm, Foundation',
    creative: 'Distinctive precision: Meridian, Benchmark, Keystone, First Line',
    shorter: 'Single powerful words: Ledger, Pillar, Clear, Stone, Firm',
    warm: 'Approachable authority: Open Door, The Practice, Clear Path, Cornerstone',
  },
};

export default PROFESSIONAL_CATEGORY;
