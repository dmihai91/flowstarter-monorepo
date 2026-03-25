'use client';

import { useState, useEffect, useRef } from 'react';

const EXAMPLES = [
  'Boutique dental clinic for busy professionals. Needs a polished website focused on consultations, implants, and whitening, with online booking.',
  'Local yoga studio offering in-person and online classes. Warm, calming vibe. Wants a simple booking system and newsletter signup.',
  'Freelance graphic designer looking to showcase portfolio and attract branding clients. Minimal, modern aesthetic.',
  'Family-run Italian restaurant in Cluj. Needs a menu, reservation form, and Google Maps integration. Warm and inviting tone.',
  'Personal fitness coach targeting women 30-45. Sells 1-on-1 coaching and online programs. Bold, motivational energy.',
  'Law firm specialising in corporate contracts. Professional, trustworthy tone. Needs contact form and service descriptions.',
  'E-commerce store selling handmade ceramics. Needs product showcase, Instagram feed, and Stripe checkout.',
];

interface Options {
  typeSpeed?:   number; // ms per char when typing
  deleteSpeed?: number; // ms per char when deleting
  pauseAfter?:  number; // ms to pause after full text
  pauseBefore?: number; // ms to pause before next example
  enabled?:     boolean;
}

export function useAnimatedPlaceholder(opts: Options = {}): string {
  const {
    typeSpeed   = 22,
    deleteSpeed = 8,
    pauseAfter  = 2200,
    pauseBefore = 400,
    enabled     = true,
  } = opts;

  const [text, setText] = useState('');
  const state = useRef<{
    exampleIdx: number;
    charIdx: number;
    phase: 'typing' | 'pause' | 'deleting' | 'pauseBefore';
  }>({ exampleIdx: 0, charIdx: 0, phase: 'typing' });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) { setText(''); return; }

    const tick = () => {
      const { exampleIdx, charIdx, phase } = state.current;
      const example = EXAMPLES[exampleIdx];

      if (phase === 'typing') {
        const next = charIdx + 1;
        setText(example.slice(0, next));
        if (next >= example.length) {
          state.current = { exampleIdx, charIdx: next, phase: 'pause' };
          timerRef.current = setTimeout(tick, pauseAfter);
        } else {
          state.current = { exampleIdx, charIdx: next, phase: 'typing' };
          timerRef.current = setTimeout(tick, typeSpeed);
        }
      } else if (phase === 'pause') {
        state.current = { exampleIdx, charIdx, phase: 'deleting' };
        timerRef.current = setTimeout(tick, deleteSpeed);
      } else if (phase === 'deleting') {
        const next = charIdx - 1;
        setText(example.slice(0, next));
        if (next <= 0) {
          const nextIdx = (exampleIdx + 1) % EXAMPLES.length;
          state.current = { exampleIdx: nextIdx, charIdx: 0, phase: 'pauseBefore' };
          timerRef.current = setTimeout(tick, pauseBefore);
        } else {
          state.current = { exampleIdx, charIdx: next, phase: 'deleting' };
          timerRef.current = setTimeout(tick, deleteSpeed);
        }
      } else {
        state.current = { exampleIdx, charIdx: 0, phase: 'typing' };
        timerRef.current = setTimeout(tick, typeSpeed);
      }
    };

    timerRef.current = setTimeout(tick, 600);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [enabled, typeSpeed, deleteSpeed, pauseAfter, pauseBefore]);

  return text;
}
