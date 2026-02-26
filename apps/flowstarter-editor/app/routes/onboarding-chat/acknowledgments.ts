// ═══════════════════════════════════════════════════════════════════════════
// VARIED ACKNOWLEDGMENTS - Adds personality and avoids repetition
// ═══════════════════════════════════════════════════════════════════════════

/** Enthusiastic acknowledgments for positive moments */
const ENTHUSIASTIC_ACKS = [
  'Love it!', 'Awesome!', 'Perfect!', 'That\'s great!', 'Brilliant!',
  'Excellent choice!', 'Nice one!', 'Fantastic!', 'That works!', 'Beautiful!',
];

/** Approving acknowledgments for confirmations */
const APPROVING_ACKS = [
  'Great choice!', 'Solid pick!', 'Nice!', 'Good stuff!', 'That\'ll work great!',
  'Smart choice!', 'Sounds good!', 'I like it!', 'Works for me!', 'On point!',
];

/** Encouraging acknowledgments for progress */
const ENCOURAGING_ACKS = [
  'We\'re making progress!', 'Getting there!', 'Coming together nicely!',
  'Looking good!', 'This is shaping up!', 'On the right track!',
];

/** Get a random acknowledgment from a pool, optionally seeded for consistency */
function getRandomAck(pool: string[], seed?: string): string {
  // Use seed for deterministic selection within a session, or random
  const index = seed 
    ? Math.abs(seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % pool.length
    : Math.floor(Math.random() * pool.length);
  return pool[index];
}

/** Get an enthusiastic ack (for exciting moments) */
export const enthusiasticAck = (seed?: string) => getRandomAck(ENTHUSIASTIC_ACKS, seed);

/** Get an approving ack (for good choices) */
export const approvingAck = (seed?: string) => getRandomAck(APPROVING_ACKS, seed);

/** Get an encouraging ack (for progress) */  
export const encouragingAck = (seed?: string) => getRandomAck(ENCOURAGING_ACKS, seed);
