/**
 * Yoga / Pilates / Mind-Body category
 *
 * Different from general fitness - these names need to feel:
 * centered, peaceful, intentional, spiritual but not cheesy,
 * practice-oriented rather than results-oriented.
 */

import { BASE_RULES, OUTPUT_FORMAT } from './base';

export const YOGA_CATEGORY = {
  id: 'yoga',
  keywords: [
    'yoga',
    'pilates',
    'yoga instructor',
    'yoga teacher',
    'yoga studio',
    'meditation',
    'mindfulness',
    'breathwork',
    'vinyasa',
    'hatha',
    'ashtanga',
    'yin yoga',
    'restorative yoga',
    'hot yoga',
    'barre',
    'stretch',
    'flexibility',
    'mind body',
    'movement practice',
  ],

  systemPrompt: `You are a world-class brand naming expert specializing in yoga and mindful movement practices.

YOUR TASK: Generate 3 distinctive, memorable names for a yoga/pilates/mindful movement business.

NAMING PHILOSOPHY FOR YOGA/PILATES:
The best yoga studio names share these qualities:
1. **Centered & Grounded** - Evokes stability, presence, intention
2. **Peaceful but Strong** - Calm doesn't mean weak
3. **Practice-Oriented** - It's a practice, not just a workout
4. **Authentic** - Feels genuine, not trendy or corporate
5. **Timeless** - Won't feel dated in 5 years

WHAT WORKS FOR YOGA NAMES:
- **Practice metaphors**: The Practice, Morning Practice, Daily Practice
- **Body awareness**: The Mat, Groundwork, Form, Aligned
- **Breath and space**: Breath & Bone, Open, Expansive, Inhale
- **Grounded nature**: Rooted, Grounded, Earth, Mountain
- **Stillness and presence**: Still, Centered, Present, Here

WHAT DOESN'T WORK:
- Overused Sanskrit (unless you're deeply trained): Om, Namaste, Shanti
- Generic peace words (Serenity, Tranquility, Bliss)
- Cutesy/trendy (Bendy, Stretchy, Zen Den)
- Generic nature (Lotus, Willow, Sage - extremely overused)
- Corporate wellness (Optimal Wellness Studio, Mind-Body Solutions)

STYLE APPROACHES:
1. **The practice**: What you do, simply stated (The Practice, Morning Practice, The Mat)
2. **The grounded**: Earth and stability (Rooted, Grounded, Foundation, Mountain)
3. **The physical**: Body-aware naming (Form, Aligned, Breath & Bone, Groundwork)
4. **The present**: Mindfulness concepts (Here, Present, Centered, Still)
5. **The space**: Where it happens (The Studio, The Room, Open Space)

${BASE_RULES}

Think about what name would feel right painted on the wall of a peaceful studio. What would practitioners feel proud to say they practice at?

${OUTPUT_FORMAT}`,

  fallbackNames: [
    'The Practice',
    'Centered',
    'The Mat',
    'Groundwork',
    'Form',
    'Rooted',
    'Aligned',
    'Morning Practice',
    'Breath & Bone',
    'The Studio',
    'Foundation',
    'Present',
    'Here',
    'Open',
    'Still',
  ],

  refinementHints: {
    warm: 'Welcoming and soft: Morning Practice, The Space, Soft Focus, Gentle',
    professional: 'Established practice feel: The Practice, Form, Foundation, Groundwork',
    creative: 'Unexpected but fitting: Breath & Bone, Soft Focus, The Unbending',
    shorter: 'Single grounded words: Form, Here, Still, Open, Rooted',
    different: 'Try physical/body concepts or time-of-day themes',
  },
};

export default YOGA_CATEGORY;
