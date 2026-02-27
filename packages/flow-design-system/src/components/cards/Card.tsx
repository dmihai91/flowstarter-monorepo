import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass' | 'outline';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  children: ReactNode;
}

const baseStyles = `
  rounded-2xl transition-all duration-200
`;

const variants = {
  default: `
    bg-white dark:bg-zinc-900
    border border-zinc-200 dark:border-zinc-800
  `,
  elevated: `
    bg-white dark:bg-zinc-900
    shadow-lg
  `,
  glass: `
    bg-white/50 dark:bg-zinc-900/50
    backdrop-blur-2xl backdrop-saturate-150
    border border-white/20 dark:border-white/10
    shadow-glass
  `,
  outline: `
    bg-transparent
    border border-zinc-200 dark:border-zinc-700
  `,
};

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const hoverStyles = {
  default: 'hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md',
  elevated: 'hover:shadow-xl hover:-translate-y-0.5',
  glass: 'hover:bg-white/60 dark:hover:bg-zinc-900/60 hover:shadow-glassHover',
  outline: 'hover:border-zinc-400 dark:hover:border-zinc-600',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ 
    variant = 'default', 
    padding = 'md',
    hoverable = false,
    children, 
    className = '',
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          ${baseStyles}
          ${variants[variant]}
          ${paddings[padding]}
          ${hoverable ? hoverStyles[variant] : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Sub-components
export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ children, className = '', ...props }, ref) => (
    <div ref={ref} className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ children, className = '', ...props }, ref) => (
    <h3 
      ref={ref} 
      className={`text-lg font-semibold text-zinc-900 dark:text-white ${className}`} 
      {...props}
    >
      {children}
    </h3>
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ children, className = '', ...props }, ref) => (
    <p 
      ref={ref} 
      className={`text-sm text-zinc-500 dark:text-zinc-400 ${className}`} 
      {...props}
    >
      {children}
    </p>
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ children, className = '', ...props }, ref) => (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ children, className = '', ...props }, ref) => (
    <div 
      ref={ref} 
      className={`mt-4 flex items-center gap-2 ${className}`} 
      {...props}
    >
      {children}
    </div>
  )
);
CardFooter.displayName = 'CardFooter';
