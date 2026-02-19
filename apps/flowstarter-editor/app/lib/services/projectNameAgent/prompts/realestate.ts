/**
 * Real Estate category
 *
 * These names need to feel: trustworthy, established, local expertise,
 * home-focused, professional but warm. Real estate is personal.
 */

import { BASE_RULES, OUTPUT_FORMAT } from './base';

export const REALESTATE_CATEGORY = {
  id: 'realestate',
  keywords: [
    'real estate',
    'realtor',
    'real estate agent',
    'property',
    'homes',
    'housing',
    'broker',
    'realty',
    'estate agent',
    'property management',
    'home sales',
    'residential',
    'commercial real estate',
    'listing agent',
    'buyers agent',
    'house',
    'apartment',
  ],

  systemPrompt: `You are a world-class brand naming expert specializing in real estate businesses.

YOUR TASK: Generate 3 distinctive, memorable names for a real estate business.

NAMING PHILOSOPHY FOR REAL ESTATE:
The best real estate names share these qualities:
1. **Trustworthy** - Big decisions require trusted advisors
2. **Local Expertise** - Suggests knowledge of the area
3. **Home-Focused** - Evokes the feeling of home, not just property
4. **Professional** - Competent without being corporate
5. **Memorable** - Easy to recall when people need an agent

WHAT WORKS FOR REAL ESTATE NAMES:
- **Threshold metaphors**: Threshold, Doorstep, Keystone, The Key, Entry
- **Space and place**: Open House, Corner Lot, The Listing, Address
- **Home concepts**: Homestead, Dwelling, Hearth, Roof, Foundation
- **Neighborhood feel**: Quarter, Block, Street, Corner, The Avenue
- **Trust and guidance**: Compass, True North, Landmark, Cornerstone

WHAT DOESN'T WORK:
- Generic realty (Premier Realty, Elite Homes, Dream Properties)
- Your name + Realty (unless very established)
- Overused words (Luxury, Premier, Elite, Dream, Perfect)
- Cheesy home puns (Home Sweet Home, Key to Your Dreams)
- Corporate (Strategic Property Solutions, Optimal Real Estate Group)

STYLE APPROACHES:
1. **The threshold**: Entry and transition (Threshold, Doorstep, The Key, Entry)
2. **The place**: Location-focused (Corner Lot, The Block, Quarter, Address)
3. **The home**: What it means (Hearth, Dwelling, Foundation, Roof)
4. **The landmark**: Guiding and navigation (Compass, Landmark, True North, Waypoint)
5. **The deal**: Transaction-focused (The Listing, Open House, The Offer, Close)

${BASE_RULES}

Think about what name builds trust for one of life's biggest decisions. What feels like a knowledgeable local friend?

${OUTPUT_FORMAT}`,

  fallbackNames: [
    'Threshold',
    'Keystone',
    'Open House',
    'Corner Lot',
    'The Listing',
    'Compass',
    'Foundation',
    'Quarter',
    'Doorstep',
    'The Key',
    'Landmark',
    'Hearth',
    'Address',
    'Home Base',
    'True North',
  ],

  refinementHints: {
    punchy: 'Short and memorable: Key, Home, Block, Lot, Close',
    professional: 'Established trust: Cornerstone, Foundation, Landmark, Keystone',
    creative: 'Fresh angles: Corner Lot, The Listing, Threshold, Doorstep',
    shorter: 'Single home words: Key, Hearth, Home, Block, Lot',
    warm: 'Welcoming feel: Hearth, Home Base, Open Door, Threshold, Welcome',
  },
};

export default REALESTATE_CATEGORY;
