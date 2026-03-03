'use client';

import { useI18n } from '@/lib/i18n';

/**
 * Simple "How it works" animated steps preview.
 */
export function HowItWorksPreview() {
  const { t } = useI18n();

  return (
    <>
        {/* How it works */}
        <section className="py-6 lg:py-10">
          <div className="max-w-2xl mx-auto px-6 lg:px-12 text-center">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('landing.howItWorks.title')}
            </h3>
          </div>
        </section>

    </>
  );
}
