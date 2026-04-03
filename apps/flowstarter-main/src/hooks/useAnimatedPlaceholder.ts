'use client';

import { useState, useEffect, useRef } from 'react';

const EXAMPLES = [
  'Boutique dental clinic for busy professionals. Polished website with online booking, implants and whitening focus, strong lead capture.',
  'Local yoga studio — in-person and online classes. Warm, calming vibe. Simple booking system and newsletter signup.',
  'Freelance graphic designer looking to showcase portfolio and attract branding clients. Minimal, modern aesthetic.',
  'Life coach helping burned-out professionals find clarity and purpose. Warm, empowering tone. Discovery call booking and lead capture.',
  'Personal fitness coach targeting women 30–45. Sells 1-on-1 coaching and online programs. Bold, motivational energy.',
  'Law firm specialising in corporate contracts. Professional, trustworthy tone. Contact form and service descriptions.',
  'Handmade ceramics store. Product showcase, Instagram feed integration, and Stripe checkout.',
];

interface Options {
  minSpeed?: number; // min ms per char when typing (default 38)
  maxSpeed?: number; // max ms per char when typing (default 72)
  deleteSpeed?: number; // ms per char when deleting (default 14)
  pauseAfter?: number; // ms pause after full text (default 2800)
  pauseBefore?: number; // ms pause before next (default 500)
  enabled?: boolean;
}

export function useAnimatedPlaceholder(opts: Options = {}): string {
  const {
    minSpeed = 38,
    maxSpeed = 72,
    deleteSpeed = 14,
    pauseAfter = 2800,
    pauseBefore = 500,
    enabled = true,
  } = opts;

  const [text, setText] = useState('');
  const state = useRef<{
    exampleIdx: number;
    charIdx: number;
    phase: 'typing' | 'pause' | 'deleting' | 'pauseBefore';
    cursorVisible: boolean;
  }>({ exampleIdx: 0, charIdx: 0, phase: 'typing', cursorVisible: true });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) {
      setText('');
      return;
    }

    // Blinking cursor interval — toggles cursor char
    cursorRef.current = setInterval(() => {
      state.current.cursorVisible = !state.current.cursorVisible;
      // Force re-render by updating cursor in text
      const example = EXAMPLES[state.current.exampleIdx];
      const current = example.slice(0, state.current.charIdx);
      setText(current + (state.current.cursorVisible ? '|' : ' '));
    }, 530);

    const rand = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    const tick = () => {
      const { exampleIdx, charIdx, phase } = state.current;
      const example = EXAMPLES[exampleIdx];

      if (phase === 'typing') {
        const next = charIdx + 1;
        state.current.charIdx = next;
        setText(
          example.slice(0, next) + (state.current.cursorVisible ? '|' : ' ')
        );

        if (next >= example.length) {
          state.current.phase = 'pause';
          timerRef.current = setTimeout(tick, pauseAfter);
        } else {
          // Natural variance — slow down at commas/periods
          const ch = example[next - 1];
          const delay =
            ch === '.' || ch === ','
              ? rand(120, 200)
              : rand(minSpeed, maxSpeed);
          timerRef.current = setTimeout(tick, delay);
        }
      } else if (phase === 'pause') {
        state.current.phase = 'deleting';
        timerRef.current = setTimeout(tick, deleteSpeed);
      } else if (phase === 'deleting') {
        const next = charIdx - 1;
        state.current.charIdx = next;
        const example2 = EXAMPLES[exampleIdx];
        setText(
          example2.slice(0, next) + (state.current.cursorVisible ? '|' : ' ')
        );

        if (next <= 0) {
          const nextIdx = (exampleIdx + 1) % EXAMPLES.length;
          state.current = {
            exampleIdx: nextIdx,
            charIdx: 0,
            phase: 'pauseBefore',
            cursorVisible: true,
          };
          timerRef.current = setTimeout(tick, pauseBefore);
        } else {
          timerRef.current = setTimeout(tick, deleteSpeed);
        }
      } else {
        state.current.phase = 'typing';
        timerRef.current = setTimeout(tick, rand(minSpeed, maxSpeed));
      }
    };

    timerRef.current = setTimeout(tick, 800);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (cursorRef.current) clearInterval(cursorRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return text;
}
