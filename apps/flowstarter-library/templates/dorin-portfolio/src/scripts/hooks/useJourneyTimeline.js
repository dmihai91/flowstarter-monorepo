export function useJourneyTimeline(selector = '[data-journey-section]') {
  const sections = Array.from(document.querySelectorAll(selector));

  if (!sections.length) {
    return;
  }

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileQuery = window.matchMedia('(max-width: 900px)');
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  sections.forEach((section) => {
    if (section.dataset.journeyInitialized === 'true') {
      return;
    }

    section.dataset.journeyInitialized = 'true';

    const stage = section.querySelector('[data-journey-stage]');
    const sticky = section.querySelector('[data-journey-sticky]');
    const controls = Array.from(section.querySelectorAll('[data-journey-control]'));
    const cards = Array.from(section.querySelectorAll('[data-journey-card]'));
    const steps = Array.from(section.querySelectorAll('[data-journey-step]'));

    if (!stage || !sticky || !controls.length || !cards.length || !steps.length) {
      return;
    }

    let frameId = 0;

    const getScrollStep = () => {
      const rawStep = window.getComputedStyle(section).getPropertyValue('--journey-scroll-step').trim();
      const parsed = Number.parseFloat(rawStep);

      if (Number.isNaN(parsed)) {
        return 112;
      }

      return rawStep.endsWith('rem')
        ? parsed * Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize)
        : parsed;
    };

    const syncStageHeight = () => {
      if (mobileQuery.matches || reduceMotionQuery.matches) {
        stage.style.minHeight = '';
        return;
      }

      const scrollStep = getScrollStep();
      const contentHeight = sticky.offsetHeight;
      const totalHeight = contentHeight + Math.max(cards.length - 1, 0) * scrollStep;

      stage.style.minHeight = `${Math.ceil(totalHeight)}px`;
    };

    const setActive = (index) => {
      controls.forEach((control, controlIndex) => {
        const isActive = controlIndex === index;
        control.classList.toggle('is-active', isActive);
        control.setAttribute('aria-current', isActive ? 'step' : 'false');
      });

      steps.forEach((step, stepIndex) => {
        step.classList.toggle('is-active', stepIndex === index);
        step.classList.toggle('is-complete', stepIndex < index);
      });

      cards.forEach((card, cardIndex) => {
        const isActive = cardIndex === index;
        card.classList.toggle('is-active', isActive);
        card.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      });
    };

    const getActiveIndex = () => {
      const totalScrollable = Math.max(stage.offsetHeight - sticky.offsetHeight, 1);
      const scrollStep = Math.max(getScrollStep(), 1);
      const travelled = clamp(-stage.getBoundingClientRect().top, 0, totalScrollable);
      return clamp(Math.floor(travelled / scrollStep), 0, cards.length - 1);
    };

    const update = () => {
      frameId = 0;
      syncStageHeight();

      if (mobileQuery.matches || reduceMotionQuery.matches) {
        setActive(0);
        return;
      }

      setActive(getActiveIndex());
    };

    const queueUpdate = () => {
      if (frameId) {
        return;
      }

      frameId = window.requestAnimationFrame(update);
    };

    controls.forEach((control, index) => {
      control.addEventListener('click', () => {
        if (mobileQuery.matches || reduceMotionQuery.matches) {
          return;
        }

        const totalScrollable = Math.max(stage.offsetHeight - sticky.offsetHeight, 1);
        const stageTop = window.scrollY + stage.getBoundingClientRect().top;
        const targetProgress = cards.length === 1 ? 0 : index / (cards.length - 1);
        const targetTop = stageTop + totalScrollable * targetProgress;

        window.scrollTo({
          top: targetTop,
          behavior: 'smooth',
        });
      });
    });

    update();
    window.addEventListener('scroll', queueUpdate, { passive: true });
    window.addEventListener('resize', queueUpdate);
    window.addEventListener('load', queueUpdate);
    window.addEventListener('pageshow', queueUpdate);
    mobileQuery.addEventListener('change', queueUpdate);
    reduceMotionQuery.addEventListener('change', queueUpdate);
  });
}
