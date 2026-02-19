import type { ColorPalette } from '~/lib/stores/palettes';
import type { ViewportType } from './types';

export const VIEWPORT_CONFIG: Record<
  ViewportType,
  {
    width: number;
    label: string;
    icon: string;
  }
> = {
  mobile: {
    width: 375,
    label: 'Mobile',
    icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
  },
  tablet: {
    width: 768,
    label: 'Tablet',
    icon: 'M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
  },
  desktop: {
    width: 1280,
    label: 'Desktop',
    icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
};

export const DEFAULT_PALETTE: ColorPalette = {
  id: 'default',
  name: 'Default Theme',
  colors: ['#4D5DD9', '#C1C8FF', '#4D5DD9', '#0F0F1A'],
};

