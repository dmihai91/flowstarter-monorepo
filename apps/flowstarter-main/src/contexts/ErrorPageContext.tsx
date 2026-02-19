'use client';

// Simple module-level flag to track if we're on an error page
// This is set by error pages and checked by NavigationWrapper
let isErrorPage = false;

export function setIsErrorPageFlag(value: boolean) {
  isErrorPage = value;
}

export function getIsErrorPage() {
  return isErrorPage;
}

export function resetErrorPageFlag() {
  isErrorPage = false;
}

// Hook for error pages to use
export function useErrorPage() {
  return {
    setIsErrorPage: (value: boolean) => {
      setIsErrorPageFlag(value);
    },
  };
}
