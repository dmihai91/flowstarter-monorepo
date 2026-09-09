'use client';

type Scenario = {
  id: string;
  number: string;
  title: string;
  summary: string;
  outcome: string;
  steps: string[];
  video: string;
  poster: string;
};

const scenarios: Scenario[] = [
  {
    id: 'intake',
    number: '01',
    title: 'Share the business and public profiles',
    summary:
      'A real Flowstarter session starts on the landing page, opens the client brief, and captures the business, audience, Instagram and LinkedIn details.',
    outcome: 'A saved client brief ready for site direction',
    steps: [
      'Landing page',
      'Client details',
      'Business story',
      'Public profiles',
    ],
    video: '/workflow-clips/01-intake.webm',
    poster: '/workflow-clips/01-intake.png',
  },
  {
    id: 'recommendation',
    number: '02',
    title: 'Define the site and receive a recommendation',
    summary:
      'The client chooses goals, voice, size and timing, then describes the services the site must connect. Flowstarter returns the matching build recommendation and exact payment milestones.',
    outcome: 'A scope and price recommendation from the real intake',
    steps: ['Goals', 'Brand voice', 'Integrations', 'Build recommendation'],
    video: '/workflow-clips/02-preview.webm',
    poster: '/workflow-clips/02-preview.png',
  },
  {
    id: 'preview-job',
    number: '03',
    title: 'Choose care and start the preview job',
    summary:
      'The client selects an ongoing care plan and continues into Flowstarter’s actual preview pipeline. The recording shows the real request entering the Pi-backed generation progress screen.',
    outcome: 'A real preview job accepted and started',
    steps: ['Care plan', 'Submit brief', 'Pi preview request', 'Live progress'],
    video: '/workflow-clips/03-build.webm',
    poster: '/workflow-clips/03-build.png',
  },
  {
    id: 'editor',
    number: '04',
    title: 'Change pricing and copy in plain language',
    summary:
      'The real editor demo targets a price, changes its amount and billing terms, then selects a headline and rewrites it with a warmer direction. The site preview updates beside the conversation.',
    outcome: 'Visible, scoped changes without touching the layout',
    steps: ['Select price', 'Set new terms', 'Choose copy', 'Apply rewrite'],
    video: '/workflow-clips/04-editor.webm',
    poster: '/workflow-clips/04-editor.png',
  },
  {
    id: 'deposit',
    number: '05',
    title: 'Deposit paid, build queued: the operator side',
    summary:
      'The real operator console: the 20% deposit invoice goes out as an actual Stripe invoice, the payment webhook lands, and the workspace advances to DEPOSIT_PAID with a full-site build queued on the ledger, no manual bookkeeping.',
    outcome: 'A paid deposit that queues the site build by itself',
    steps: [
      'Operator console',
      'Send 20% deposit',
      'Stripe webhook',
      'Build queued',
    ],
    video: '/workflow-clips/05-deposit.webm',
    poster: '/workflow-clips/05-deposit.png',
  },
  {
    id: 'portfolio',
    number: '06',
    title: 'Instagram profile in, portfolio site out',
    summary:
      'A real client scenario end to end: the public Instagram profile @darius.flowstarter is analyzed for brand identity (bio, captions and images), the sigma classifier picks the template deterministically in milliseconds, and the tiered agents build a 13-page developer portfolio. The clip scrolls the actual generated site.',
    outcome: 'A live portfolio derived from a real Instagram identity',
    steps: [
      'Public profile analysis',
      'Sigma template pick',
      'Tiered Pi agents',
      'Generated site tour',
    ],
    video: '/workflow-clips/06-portfolio.webm',
    poster: '/workflow-clips/06-portfolio.png',
  },
];

function FlowstarterMark() {
  return (
    <a className="wf-brand" href="/" aria-label="Flowstarter home">
      <span className="wf-mark" aria-hidden="true">
        F
      </span>
      <span>Flowstarter</span>
    </a>
  );
}

function ScenarioFilm({ scenario }: { scenario: Scenario }) {
  return (
    <article className="wf-film" id={scenario.id}>
      <div className="wf-film-copy">
        <div className="wf-film-number">{scenario.number}</div>
        <h2>{scenario.title}</h2>
        <p>{scenario.summary}</p>
        <dl>
          <div>
            <dt>Outcome</dt>
            <dd>{scenario.outcome}</dd>
          </div>
          <div>
            <dt>In the clip</dt>
            <dd>{scenario.steps.join(' · ')}</dd>
          </div>
        </dl>
      </div>
      <div className="wf-film-media">
        <div className="wf-film-meta">
          <span>FLOWSTARTER / {scenario.number}</span>
          <span>REAL DEV SERVER</span>
        </div>
        <video
          controls
          muted
          playsInline
          preload="metadata"
          poster={scenario.poster}
          aria-label={`${scenario.title} workflow clip`}
        >
          <source src={scenario.video} type="video/webm" />
        </video>
      </div>
    </article>
  );
}

export function WorkflowShowcaseClient() {
  return (
    <main className="wf-page">
      <header className="wf-header">
        <FlowstarterMark />
        <nav aria-label="Workflow recordings">
          {scenarios.map((scenario) => (
            <a href={`#${scenario.id}`} key={scenario.id}>
              {scenario.number}
            </a>
          ))}
        </nav>
        <a className="wf-back" href="/">
          Back to Flowstarter
        </a>
      </header>

      <section className="wf-intro">
        <h1>
          Flowstarter,
          <br />
          actually running.
        </h1>
        <div>
          <p>
            Four browser recordings from the real Flowstarter development
            server: client intake, recommendation, preview-job launch and inline
            editing.
          </p>
          <span>No simulated workflow screens</span>
        </div>
      </section>

      <div className="wf-index" aria-label="Workflow overview">
        {scenarios.map((scenario) => (
          <a href={`#${scenario.id}`} key={scenario.id}>
            <b>{scenario.number}</b>
            <span>{scenario.title}</span>
          </a>
        ))}
      </div>

      <section className="wf-films" aria-label="Recorded Flowstarter workflows">
        {scenarios.map((scenario) => (
          <ScenarioFilm scenario={scenario} key={scenario.id} />
        ))}
      </section>

      <section className="wf-end">
        <p>Real product. Real controls. Real browser recordings.</p>
        <a href="/#create-preview">Open Flowstarter</a>
      </section>
    </main>
  );
}
