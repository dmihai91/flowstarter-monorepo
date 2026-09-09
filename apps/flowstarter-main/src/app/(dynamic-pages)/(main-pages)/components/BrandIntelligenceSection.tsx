import { LANDING_COPY } from '../landing-copy';

export function BrandIntelligenceSection() {
  const intelligence = LANDING_COPY.brandIntelligence;

  return (
    <section
      id="brand-intelligence"
      className="ls-scope ls-section ls-section--pad ls-brand-intelligence"
    >
      <div className="ls-mesh" aria-hidden />
      <div className="ls-grain" aria-hidden />

      <div className="ls-container">
        <div className="ls-section-intro">
          <h2 className="ls-display" style={{ textWrap: 'balance' }}>
            <span className="line">{intelligence.headline}</span>
            <span className="line flourish mt-2">
              {intelligence.headlineFlourish}
            </span>
          </h2>
          <p className="ls-body ls-body--lead">{intelligence.intro}</p>
        </div>

        <div className="ls-signal-board">
          <div className="ls-signal-source">
            <div className="ls-signal-label">What you share</div>
            <dl className="ls-signal-details">
              {intelligence.inputs.map((input) => (
                <div key={input.label}>
                  <dt>{input.label}</dt>
                  <dd>{input.value}</dd>
                </div>
              ))}
            </dl>
            <blockquote>{intelligence.sourceQuote}</blockquote>
          </div>

          <div className="ls-signal-transfer" aria-hidden>
            <span />
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M5 12h13M14 7l5 5-5 5" />
            </svg>
          </div>

          <div className="ls-brand-profile">
            <div className="ls-signal-label">What the agent learns</div>
            <div className="ls-brand-profile-head">
              <div>
                <span className="ls-brand-profile-kicker">Brand direction</span>
                <strong>{intelligence.direction}</strong>
              </div>
              <span className="ls-brand-confidence">High confidence</span>
            </div>

            <div className="ls-voice-matrix">
              {intelligence.voice.map((trait) => (
                <div className="ls-voice-row" key={trait.label}>
                  <span>{trait.label}</span>
                  <div className="ls-voice-track" aria-hidden>
                    <i style={{ width: `${trait.value}%` }} />
                  </div>
                  <b>{trait.value}</b>
                </div>
              ))}
            </div>

            <div className="ls-brand-palette">
              <span>Easy-to-read colors</span>
              <div>
                {intelligence.palette.map((color) => (
                  <i
                    key={color}
                    style={{ backgroundColor: color }}
                    aria-label={color}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="ls-signal-footnote">{intelligence.privacyNote}</p>
      </div>
    </section>
  );
}
