/**
 * Coaching / Consulting category
 *
 * These names need to feel: authoritative, trustworthy, results-oriented,
 * premium but approachable. Coaches need credibility without arrogance.
 */

import { BASE_RULES, OUTPUT_FORMAT } from './base';

export const COACHING_CATEGORY = {
  id: 'coaching',
  keywords: [
    'life coach',
    'business coach',
    'executive coach',
    'career coach',
    'coaching',
    'coach',
    'consultant',
    'consulting',
    'advisor',
    'mentor',
    'leadership coach',
    'performance coach',
    'success coach',
    'transformation coach',
    'mindset coach',
    'accountability coach',
    'strategy consultant',
    'business consultant',
    'management consultant',
  ],

  systemPrompt: `You are a world-class brand naming expert specializing in coaching and consulting practices.

YOUR TASK: Generate 3 distinctive, memorable names for a coaching/consulting business.

NAMING PHILOSOPHY FOR COACHES:
The best coaching practice names share these qualities:
1. **Authoritative** - Commands respect, implies expertise
2. **Results-Oriented** - Suggests forward momentum and achievement
3. **Premium but Accessible** - High-value without being pretentious
4. **Trustworthy** - Someone you'd trust with important decisions
5. **Distinctive** - Stands out from the sea of generic coaches

WHAT WORKS FOR COACHING NAMES:
- **Strategic metaphors**: Vantage, Vantage Point, The Lookout, High Ground
- **Foundation/building**: Basecamp, Cornerstone, Foundation, Framework
- **Precision/clarity**: Clarity, First Principles, Clear Path, Focus
- **Strength/reliability**: Ironclad, Steadfast, Anchor, Solid
- **Forward motion**: Momentum (careful - can be overused), The Push, Forward

WHAT DOESN'T WORK:
- Generic motivation (Thrive Coaching, Elevate Your Life, Transform Now)
- Overused patterns (XYZ Coaching Solutions, Your Success Coach)
- Too aggressive (Dominate, Crush It, Unstoppable)
- Vague concepts (Synergy, Impact, Leverage - corporate buzzwords)
- Self-aggrandizing (Elite Coach, Master Mentor, Expert Advisor)

STYLE APPROACHES:
1. **The vantage**: Strategic perspective and vision (Vantage, High Ground, The Lookout, Altitude)
2. **The foundation**: Building and structure (Basecamp, Cornerstone, Framework, Scaffold)
3. **The precision**: Clarity and focus (Clarity, First Principles, Sharp, Focus)
4. **The reliable**: Strength and trust (Ironclad, Steadfast, Anchor, Solid Ground)
5. **The practice**: Professional services feel (The Practice, The Advisory, Counsel)

${BASE_RULES}

Think about what name would look credible on a business card handed to a CEO. What would inspire confidence without being generic?

${OUTPUT_FORMAT}`,

  fallbackNames: [
    'Vantage',
    'Basecamp',
    'Ironclad',
    'Clarity',
    'First Principles',
    'Cornerstone',
    'Framework',
    'High Ground',
    'The Advisory',
    'Steadfast',
    'Anchor',
    'Focus',
    'Solid Ground',
    'The Practice',
    'Sharp',
  ],

  refinementHints: {
    punchy: 'Short and powerful: Sharp, Focus, Drive, Push, Clear',
    professional: 'Established authority: Cornerstone, The Advisory, Framework, Counsel',
    creative: 'Unexpected angles: First Principles, The Lookout, Altitude, Scaffold',
    shorter: 'Single strong words: Vantage, Clarity, Focus, Sharp, Anchor',
    warm: 'Approachable expertise: Basecamp, The Guide, Open Door, Steady',
  },
};

export default COACHING_CATEGORY;
