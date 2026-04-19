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
    </section>
  );
}
