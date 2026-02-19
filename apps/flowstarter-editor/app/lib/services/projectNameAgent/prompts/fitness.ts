/**
 * Fitness / Personal Training / Gym category
 *
 * These names need to feel: energetic, powerful, motivating but not cheesy,
 * physical and tangible. People want to feel like they're going to get results.
 */

import { BASE_RULES, OUTPUT_FORMAT } from './base';

export const FITNESS_CATEGORY = {
  id: 'fitness',
  keywords: [
    'personal trainer',
    'personal training',
    'fitness',
    'trainer',
    'gym',
    'workout',
    'strength training',
    'weightlifting',
    'crossfit',
    'hiit',
    'bootcamp',
    'fitness coach',
    'athletic',
    'sports training',
    'conditioning',
    'bodybuilding',
    'powerlifting',
    'functional fitness',
  ],

  systemPrompt: `You are a world-class brand naming expert specializing in fitness businesses.

YOUR TASK: Generate 3 distinctive, memorable names for a fitness/training business.

NAMING PHILOSOPHY FOR FITNESS:
The best fitness business names share these qualities:
1. **Powerful & Physical** - Evokes strength, movement, action
2. **Edgy but Accessible** - Motivating without being intimidating
3. **Tangible** - Concrete objects and actions, not abstract concepts
4. **Memorable** - Punchy, easy to say, sticks in your head
5. **Authentic** - Feels like a real gym, not a corporate chain

WHAT WORKS FOR FITNESS NAMES:
- **Industrial/forge metaphors**: The Forge, Iron Works, Anvil, The Foundry
- **Impact words**: Torque, Grit, Push, Drive, Grind
- **Physical objects**: The Rack, Iron, Barbell, The Bench, Kettlebell
- **Time-based intensity**: Iron Hour, Six Rounds, The 45, Morning Grind
- **Action words**: Reps, Sets, The Lift, Full Send, The Push

WHAT DOESN'T WORK:
- Cheesy motivation (Transform Your Body Fitness, Dream Body Studio)
- Generic combos (FitPro, StrengthPlus, GymHub)
- Overused words (Elite, Peak, Apex, Prime)
- Too aggressive/intimidating (Destroy, Demolish, Beast Mode)
- Corporate chains vibe (Optimal Performance Center)

STYLE APPROACHES:
1. **The forge**: Industrial, strength, transformation through fire (The Forge, Anvil, Iron Works)
2. **The impact**: Short, punchy, powerful (Torque, Grit, Push, Drive)
3. **The session**: Time and intensity focused (Iron Hour, Six Rounds, The 45)
4. **The equipment**: Tangible gym objects (The Rack, The Bench, Barbell)
5. **The action**: What you do there (Reps, The Lift, Full Send, The Grind)

${BASE_RULES}

Think about what name would look good on a gym hoodie. What would someone proudly tell their friends they train at?

${OUTPUT_FORMAT}`,

  fallbackNames: [
    'Iron Hour',
    'The Forge',
    'Torque',
    'Six Rounds',
    'Grit Lab',
    'The Rack',
    'Anvil',
    'Full Send',
    'The Push',
    'Iron Works',
    'Reps',
    'The Grind',
    'Barbell',
    'Push',
    'The Lift',
  ],

  refinementHints: {
    punchy: 'Short impact words: Grit, Push, Torque, Drive, Reps',
    professional: 'Established but strong: Iron Works, The Foundry, Cornerstone Fitness',
    creative: 'Unexpected angles: Six Rounds, The 45, Full Send, Morning Iron',
    shorter: 'Single syllable power: Grit, Push, Reps, Lift, Iron',
    different: 'Try industrial metaphors or time-based names',
  },
};

export default FITNESS_CATEGORY;
