/**
 * @flowstarter/flow - Flowstarter Design System
 * 
 * Shared UI components and design tokens for all Flowstarter apps.
 */

// Components - Brand
export { Logo, LogoIcon } from './components/Logo';
export { LoadingScreen } from './components/LoadingScreen';
export { ThemeToggle, type ThemeToggleProps } from './components/ThemeToggle';

// Components - Buttons
export { Button, type ButtonProps } from './components/buttons/Button';

// Components - Cards
export { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter,
  type CardProps,
} from './components/cards/Card';

// Components - Inputs
export { Input, type InputProps } from './components/inputs/Input';

// Components - Feedback
export { Spinner } from './components/feedback/Spinner';
export { StatusDot, type StatusDotProps } from './components/feedback/StatusDot';

// Components - Backgrounds
export { FlowBackground, type FlowBackgroundProps, type FlowBackgroundVariant } from './components/backgrounds/FlowBackground';
export { AmbientGlow, type AmbientGlowProps } from './components/backgrounds/AmbientGlow';

// Components - Layout
export { GlassPanel, type GlassPanelProps } from './components/layout/GlassPanel';
export { ScrollAwareHeader, type ScrollAwareHeaderProps } from './components/layout/ScrollAwareHeader';
export { Footer, type FooterProps, type FooterLink } from './components/layout/Footer';

// Components - Cards (extended)
export { GlassCard, type GlassCardProps } from './components/cards/GlassCard';
export { StatCard, type StatCardProps } from './components/cards/StatCard';

// Design Tokens
export * from './tokens';

// Utilities
export { 
  getTheme, 
  setTheme, 
  getEffectiveTheme, 
  applyTheme, 
  initTheme,
  type Theme,
} from './utils/theme';
