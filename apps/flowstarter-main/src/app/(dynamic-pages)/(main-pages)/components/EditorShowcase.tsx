'use client';

import { useI18n } from '@/lib/i18n';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useMockEditor } from './useMockEditor';
import { MockEditorPreview } from './MockEditorPreview';

/**
 * Standalone editor showcase section with breathing room.
 */
export function EditorShowcase() {
  const { t } = useI18n();
  const { ref: sectionRef, isVisible } = useScrollAnimation();
  const editor = useMockEditor();

  return (
    <section ref={sectionRef} className="py-20 lg:py-28 relative overflow-hidden">
      <div className={`max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 transition-all duration-1000 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0'
      }`}>
        {/* Editor preview with glow */}
        <div className="relative max-w-4xl mx-auto">
          {/* Glow behind editor */}
          <div className="absolute -inset-6 sm:-inset-10 rounded-[2rem] bg-gradient-to-br from-[var(--purple)]/8 via-blue-500/4 to-pink-500/8 dark:from-[var(--purple)]/12 dark:via-blue-500/6 dark:to-pink-500/12 blur-2xl opacity-60 pointer-events-none" />
          <MockEditorPreview {...editor} />
        </div>
      </div>
    </section>
  );
}
