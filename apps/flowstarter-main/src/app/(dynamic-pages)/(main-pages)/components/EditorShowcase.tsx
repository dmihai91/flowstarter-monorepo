'use client';

import { useI18n } from '@/lib/i18n';
import { useMockEditor } from './useMockEditor';
import { MockEditorPreview } from './MockEditorPreview';

export function EditorShowcase() {
  const { t: tStrict } = useI18n();
  const t = tStrict as (key: string) => string;
  const editor = useMockEditor();

  return (
    <section
      id="editor-showcase"
      className="ls-scope ls-section ls-section--pad ls-fade-top"
    >
      <div className="ls-mesh" aria-hidden />
      <div className="ls-orb ls-orb--violet ls-orb--tl" aria-hidden />
      <div className="ls-grain" aria-hidden />

      <div className="ls-container">
        <div className="text-center max-w-3xl mx-auto">
          <div
            className="ls-eyebrow inline-flex items-center justify-center gap-3"
            style={{ justifyContent: 'center' }}
          >
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                width: '28px',
                height: '1px',
                background: 'var(--ls-ink-faint)',
              }}
            />
            <span className="num">{t('landing.editorShowcase.eyebrow')}</span>
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                width: '28px',
                height: '1px',
                background: 'var(--ls-ink-faint)',
              }}
            />
          </div>
          <h2 className="ls-display mt-7" style={{ textWrap: 'balance' }}>
            <span className="line">
              {t('landing.editorShowcase.headlinePrefix')}
            </span>
            <span className="line flourish mt-2">
              {t('landing.editorShowcase.headlineFlourish')}
            </span>
          </h2>
          <p className="ls-body ls-body--lead mt-7 mx-auto">
            {t('landing.editorShowcase.sub')}
          </p>
        </div>

        <div className="ls-editor-stage mx-auto mt-16 max-w-6xl">
          {/* Ambient halo */}
          <div className="ls-editor-halo" aria-hidden />

          {/* Register marks — blueprint corners */}
          <span className="ls-editor-mark ls-editor-mark--tl" aria-hidden />
          <span className="ls-editor-mark ls-editor-mark--tr" aria-hidden />
          <span className="ls-editor-mark ls-editor-mark--bl" aria-hidden />
          <span className="ls-editor-mark ls-editor-mark--br" aria-hidden />

          {/* Technical caption */}
          <div className="ls-editor-caption" aria-hidden>
            <span>Fig. 001</span>
            <span className="ls-editor-caption-rule" />
            <span>Smart editor, live demo</span>
          </div>

          <div className="ls-editor-surface">
            <MockEditorPreview {...editor} />
          </div>
        </div>
      </div>

      <style jsx global>{`
        .ls-editor-stage {
          position: relative;
          padding: clamp(2rem, 5vw, 4rem) clamp(0.5rem, 2vw, 1.5rem);
        }
        .ls-editor-halo {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(
              58% 55% at 50% 50%,
              color-mix(in oklab, var(--ls-accent) 12%, transparent) 0%,
              transparent 70%
            ),
            radial-gradient(
              30% 40% at 85% 20%,
              color-mix(in oklab, var(--ls-accent-warm) 8%, transparent) 0%,
              transparent 80%
            );
          filter: blur(40px);
          z-index: 0;
        }
        .dark .ls-editor-halo {
          background: radial-gradient(
              58% 55% at 50% 50%,
              color-mix(in oklab, var(--ls-accent) 20%, transparent) 0%,
              transparent 70%
            ),
            radial-gradient(
              30% 40% at 85% 20%,
              color-mix(in oklab, var(--ls-accent-warm) 14%, transparent) 0%,
              transparent 80%
            );
        }

        /* Blueprint L-shape marks at the four corners of the stage */
        .ls-editor-mark {
          position: absolute;
          width: 18px;
          height: 18px;
          border: 1px solid var(--ls-accent);
          opacity: 0.55;
          z-index: 3;
          pointer-events: none;
        }
        .ls-editor-mark--tl {
          top: 12px;
          left: 12px;
          border-right: 0;
          border-bottom: 0;
        }
        .ls-editor-mark--tr {
          top: 12px;
          right: 12px;
          border-left: 0;
          border-bottom: 0;
        }
        .ls-editor-mark--bl {
          bottom: 12px;
          left: 12px;
          border-right: 0;
          border-top: 0;
        }
        .ls-editor-mark--br {
          bottom: 12px;
          right: 12px;
          border-left: 0;
          border-top: 0;
        }
        @media (max-width: 640px) {
          .ls-editor-mark {
            width: 12px;
            height: 12px;
          }
          .ls-editor-mark--tl,
          .ls-editor-mark--tr {
            top: 6px;
          }
          .ls-editor-mark--bl,
          .ls-editor-mark--br {
            bottom: 6px;
          }
          .ls-editor-mark--tl,
          .ls-editor-mark--bl {
            left: 6px;
          }
          .ls-editor-mark--tr,
          .ls-editor-mark--br {
            right: 6px;
          }
        }

        /* Technical caption above the surface */
        .ls-editor-caption {
          position: absolute;
          top: 14px;
          left: 50%;
          transform: translateX(-50%);
          display: inline-flex;
          align-items: center;
          gap: 0.7rem;
          font-family: var(--ls-mono);
          font-size: 10.5px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--ls-ink-faint);
          z-index: 3;
          pointer-events: none;
          white-space: nowrap;
        }
        .ls-editor-caption-rule {
          display: inline-block;
          width: 18px;
          height: 1px;
          background: var(--ls-ink-faint);
        }
        @media (max-width: 640px) {
          .ls-editor-caption {
            display: none;
          }
        }

        /* The floating editor surface itself */
        .ls-editor-surface {
          position: relative;
          z-index: 2;
          border-radius: 18px;
          overflow: hidden;
          background: var(--ls-bg);
          border: 1px solid var(--ls-glass-edge);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85),
            0 1px 2px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.08),
            0 32px 80px rgba(0, 0, 0, 0.1),
            0 0 0 1px color-mix(in oklab, var(--ls-ink) 5%, transparent);
        }
        .dark .ls-editor-surface {
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06),
            0 1px 2px rgba(0, 0, 0, 0.5), 0 8px 24px rgba(0, 0, 0, 0.4),
            0 40px 120px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.04);
        }

        /* Suppress the MockEditorPreview's own title + opening wrapper spacing —
           our editorial header already sets context. */
        .ls-editor-surface > div:first-child > div.text-center {
          display: none;
        }
        .ls-editor-surface > div:first-child {
          margin-bottom: 0 !important;
        }

        /* Tighten mobile sizing */
        @media (max-width: 640px) {
          .ls-editor-stage {
            padding: 1.25rem 0.25rem;
          }
          .ls-editor-surface [class*='h-[900px]'],
          .ls-editor-surface [class*='sm:h-[760px]'],
          .ls-editor-surface [class*='lg:h-[860px]'] {
            height: auto !important;
            min-height: 0 !important;
          }
          .ls-editor-surface [class*='h-[420px]'] {
            height: 300px !important;
          }
        }
      `}</style>
    </section>
  );
}
