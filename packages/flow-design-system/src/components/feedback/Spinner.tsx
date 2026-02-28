import { useEffect, useState } from 'react';
import { getEffectiveTheme } from '../../utils/theme';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'current';
  className?: string;
}

const sizeMap = { sm: 16, md: 24, lg: 32, xl: 48 };

const spinKeyframes = `
@keyframes flow-spin {
  to { transform: rotate(360deg); }
}`;

export function Spinner({ size = 'md', color = 'primary', className = '' }: SpinnerProps) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const update = () => setIsDark(getEffectiveTheme() === 'dark');
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    return () => observer.disconnect();
  }, []);

  const px = sizeMap[size];
  const borderColor = isDark ? '#3f3f46' : '#e4e4e7';
  const topColor =
    color === 'white' ? '#fff'
    : color === 'current' ? 'currentColor'
    : 'var(--purple, hsl(233,65%,58%))';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: spinKeyframes }} />
      <div
        className={className}
        role="status"
        aria-label="Loading"
        style={{
          width: px,
          height: px,
          borderRadius: '9999px',
          border: `2px solid ${borderColor}`,
          borderTopColor: topColor,
          animation: 'flow-spin 0.7s linear infinite',
        }}
      />
    </>
  );
}
