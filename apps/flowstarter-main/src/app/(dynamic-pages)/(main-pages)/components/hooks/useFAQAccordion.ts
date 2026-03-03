import { useState, useCallback } from 'react';

export function useFAQAccordion(initialIndex: number | null = 0) {
  const [openIndex, setOpenIndex] = useState<number | null>(initialIndex);

  const toggle = useCallback((index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  }, []);

  return { openIndex, toggle };
}
