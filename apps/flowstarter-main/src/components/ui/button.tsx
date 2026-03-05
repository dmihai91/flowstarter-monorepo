/**
 * Button — re-exports from @flowstarter/flow-design-system.
 *
 * Also provides a `buttonVariants` helper for backward compatibility
 * with shadcn components (calendar, pagination, alert-dialog) that
 * call `buttonVariants({ variant, size })` to compute class strings.
 */

import {
  Button as DSButton,
  getButtonStyles,
  type ButtonProps as DSButtonProps,
  type ButtonVariant,
  type ButtonSize,
} from '@flowstarter/flow-design-system';

export type { DSButtonProps as ButtonProps };
export { DSButton as Button };

/**
 * CVA-compatible helper: `buttonVariants({ variant, size, className })`.
 * Used by shadcn primitives that need class strings without rendering.
 */
export function buttonVariants(
  opts: { variant?: ButtonVariant | null; size?: ButtonSize | null; className?: string } = {},
): string {
  return getButtonStyles(
    opts.variant ?? 'default',
    opts.size ?? 'md',
    opts.className,
  );
}
