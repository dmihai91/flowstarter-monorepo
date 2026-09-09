'use client';

import { useEffect, useRef, useState } from 'react';

type Benefit = {
  label: string;
  description: string;
};

type BenefitsStoryProps = {
  lead: Benefit;
  benefits: Benefit[];
};

export function BenefitsStory({ lead, benefits }: BenefitsStoryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;
        const nextIndex = Number(
          (visible.target as HTMLElement).dataset.benefitIndex
        );
        if (Number.isFinite(nextIndex)) setActiveIndex(nextIndex);
      },
      {
        rootMargin: '-28% 0px -38% 0px',
        threshold: [0.15, 0.35, 0.65],
      }
    );

    itemRefs.current.forEach((item) => item && observer.observe(item));
    return () => observer.disconnect();
  }, [benefits.length]);

  return (
    <div className="ls-human-layout">
      <article className="ls-human-lead">
        <div className="ls-human-lead-copy">
          <span className="ls-human-index">Agent team · online 24/7</span>
          <h3>{lead.label}</h3>
          <p>{lead.description}</p>
        </div>

        <div className="ls-human-now" aria-live="polite">
          <span>
            In focus · 0{activeIndex + 1} of 0{benefits.length}
          </span>
          <strong>{benefits[activeIndex]?.label}</strong>
        </div>

        <div className="ls-human-signoff">
          <span>Specialist agents</span>
          <i aria-hidden />
          <span>Human review</span>
          <i aria-hidden />
          <span>Client approval</span>
        </div>
      </article>

      <div className="ls-human-responsibilities">
        {benefits.map((benefit, index) => (
          <article
            key={benefit.label}
            ref={(element) => {
              itemRefs.current[index] = element;
            }}
            data-benefit-index={index}
            data-active={activeIndex === index ? 'true' : 'false'}
          >
            <span>0{index + 1}</span>
            <div>
              <h3>{benefit.label}</h3>
              <p>{benefit.description}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
