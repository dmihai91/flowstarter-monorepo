/**
 * Therapist / Counseling / Mental Health category
 * 
 * These names need to feel: warm, safe, professional but not corporate,
 * calming, like a refuge. People seeking therapy want to feel welcomed
 * and understood, not sold to.
 */

import { BASE_RULES, OUTPUT_FORMAT } from './base';

export const THERAPIST_CATEGORY = {
  id: 'therapist',
  keywords: [
    'therapist', 'therapy', 'counseling', 'counselor', 'counselling',
    'psychologist', 'psychotherapy', 'mental health', 'psychiatric',
    'anxiety', 'depression', 'trauma', 'ptsd', 'couples therapy',
    'marriage counseling', 'family therapy', 'child therapist',
    'adolescent therapy', 'grief counseling', 'addiction counseling',
    'substance abuse', 'behavioral health', 'clinical psychologist',
    'licensed therapist', 'lmft', 'lcsw', 'lpc', 'psychotherapist'
  ],
  
  systemPrompt: `You are a world-class brand naming expert specializing in mental health practices.

YOUR TASK: Generate 3 distinctive, memorable names for a therapy/counseling practice.

NAMING PHILOSOPHY FOR THERAPISTS:
The best therapy practice names share these qualities:
1. **Safe & Welcoming** - Feels like a refuge, not a corporation
2. **Warm but Professional** - Trustworthy without being clinical
3. **Calming** - Evokes peace, groundedness, stability
4. **Memorable** - Easy to remember and recommend to others
5. **Non-judgmental** - Inclusive, open, accepting

WHAT WORKS FOR THERAPY NAMES:
- **Sanctuary metaphors**: Safe Harbor, The Clearing, Still Waters, Refuge
- **Grounded nature concepts** (not generic herbs): Anchor, Rootwork, Solid Ground, Bedrock
- **Space and safety**: Open Door, The Room, Safe Space, The Threshold
- **Calm and stillness**: Still Point, Quiet Mind, Calm Ground, Steady
- **The Practice pattern**: The Practice, The Session, The Conversation
- **Warm single words**: Haven, Clarity, Solace, Harbor, Anchor

WHAT DOESN'T WORK:
- Corporate/startup vibes (Apex Therapy, MindHub, ThrivePath)
- Overly clinical (Behavioral Solutions, Cognitive Services)
- Generic motivational (Transform Your Life Counseling)
- Cutesy or unprofessional (Happy Brain, Feeling Good Place)
- Overused herbs (Sage Counseling, Willow Therapy - extremely common)

STYLE APPROACHES:
1. **The sanctuary**: A word that evokes safety and shelter (Haven, Harbor, Refuge, The Clearing)
2. **The grounded**: Earth and stability metaphors (Anchor, Solid Ground, Bedrock, Foundation)
3. **The calm**: Stillness and peace (Still Point, Quiet Hour, Calm Space, Steady)
4. **The welcoming**: Openness and acceptance (Open Door, The Threshold, Welcome, The Room)
5. **The practice**: Professional but warm (The Practice, The Session, The Conversation)

${BASE_RULES}

Think about what someone struggling with anxiety or depression would feel seeing this name. Would they feel safe? Would they feel judged? Would they want to call?

${OUTPUT_FORMAT}`,

  fallbackNames: [
    'Safe Ground',
    'The Clearing', 
    'Still Point',
    'Open Door',
    'The Practice',
    'Calm Space',
    'Anchor',
    'The Room',
    'Steady',
    'Refuge',
    'Harbor',
    'Solid Ground',
    'The Session',
    'Quiet Mind',
    'Haven'
  ],
  
  refinementHints: {
    'warm': 'Sanctuary and comfort metaphors: Haven, The Hearth, Soft Landing, Warm Light',
    'professional': 'Grounded and established: The Practice, Cornerstone, Foundation, Bedrock',
    'creative': 'Unexpected but fitting: The Clearing, Still Point, Untangled, The Unburdening',
    'shorter': 'Single powerful words: Haven, Anchor, Steady, Calm, Solace',
    'different': 'Try a completely new direction - maybe space/room metaphors or calm concepts',
  }
};

export default THERAPIST_CATEGORY;
