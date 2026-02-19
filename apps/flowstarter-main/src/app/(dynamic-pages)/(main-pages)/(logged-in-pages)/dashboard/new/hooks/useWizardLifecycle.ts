import { useEffect, useRef } from 'react';

interface UseWizardLifecycleProps {
  onNext: () => void;
  hasUnsaved: boolean;
}

export function useWizardLifecycle({
  onNext,
  hasUnsaved,
}: UseWizardLifecycleProps) {
  const hasRestoredScroll = useRef(false);

  // Force restore scrolling when wizard mounts (safety mechanism)
  useEffect(() => {
    if (!hasRestoredScroll.current) {
      // Use requestAnimationFrame to ensure this runs after LoadingScreen cleanup
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Force remove overflow hidden from body and html
          document.body.style.removeProperty('overflow');
          document.documentElement.style.removeProperty('overflow');

          // Restore scrollbar gutter to default
          document.documentElement.style.scrollbarGutter = 'stable';
          document.body.style.removeProperty('scrollbar-gutter');

          hasRestoredScroll.current = true;
        });
      });
    }
  }, []);

  // Allow child components to advance the wizard via a custom event
  useEffect(() => {
    const onWizardNext = () => {
      onNext();
    };
    window.addEventListener('wizard-next', onWizardNext);
    return () => window.removeEventListener('wizard-next', onWizardNext);
  }, [onNext]);

  // Warn on navigation away while building a project
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasUnsaved) return;
      e.preventDefault();
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [hasUnsaved]);
}
