import React, { useState, useEffect } from 'react';

interface HeroProps {
  templateCount: number;
}

export function Hero({ templateCount }: HeroProps): React.ReactElement {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  const fade = (n: number) => `hero-fade hero-fade-${n}${ready ? ' ready' : ''}`;

  return (
    <section className="relative overflow-hidden" style={{ paddingTop: '6rem', paddingBottom: '4rem' }}>
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col items-center text-center">

          {/* Badge */}
          <div className={fade(1)} style={{ marginBottom: '2rem' }}>
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
              style={{
                border: '1px solid color-mix(in srgb, var(--purple) 30%, transparent)',
                background: 'color-mix(in srgb, var(--purple) 8%, transparent)',
                color: 'var(--purple)',
                letterSpacing: '0.04em',
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--purple)' }} />
              Template Library
            </span>
          </div>

          {/* Headline — matching main platform */}
          <div className={fade(2)} style={{ marginBottom: '1.5rem' }}>
            <h1 style={{ margin: 0, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
              <span
                className="block font-light text-gray-500 dark:text-white/50"
                style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)' }}
              >
                Every expert deserves
              </span>
              <span
                className="block hero-text-flow hero-text-flow-inner"
                style={{
                  fontSize: 'clamp(2.4rem, 6vw, 4.5rem)',
                  fontWeight: 900,
                  lineHeight: 1.1,
                  marginTop: '0.25rem',
                }}
              >
                a site this good.
              </span>
            </h1>
          </div>

          {/* Subtitle */}
          <p
            className={`${fade(3)} text-gray-500 dark:text-white/50`}
            style={{
              fontSize: 'clamp(0.95rem, 1.8vw, 1.15rem)',
              lineHeight: 1.6,
              maxWidth: '32rem',
              marginBottom: '2.5rem',
            }}
          >
            Templates built for coaches, consultants, and service professionals.
            Pick a palette, pick a font pair, hand it off.
          </p>

          {/* Stats row — glass card */}
          <div className={fade(4)}>
            <div
              className="glass-card inline-flex items-center gap-7 sm:gap-10 px-7 py-4"
              style={{ borderRadius: '1rem' }}
            >
              {[
                { value: `${templateCount}`, label: 'Templates' },
                { value: '6',                label: 'Palettes each' },
                { value: '4',                label: 'Font pairs' },
              ].map((s, i) => (
                <React.Fragment key={i}>
                  <div className="text-center">
                    <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white" style={{ letterSpacing: '-0.03em' }}>
                      {s.value}
                    </p>
                    <p className="text-[0.6rem] uppercase tracking-widest text-gray-400 dark:text-white/40 mt-1 font-semibold">
                      {s.label}
                    </p>
                  </div>
                  {i < 2 && (
                    <div className="h-10 w-px shrink-0 bg-gray-200 dark:bg-white/10" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
