import { CreatingIcon, SyncingIcon, StartingIcon, IdleIcon } from './components/StatusIcons';

// Memoized animation variants to prevent recreation
export const orbAnimations = {
  opacity: [0.3, 0.6, 0.3],
  scale: [0.8, 1.1, 0.8],
  x: [0, 20, 0],
  y: [0, -15, 0],
};

export const orbTransition = (delay: number) => ({
  duration: 8,
  delay,
  repeat: Infinity,
  ease: 'easeInOut' as const,
});

export const STATUS_CONFIG = {
  idle: {
    icon: IdleIcon,
    title: 'Initializing preview...',
    subtitle: 'Preparing to start the preview',
    accentColor: 'rgba(139, 92, 246, 0.5)',
    progress: 10,
  },
  creating: {
    icon: CreatingIcon,
    title: 'Creating workspace...',
    subtitle: 'Setting up your development environment',
    accentColor: 'rgba(99, 102, 241, 0.5)',
    progress: 25,
  },
  syncing: {
    icon: SyncingIcon,
    title: 'Syncing files...',
    subtitle: 'Uploading your project files',
    accentColor: 'rgba(236, 72, 153, 0.5)',
    progress: 50,
  },
  starting: {
    icon: StartingIcon,
    title: 'Starting dev server...',
    subtitle: 'Running bun install and bun dev',
    accentColor: 'rgba(34, 197, 94, 0.5)',
    progress: 75,
  },
  reconnecting: {
    icon: SyncingIcon,
    title: 'Restoring preview...',
    subtitle: 'Reconnecting to your development environment',
    accentColor: 'rgba(99, 102, 241, 0.5)',
    progress: 50,
  },
} as const;

export const PROGRESS_STEPS = ['creating', 'syncing', 'starting', 'ready'] as const;
