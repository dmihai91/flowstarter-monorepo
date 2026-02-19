# Design Skill

Guidelines for creating professional, high-quality frontend designs in Flowstarter Editor.

## Design Philosophy

Flowstarter aims for designs that are:

- **Professional** - Production-ready, not prototype quality
- **Beautiful** - Visually appealing with attention to detail
- **Unique** - Avoid generic template aesthetics
- **Accessible** - WCAG AA compliant
- **Responsive** - Works across all device sizes

## Visual Standards

### Inspired By

- Apple's design language
- Stripe's polish and attention to detail
- Linear's modern interface
- Vercel's clean aesthetics

### Avoid

- Generic Bootstrap/template looks
- Basic "icon + text" headers
- Default component styling
- Layouts that feel like free templates

## Color System

### Using CSS Variables

```tsx
// Primary backgrounds (depth creates visual hierarchy)
<div className="bg-flowstarter-elements-background-depth-1">  // Deepest
<div className="bg-flowstarter-elements-background-depth-2">  // Middle
<div className="bg-flowstarter-elements-background-depth-3">  // Surface

// Text hierarchy
<h1 className="text-flowstarter-elements-textPrimary">      // Most important
<p className="text-flowstarter-elements-textSecondary">     // Supporting text
<span className="text-flowstarter-elements-textTertiary">   // Least important

// Borders and dividers
<div className="border border-flowstarter-elements-borderColor">
```

### Color Palette Guidelines

```
Primary Colors:
├── Use 3-5 main colors maximum
├── One primary action color (blue for interactive elements)
├── One accent color for highlights
└── Neutral grays for text and backgrounds

Contrast Requirements:
├── Text on background: minimum 4.5:1 ratio
├── Large text (18px+): minimum 3:1 ratio
└── Interactive elements: must be visually distinguishable

Color Psychology:
├── Blue: Trust, technology, action
├── Green: Success, growth, positive
├── Red: Error, danger, attention
├── Yellow/Orange: Warning, caution
└── Purple: Premium, creative
```

## Typography

### Font Scale

```tsx
// Heading hierarchy
<h1 className="text-4xl font-bold">   // 36px - Page titles
<h2 className="text-2xl font-semibold"> // 24px - Section headers
<h3 className="text-xl font-medium">    // 20px - Subsections
<h4 className="text-lg font-medium">    // 18px - Card headers

// Body text
<p className="text-base">               // 16px - Default body
<p className="text-sm">                 // 14px - Secondary text
<span className="text-xs">              // 12px - Labels, captions
```

### Typography Best Practices

```
Line Height:
├── Headings: 1.2-1.3
├── Body text: 1.5-1.7
└── UI elements: 1.4

Letter Spacing:
├── Large headings: -0.02em (slightly tighter)
├── Body text: 0 (normal)
└── Uppercase labels: 0.05em (looser)

Font Weights:
├── Bold (700): Headings, emphasis
├── Semibold (600): Subheadings, buttons
├── Medium (500): Labels, nav items
└── Regular (400): Body text
```

## Spacing System

### 8-Point Grid

All spacing uses multiples of 8px:

```tsx
// Tailwind spacing
<div className="p-1">    {/* 4px - Exception for tight spaces */}
<div className="p-2">    {/* 8px */}
<div className="p-3">    {/* 12px */}
<div className="p-4">    {/* 16px */}
<div className="p-6">    {/* 24px */}
<div className="p-8">    {/* 32px */}
<div className="p-12">   {/* 48px */}
<div className="p-16">   {/* 64px */}
```

### Spacing Guidelines

```
Component Internal Padding:
├── Buttons: py-2 px-4 (8px vertical, 16px horizontal)
├── Cards: p-4 to p-6 (16-24px)
├── Modals: p-6 (24px)
└── Sections: py-12 to py-24 (48-96px)

Element Gaps:
├── Inline elements: gap-2 (8px)
├── List items: gap-3 to gap-4 (12-16px)
├── Cards in grid: gap-4 to gap-6 (16-24px)
└── Major sections: gap-8 to gap-16 (32-64px)
```

