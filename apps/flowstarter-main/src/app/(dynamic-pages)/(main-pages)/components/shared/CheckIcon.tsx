interface CheckIconProps {
  className?: string;
  strokeWidth?: number;
}

export function CheckIcon({ className = 'w-4 h-4 text-emerald-500', strokeWidth = 2.5 }: CheckIconProps) {
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
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
