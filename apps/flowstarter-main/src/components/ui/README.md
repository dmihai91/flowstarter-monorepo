# Flowstarter Unified Button System

A comprehensive button component system that ensures consistent styling and behavior across the entire Flowstarter application.

## Overview

The `Button` component is a unified button system that extends shadcn/ui with Flowstarter-specific styling, additional variants, built-in loading states, and enhanced functionality while maintaining full TypeScript support and accessibility features.

## Quick Start

```tsx
import { Button, PrimaryButton } from '@/components/button/Button';
import { Save } from 'lucide-react';

// Basic usage
<Button variant="primary">Click Me</Button>

// Preset component
<PrimaryButton>Primary Action</PrimaryButton>

// With icons and loading
<Button
  variant="success"
  leftIcon={<Save />}
  loading={isLoading}
  loadingText="Saving..."
>
  Save Changes
</Button>
```

## Available Variants

### Core Variants

- `default` - Standard button with primary background
- `primary` - Enhanced primary button with gradient and hover effects
- `secondary` - Secondary button with muted styling
- `outline` - Outlined button with transparent background
- `ghost` - Minimal button with hover effects
- `link` - Text-only button with underline
- `destructive` - Red button for dangerous actions

### Status Variants

- `success` - Green button for positive actions
- `warning` - Yellow button for caution
- `info` - Blue button for information
- `success-outline` - Outlined green button
- `primary-outline` - Outlined primary button
- `destructive-outline` - Outlined red button

### Special Variants

- `gradient` - Purple to blue gradient button
- `floating` - Elevated button with strong shadow

## Sizes

- `sm` - Small button (32px height)
- `default` - Standard button (40px height)
- `lg` - Large button (48px height)
- `xl` - Extra large button (56px height)
- `icon` - Square icon button (40x40px)
- `icon-sm` - Small icon button (32x32px)
- `icon-lg` - Large icon button (48x48px)
- `full` - Full width button
- `full-lg` - Full width large button

## Features

### Icons

Add icons to the left or right of button text:

```tsx
<Button leftIcon={<Download />}>Download</Button>
<Button rightIcon={<ArrowRight />}>Continue</Button>
```

### Loading States

Built-in loading spinner with optional custom text:

```tsx
<Button loading={isLoading}>Submit</Button>
<Button loading={isLoading} loadingText="Processing...">
  Process Data
</Button>
```

### Button Groups

Group related buttons together:

```tsx
import { ButtonGroup } from '@/components/button/Button';

<ButtonGroup>
  <Button variant="outline">Left</Button>
  <Button variant="outline">Center</Button>
  <Button variant="outline">Right</Button>
</ButtonGroup>;
```

## Preset Components

For common use cases, use these preset components:

```tsx
import {
  PrimaryButton,
  SecondaryButton,
  SuccessButton,
  DangerButton,
  GhostButton,
  GradientButton,
  FloatingButton,
} from '@/components/button/Button';
```

## Migration Guide

### From Old Button Component

**Before:**

```tsx
import { Button } from '@/components/ui/button';
<Button variant="default">Click Me</Button>;
```

**After:**

```tsx
import { Button } from '@/components/button/Button';
<Button variant="primary">Click Me</Button>;
```

### Backward Compatibility

The existing `Button` component has been updated with all unified functionality, so existing code will continue to work but will benefit from the enhanced styling and features.

## Best Practices

1. **Use appropriate variants**: Choose variants that match the action's importance and context
2. **Be consistent**: Use the same variant for similar actions throughout the app
3. **Provide feedback**: Use loading states for async operations
4. **Use preset components**: They provide consistent styling for common patterns
5. **Add meaningful icons**: Icons should enhance understanding, not clutter the interface

### Variant Usage Guidelines

- **Primary/PrimaryButton**: Main actions (Submit, Save, Create)
- **Secondary/SecondaryButton**: Secondary actions (Cancel, Edit)
- **Success/SuccessButton**: Positive confirmations (Approve, Confirm)
- **Destructive/DangerButton**: Dangerous actions (Delete, Remove)
- **Ghost/GhostButton**: Subtle actions (Close, Minimize)
- **Outline**: Alternative actions or filters
- **Gradient**: Special promotional or featured actions

## TypeScript Support

Full TypeScript support with proper type inference:

```tsx
import type { ButtonProps } from '@/components/button/Button';

const MyButton: React.FC<ButtonProps> = (props) => {
  return <Button {...props} />;
};
```

## Accessibility

The button component includes:

- Proper ARIA attributes
- Keyboard navigation support
- Focus management
- Screen reader compatibility
- High contrast support

## Examples

The button system includes comprehensive variants and features as demonstrated in the codebase usage.

## Contributing

When adding new button variants or features:

1. Add the variant to the `buttonVariants` cva in `/components/button/Button.tsx`
2. Update the TypeScript types
3. Update this documentation
4. Ensure accessibility compliance

## Support

For questions or issues with the button system, please check:

1. This documentation
2. Existing usage in the codebase
3. The shadcn/ui button documentation for underlying functionality
