import { tServer } from '@/lib/i18n-server';
import { LANDING_COPY } from '../landing-copy';
import { BenefitsStory } from './BenefitsStory';

export function DifferentiationSection() {
  const t = tServer as (key: string) => string;
  const diff = LANDING_COPY.differentiation;

  return (
    <section
      id="differentiation"
      className="ls-scope ls-section ls-section--pad"
    >
      <div className="ls-mesh" aria-hidden />{' '}
      <div className="ls-grain" aria-hidden />
      <div className="ls-container">
        <div className="ls-section-intro ls-section-intro--reverse">
          <h2 className="ls-display" style={{ textWrap: 'balance' }}>
            <span className="line">
              {t('landing.differentiation.headlinePrefix')}
            </span>
            <span className="line flourish mt-2">
              {t('landing.differentiation.headlineFlourish')}
            </span>
          </h2>
          <p className="ls-body ls-body--lead">
            {t('landing.differentiation.sub')}
          </p>
        </div>

        <BenefitsStory lead={diff.cards[0]} benefits={diff.cards.slice(1)} />
      </div>
    </section>
  );
}