## Layout Patterns

### Container Width

```tsx
// Centered content container
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

// Narrow content (text-focused)
<div className="max-w-3xl mx-auto">

// Wide content (dashboards)
<div className="max-w-full px-4">
```

### Grid Systems

```tsx
// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Two-column layout
<div className="grid grid-cols-1 lg:grid-cols-[280px_1fr]">
  <aside>Sidebar</aside>
  <main>Content</main>
</div>

// Content with fixed sidebar
<div className="flex">
  <aside className="w-64 shrink-0">Sidebar</aside>
  <main className="flex-1 min-w-0">Content</main>
</div>
```

## Component Design

### Buttons

```tsx
// Primary action
<button className={classNames(
  'px-4 py-2 rounded-lg font-medium',
  'bg-blue-600 text-white',
  'hover:bg-blue-700 active:bg-blue-800',
  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  'transition-colors duration-150'
)}>
  Primary Action
</button>

// Secondary action
<button className={classNames(
  'px-4 py-2 rounded-lg font-medium',
  'bg-transparent text-gray-700',
  'border border-gray-300',
  'hover:bg-gray-50 hover:border-gray-400',
  'focus:outline-none focus:ring-2 focus:ring-gray-500',
  'transition-colors duration-150'
)}>
  Secondary
</button>

// Ghost/text button
<button className={classNames(
  'px-3 py-1.5 rounded-md font-medium text-sm',
  'text-gray-600 hover:text-gray-900',
  'hover:bg-gray-100',
  'transition-colors duration-150'
)}>
  Text Action
</button>
```

### Cards

```tsx
<div className={classNames(
  'rounded-xl p-6',
  'bg-white dark:bg-gray-800',
  'border border-gray-200 dark:border-gray-700',
  'shadow-sm hover:shadow-md',
  'transition-shadow duration-200'
)}>
  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
    Card Title
  </h3>
  <p className="mt-2 text-gray-600 dark:text-gray-300">
    Card description text goes here.
  </p>
</div>
```

### Forms

```tsx
// Input field
<div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">
    Email
  </label>
  <input
    type="email"
    className={classNames(
      'w-full px-3 py-2 rounded-lg',
      'border border-gray-300',
      'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
      'placeholder:text-gray-400',
      'transition-colors duration-150'
    )}
    placeholder="you@example.com"
  />
  <p className="text-sm text-gray-500">
    We'll never share your email.
  </p>
</div>

// Error state
<input
  className={classNames(
    'w-full px-3 py-2 rounded-lg border',
    'border-red-500 focus:ring-red-500/20',
    'bg-red-50'
  )}
/>
<p className="text-sm text-red-600">
  Please enter a valid email address.
</p>
```

## Micro-Interactions

### Transitions

```tsx
// Subtle hover effect
<div className="transition-all duration-200 hover:scale-[1.02]">

// Color transitions
<button className="transition-colors duration-150">

// Transform + opacity
<div className="transition-all duration-300 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0">
```

### Animations

```css
/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}

/* Pulse for loading states */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

### Loading States

```tsx
// Skeleton loading
<div className="animate-pulse space-y-4">
  <div className="h-4 bg-gray-200 rounded w-3/4" />
  <div className="h-4 bg-gray-200 rounded w-1/2" />
</div>

// Spinner
<svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
</svg>
```

## Responsive Design

### Breakpoints

```tsx
// Mobile-first approach
<div className={classNames(
  // Mobile (default)
  'flex flex-col p-4',
  // Tablet (640px+)
  'sm:flex-row sm:p-6',
  // Desktop (1024px+)
  'lg:p-8'
)}>
```

### Common Responsive Patterns

```tsx
// Stack on mobile, row on desktop
<div className="flex flex-col md:flex-row gap-4">

// Single column to multi-column grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

// Hide on mobile, show on desktop
<div className="hidden lg:block">

