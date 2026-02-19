/**
 * Easing function for smooth animation (ease-in-out)
 */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}

/**
 * Smooth scroll to an element with offset for fixed navbar
 * @param targetId - The ID of the element to scroll to (without #)
 * @param offset - Additional offset in pixels (default: 0)
 * @param duration - Duration of scroll animation in milliseconds (default: 800)
 */
export function smoothScrollToSection(
  targetId: string,
  offset: number = 0,
  duration: number = 800
): void {
  const element = document.getElementById(targetId);
  if (!element) {
    console.warn(`Element with ID "${targetId}" not found`);
    return;
  }

  const headerOffset = 96; // navbar height (64px) + extra spacing (32px)
  const targetPosition =
    element.getBoundingClientRect().top +
    window.scrollY -
    headerOffset -
    offset;
  const startPosition = window.scrollY;
  const distance = targetPosition - startPosition;
  let startTime: number | null = null;

  console.log(
    `Scrolling to: ${targetId}, from ${startPosition} to ${targetPosition}`
  );

  function animation(currentTime: number) {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    const ease = easeInOutCubic(progress);

    window.scrollTo(0, startPosition + distance * ease);

    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    } else {
      // Ensure we end exactly at the target position
      window.scrollTo(0, targetPosition);
      console.log(`Scroll complete: ${targetId}`);
    }
  }

  requestAnimationFrame(animation);
}

/**
 * Handle click event for smooth scroll links
 * @param e - Click event
 * @param href - The href value (e.g., "#features")
 */
export function handleSmoothScroll(
  e: React.MouseEvent<HTMLAnchorElement>,
  href: string
): void {
  // Only handle hash links
  if (!href.startsWith('#')) return;

  e.preventDefault();
  const targetId = href.substring(1);
  smoothScrollToSection(targetId);

  // Update URL hash without jumping
  if (history.pushState) {
    history.pushState(null, '', href);
  } else {
    window.location.hash = href;
  }
}
