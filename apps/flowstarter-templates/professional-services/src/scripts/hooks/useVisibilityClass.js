export function useVisibilityClass({
  selector,
  className = 'is-visible',
  observingClassName = 'is-observing',
  threshold = 0.35,
  rootMargin = '0px',
  once = false,
  respectReducedMotion = true,
  revealIfAlreadyVisible = true,
}) {
  const elements = Array.from(document.querySelectorAll(selector));

  if (!elements.length) {
    return;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (respectReducedMotion && reduceMotion) {
    elements.forEach((element) => {
      element.classList.add(observingClassName);
      element.classList.add(className);
    });
    return;
  }

  const isInViewport = (element) => {
    const rect = element.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  };

  const revealOnNextFrame = (element) => {
    if (element.dataset.revealQueued === 'true') {
      return;
    }

    element.dataset.revealQueued = 'true';

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        element.classList.add(className);
        delete element.dataset.revealQueued;
      });
    });
  };

  elements.forEach((element) => {
    element.classList.add(observingClassName);

    if (revealIfAlreadyVisible && isInViewport(element)) {
      revealOnNextFrame(element);
    }
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add(className);

          if (once) {
            observer.unobserve(entry.target);
          }

          return;
        }

        if (!once) {
          entry.target.classList.remove(className);
        }
      });
    },
    {
      threshold,
      rootMargin,
    }
  );

  elements.forEach((element) => observer.observe(element));
}
