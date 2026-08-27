import Image from 'next/image';
import Link from 'next/link';

import { withAssetVersion } from '@/utils/asset-version';
import { LANDING_COPY } from '../landing-copy';

export function TemplateLibrarySection() {
  const library = LANDING_COPY.templateLibrary;
  const [selected, ...alternatives] = library.templates;

  return (
    <section
      id="template-library"
      className="ls-scope ls-section ls-section--pad"
    >
      <div className="ls-mesh" aria-hidden />
      <div className="ls-grain" aria-hidden />

      <div className="ls-container">
        <div className="ls-section-intro ls-section-intro--reverse">
          <h2 className="ls-display" style={{ textWrap: 'balance' }}>
            <span className="line">{library.headline}</span>
            <span className="line flourish mt-2">
              {library.headlineFlourish}
            </span>
          </h2>
          <div>
            <p className="ls-body ls-body--lead">{library.intro}</p>
            <Link href="/library" className="ls-library-link">
              Browse the approved library
              <span aria-hidden>↗</span>
            </Link>
          </div>
        </div>

        <div className="ls-template-composition">
          <article className="ls-template-selected">
            <div className="ls-template-image">
              <Image
                src={withAssetVersion(selected.thumbnail)}
                alt={`${selected.name} design preview`}
                width={1400}
                height={900}
                quality={80}
                sizes="(min-width: 1024px) 65vw, 100vw"
              />
            </div>
            <div className="ls-template-caption">
              <span>{selected.status}</span>
              <div>
                <h3>{selected.name}</h3>
                <p>{selected.reason}</p>
              </div>
            </div>
          </article>

          <div className="ls-template-alternatives">
            {alternatives.map((template) => (
              <article key={template.name} className="ls-template-option">
                <Image
                  src={withAssetVersion(template.thumbnail)}
                  alt={`${template.name} design preview`}
                  width={1400}
                  height={900}
                  quality={76}
                  sizes="(min-width: 1024px) 31vw, 100vw"
                />
                <div>
                  <span>{template.status}</span>
                  <h3>{template.name}</h3>
                  <p>{template.reason}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="ls-template-explainer">
          <span>Selection is only the starting point</span>
          <p>{library.explainer}</p>
        </div>
      </div>
    </section>
  );
}
