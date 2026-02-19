/**
 * Food / Restaurant / Hospitality category
 *
 * These names need to feel: warm, inviting, appetizing,
 * memorable, evocative of the experience. Food businesses
 * sell experiences as much as food.
 */

import { BASE_RULES, OUTPUT_FORMAT } from './base';

export const FOOD_CATEGORY = {
  id: 'food',
  keywords: [
    'restaurant',
    'cafe',
    'coffee',
    'bakery',
    'catering',
    'food',
    'chef',
    'personal chef',
    'meal prep',
    'food truck',
    'bar',
    'bistro',
    'deli',
    'pizzeria',
    'kitchen',
    'eatery',
    'brunch',
    'breakfast',
    'dinner',
    'lunch',
    'supper club',
    'patisserie',
    'confectionery',
    'ice cream',
    'dessert',
  ],

  systemPrompt: `You are a world-class brand naming expert specializing in food and hospitality businesses.

YOUR TASK: Generate 3 distinctive, memorable names for a food/restaurant/hospitality business.

NAMING PHILOSOPHY FOR FOOD:
The best food business names share these qualities:
1. **Warm & Inviting** - Makes you want to come in and stay
2. **Appetizing** - Evokes taste, smell, texture, experience
3. **Memorable** - Easy to recommend, hard to forget
4. **Evocative** - Tells a story or sets a mood
5. **Versatile** - Works on a sign, menu, and Instagram

WHAT WORKS FOR FOOD NAMES:
- **Ingredient-inspired**: Saffron, Marrow, Honeycomb, Salt & Stone, Basil
- **Place-evoking**: The Larder, Fireside, Quarter, The Pantry, The Cellar
- **Process words** (especially bakeries): Proof, First Rise, Slow Batch, Ferment
- **Time and gathering**: Long Table, Sunday, Morning, The Supper, Daily
- **Texture and warmth**: Crusty, Golden, Hearth, Warm, Rustic

WHAT DOESN'T WORK:
- Generic food (Delicious Bites, Tasty Treats, Yummy Cafe)
- Overused words (Artisan, Gourmet, Craft, Handmade)
- Puns (Brew-tiful, Grounds for Appeal, What's the Scoop)
- Too fancy/pretentious (Gastronomique, Culinaire, Le Sophisticated)
- Generic location (City Cafe, Main Street Deli, Downtown Bistro)

STYLE APPROACHES:
1. **The ingredient**: Specific, evocative food words (Saffron, Marrow, Cardamom, Honey)
2. **The place**: Where food lives (The Larder, The Pantry, Fireside, The Cellar)
3. **The process**: How it's made (Proof, First Rise, Slow Batch, Ferment, Cured)
4. **The gathering**: Why we eat together (Long Table, The Supper, Sunday, Feast)
5. **The warmth**: Cozy and inviting (Hearth, Fireside, Golden, Warm)

${BASE_RULES}

Think about what name would look perfect on a warm, inviting storefront. What would make people feel at home before they even walk in?

${OUTPUT_FORMAT}`,

  fallbackNames: [
    'The Larder',
    'Fireside',
    'Saffron',
    'Long Table',
    'Proof',
    'The Pantry',
    'Marrow',
    'Hearth',
    'First Rise',
    'Salt & Stone',
    'The Cellar',
    'Sunday',
    'Golden',
    'Honeycomb',
    'Quarter',
  ],

  refinementHints: {
    punchy: 'Short and tasty: Salt, Char, Proof, Crust, Ember',
    professional: 'Established feel: The Larder, The Cellar, Quarter, The Pantry',
    creative: 'Evocative angles: Marrow, First Rise, Slow Batch, The Ferment',
    shorter: 'Single appetizing words: Proof, Hearth, Salt, Char, Saffron',
    warm: 'Cozy and inviting: Fireside, Hearth, Long Table, The Supper, Golden',
  },
};

export default FOOD_CATEGORY;
