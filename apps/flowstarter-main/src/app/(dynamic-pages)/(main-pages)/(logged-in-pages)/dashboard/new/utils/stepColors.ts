import type { ProjectWizardStep } from '@/types/project-config';

export interface StepColor {
  bgDark: string;
  bgLight: string;
  lightBg: string;
}

// Step color mapping matching Figma accents
export function getStepColor(stepId: ProjectWizardStep): StepColor | null {
  const colorMap: Record<ProjectWizardStep, StepColor> = {
    details: {
      bgDark: '#c1c8ff', // Light blue for dark mode
      bgLight: '#4d5dd9', // Darker blue for light mode
      lightBg: 'hsl(240, 10%, 20%)',
    },
    template: {
      bgDark: '#d478d8', // More saturated pink to harmonize with blue
      bgLight: '#d478d8', // More saturated pink to harmonize with blue
      lightBg: '#fbf9fc', // Light pink background
    },
    design: {
      bgDark: '#FFFAB8',
      bgLight: '#d4c96e',
      lightBg: '#fffceb',
    },
    review: {
      bgDark: '#C8FFC7',
      bgLight: '#6bc96a',
      lightBg: '#e8ffe8',
    },
  };

  return colorMap[stepId] || null;
}
