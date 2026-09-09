'use client';

// Typewriter primitives for the AI surfaces (prompt placeholders, agent
// feeds). Humanized timing (jittered per-char), blinking block caret, and
// full prefers-reduced-motion fallbacks.
import React from 'react';

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/** Cycles phrases with type → hold → delete. Returns the current slice
 *  (with a block caret while active) — ideal for input placeholders. */
export function useTypewriter(
  phrases: string[],
  { typeMs = 34, deleteMs = 12, holdMs = 1800, enabled = true }: { typeMs?: number; deleteMs?: number; holdMs?: number; enabled?: boolean } = {},
): string {
  const reduced = usePrefersReducedMotion();
  const [i, setI] = React.useState(0);
  const [len, setLen] = React.useState(0);
  const [phase, setPhase] = React.useState<'typing' | 'holding' | 'deleting'>('typing');

  React.useEffect(() => {
    if (!enabled || reduced || phrases.length === 0) return;
    const phrase = phrases[i % phrases.length];
    let t: ReturnType<typeof setTimeout>;
    if (phase === 'typing') {
      t =
        len < phrase.length
          ? setTimeout(() => setLen((l) => l + 1), typeMs + Math.random() * 40)
          : setTimeout(() => setPhase('holding'), 60);
    } else if (phase === 'holding') {
      t = setTimeout(() => setPhase('deleting'), holdMs);
    } else {
      t =
        len > 0
          ? setTimeout(() => setLen((l) => l - 1), deleteMs)
          : setTimeout(() => {
              setI((x) => x + 1);
              setPhase('typing');
            }, 240);
    }
    return () => clearTimeout(t);
  }, [enabled, reduced, phrases, i, len, phase, typeMs, deleteMs, holdMs]);

  if (!enabled || phrases.length === 0) return '';
  if (reduced) return phrases[i % phrases.length];
  const text = phrases[i % phrases.length].slice(0, len);
  return phase === 'holding' ? text : `${text}▍`;
}

/** Types a string once when `active` flips true; renders children-style text. */
export function TypeOnce({ text, active, speed = 18 }: { text: string; active: boolean; speed?: number }) {
  const reduced = usePrefersReducedMotion();
  const [len, setLen] = React.useState(0);
  React.useEffect(() => {
    if (!active || reduced) return;
    setLen(0);
    let cancelled = false;
    let l = 0;
    const tick = () => {
      if (cancelled || l >= text.length) return;
      l += 1;
      setLen(l);
      setTimeout(tick, speed + Math.random() * 24);
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, [active, text, reduced, speed]);
  if (reduced || !active) return <>{text}</>;
  const done = len >= text.length;
  return (
    <>
      {text.slice(0, len)}
      {!done && <span className="tw-caret" aria-hidden />}
    </>
  );
}
