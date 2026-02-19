import { useEffect, useState } from 'react';

export function usePlaceholderAnimation(prompts: string[]) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (prompts.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % prompts.length);
      setKey((prev) => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, [prompts]);

  return { currentIndex, key };
}