// Show on mobile, hide on desktop
<div className="lg:hidden">

// Responsive font sizes
<h1 className="text-2xl md:text-4xl lg:text-5xl">
```

### Touch Targets

```tsx
// Minimum 44x44px for touch devices
<button className="min-h-[44px] min-w-[44px] px-4 py-2">

// Icon buttons
<button className="p-3"> {/* 12px padding + 20px icon = 44px */}
  <IconSettings className="w-5 h-5" />
</button>
```

## Dark Mode

### Implementation

```tsx
// Using Tailwind dark mode
<div className={classNames(
  'bg-white text-gray-900',
  'dark:bg-gray-900 dark:text-white'
)}>

// Dark mode specific colors
<div className={classNames(
  'border-gray-200 dark:border-gray-700',
  'hover:bg-gray-50 dark:hover:bg-gray-800'
)}>
```

### Color Adjustments for Dark Mode

```
Light Mode → Dark Mode:
├── bg-white → bg-gray-900
├── bg-gray-50 → bg-gray-800
├── bg-gray-100 → bg-gray-700
├── text-gray-900 → text-white
├── text-gray-600 → text-gray-300
├── border-gray-200 → border-gray-700
└── Reduce saturation of accent colors
```

## Accessibility

### Focus States

```tsx
// Visible focus ring
<button className={classNames(
  'focus:outline-none',
  'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2'
)}>
```

### Screen Readers

```tsx
// Visually hidden but accessible
<span className="sr-only">Close modal</span>

// Skip link
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to content
</a>

// ARIA labels
<button aria-label="Delete item" aria-describedby="delete-help">
  <IconTrash />
</button>
<p id="delete-help" className="sr-only">
  This will permanently delete the item.
</p>
```

### Reduced Motion

```tsx
// Respect user preference
<div className={classNames(
  'transition-transform duration-300',
  'motion-reduce:transition-none'
)}>
```

## Icons

### Using Lucide Icons

```tsx
import { Settings, User, ChevronRight } from 'lucide-react';

// Standard sizing
<Settings className="w-5 h-5" />  // 20px - Default
<User className="w-4 h-4" />       // 16px - Small
<ChevronRight className="w-6 h-6" /> // 24px - Large

// With text
<button className="flex items-center gap-2">
  <Settings className="w-5 h-5" />
  <span>Settings</span>
</button>
```

## Images

### Using Pexels Stock Photos

```tsx
// ALWAYS use Pexels, NEVER Unsplash
<img
  src="https://images.pexels.com/photos/123456/pexels-photo-123456.jpeg"
  alt="Descriptive alt text"
  className="w-full h-64 object-cover rounded-lg"
/>

// With loading state
<img
  src={imageUrl}
  alt={alt}
  className="w-full h-64 object-cover rounded-lg bg-gray-100"
  loading="lazy"
  onError={(e) => {
    e.currentTarget.src = '/fallback-image.jpg';
  }}
/>
```

### Image Optimization

```tsx
// Responsive images
<img
  srcSet="
    /image-320w.jpg 320w,
    /image-640w.jpg 640w,
    /image-1280w.jpg 1280w
  "
  sizes="(max-width: 640px) 100vw, 50vw"
  src="/image-640w.jpg"
  alt="Description"
/>

// Aspect ratio containers
<div className="aspect-video relative overflow-hidden rounded-lg">
  <img className="absolute inset-0 w-full h-full object-cover" />
</div>
```

## Design Checklist

Before completing a design:

- [ ] Uses CSS variables for theme colors
- [ ] Follows 8-point spacing grid
- [ ] Typography has clear hierarchy
- [ ] Contrast ratios meet WCAG AA
- [ ] Touch targets are at least 44x44px
- [ ] Focus states are visible
- [ ] Works in dark mode
- [ ] Responsive across breakpoints
- [ ] Animations respect reduced motion
- [ ] No generic template aesthetics
- [ ] Would impress a designer at Apple/Stripe
- [ ] Uses Pexels for stock photos (NOT Unsplash)
