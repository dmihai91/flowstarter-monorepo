interface ArrowIconProps {
  className?: string;
  strokeWidth?: number;
}

export function ArrowIcon({ className = 'w-4 h-4', strokeWidth = 2 }: ArrowIconProps) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={strokeWidth}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 8l4 4m0 0l-4 4m4-4H3"
      />
    </svg>
  );
}
