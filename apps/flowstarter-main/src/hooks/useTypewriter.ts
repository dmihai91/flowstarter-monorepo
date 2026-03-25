'use client';

import { useState, useEffect, useRef } from 'react';

interface UseTypewriterOptions {
  speed?: number;       // ms per character (default 18)
  delay?: number;       // initial delay before starting (default 0)
  enabled?: boolean;    // set false to skip animation
}

/**
 * Typewriter hook — animates text from '' to the target value.
 * Re-animates whenever `text` changes to a different non-empty string.
 */
export function useTypewriter(
  text: string,
  { speed = 18, delay = 0, enabled = true }: UseTypewriterOptions = {}
): { displayed: string; done: boolean } {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const prevText = useRef('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !text) {
      setDisplayed(text);
      setDone(true);
      return;
    }

    // If value didn't change, skip
    if (text === prevText.current) return;
    prevText.current = text;

    setDisplayed('');
    setDone(false);

    let i = 0;
    const run = () => {
      if (i <= text.length) {
        setDisplayed(text.slice(0, i));
        i++;
        timerRef.current = setTimeout(run, speed);
      } else {
        setDone(true);
      }
    };

    timerRef.current = setTimeout(run, delay);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [text, speed, delay, enabled]);

  return { displayed, done };
}
