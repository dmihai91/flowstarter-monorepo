'use client';

/**
 * Whether an error page (404/500) is currently on screen.
 *
 * Error pages render their own chrome, so the global navigation has to step
 * aside or the page shows two headers. The root layout renders
 * `NavigationWrapper` as a sibling *before* `{children}`, so the navbar cannot
 * learn this from props or context during the same pass — it subscribes to
 * this store instead, and `ErrorPageLayout` publishes to it in a layout effect
 * so the correction lands before the browser paints.
 */

let isErrorPage = false;
const listeners = new Set<() => void>();

export function setIsErrorPageFlag(value: boolean) {
  if (isErrorPage === value) return;
  isErrorPage = value;
  listeners.forEach((listener) => listener());
}

export function getIsErrorPage() {
  return isErrorPage;
}

/** Always false on the server: the navbar must match the first client render. */
export function getIsErrorPageServerSnapshot() {
  return false;
}

export function subscribeErrorPage(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function resetErrorPageFlag() {
  setIsErrorPageFlag(false);
}
