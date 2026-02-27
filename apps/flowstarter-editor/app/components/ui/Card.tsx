import { forwardRef } from 'react';
import { classNames } from '~/utils/classNames';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass';
  noHover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(({ className, variant = 'default', noHover = false, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={classNames(
        // Base structure
        'group relative overflow-hidden rounded-2xl',
        'px-6 py-5',
        // Glassmorphism effect
        variant === 'elevated'
          ? 'bg-white/80 dark:bg-white/[0.06]'
          : variant === 'glass'
            ? 'bg-white/50 dark:bg-white/[0.03]'
            : 'bg-white/60 dark:bg-white/[0.04]',
        'backdrop-blur-2xl',
        'border border-white/20 dark:border-white/10',
        // Shadow with inner highlight
        variant === 'elevated'
          ? 'shadow-[0_8px_32px_rgba(0,0,0,0.1),0_1px_0_rgba(255,255,255,0.9)_inset] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.1)_inset]'
          : 'shadow-[0_8px_32px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.9)_inset] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.1)_inset]',
        // Hover effects
        'transition-all duration-300 ease-out',
        !noHover && [
          'hover:-translate-y-[2px]',
          'hover:shadow-[0_12px_40px_rgba(0,0,0,0.1),0_1px_0_rgba(255,255,255,0.9)_inset]',
          'hover:border-purple-500/20',
          'dark:hover:shadow-[0_12px_40px_rgba(124,58,237,0.15),0_1px_0_rgba(255,255,255,0.1)_inset]',
          'dark:hover:border-purple-500/30',
        ],
        // Active state
        'active:scale-[0.99]',
        // Text
        'text-flowstarter-elements-textPrimary',
        className,
      )}
      {...props}
    />
  );
});
Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => {
  return <div ref={ref} className={classNames('flex flex-col space-y-1.5 p-6', className)} {...props} />;
});
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={classNames('text-2xl font-semibold leading-none tracking-tight', className)}
        {...props}
      />
    );
  },
);
CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    return (
      <p ref={ref} className={classNames('text-sm text-flowstarter-elements-textSecondary', className)} {...props} />
    );
  },
);
CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => {
  return <div ref={ref} className={classNames('p-6 pt-0', className)} {...props} />;
});
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={classNames('flex items-center p-6 pt-0', className)} {...props} />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
