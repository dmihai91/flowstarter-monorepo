import { globSync } from 'fast-glob';
import fs from 'node:fs/promises';
import { basename } from 'node:path';
import { defineConfig, presetIcons, presetUno, transformerDirectives } from 'unocss';

const iconPaths = globSync('./icons/*.svg');

const collectionName = 'flowstarter';

const customIconCollection = iconPaths.reduce(
  (acc, iconPath) => {
    const [iconName] = basename(iconPath).split('.');

    acc[collectionName] ??= {};
    acc[collectionName][iconName] = async () => fs.readFile(iconPath, 'utf8');

    return acc;
  },
  {} as Record<string, Record<string, () => Promise<string>>>,
);

const BASE_COLORS = {
  white: '#ffffff',

  gray: {
    50: '#f5f5f5',
    100: '#e5e5e5',
    200: '#d4d4d4',
    300: '#b3b3b5',
    400: '#9a9a9d',
    500: '#7a7a7d',
    600: '#5e5e61',
    700: '#404043',
    800: '#262628',
    900: '#1b1b1d', // editor background
    950: '#0f0f10', // root background
  },

  slate: {
    50: '#f7f8fa',
    100: '#e9ecf3',
    200: '#d3d7e0',
    300: '#bac2cd',
    400: '#8e93a0',
    500: '#6f7480',
    600: '#525560',
    700: '#3a3c44',
    800: '#24252c',
    900: '#18181d',
    950: '#0d0d10',
  },

  accent: {
    50: '#eef5ff',
    100: '#d7e7ff',
    200: '#b7d5ff',
    300: '#8cbcfe',
    400: '#5a99ff',
    500: '#337bff', // main blue accent in screenshot
    600: '#2360d4',
    700: '#184aad',
    800: '#133a88',
    900: '#0f2c6b',
    950: '#0a1b45',
  },

  green: {
    50: '#e9fdf1',
    100: '#c7f7dc',
    200: '#9deebf',
    300: '#67e29b',
    400: '#37cf74',
    500: '#16b65b',
    600: '#10964a',
    700: '#0f753c',
    800: '#0f5c31',
    900: '#0c4525',
    950: '#062716',
  },

  orange: {
    50: '#fff4e9',
    100: '#ffe7c9',
    200: '#ffd394',
    300: '#ffbb55',
    400: '#ffa024',
    500: '#f28b05',
    600: '#d06d04',
    700: '#a35107',
    800: '#7f3f09',
    900: '#65330a',
  },

  red: {
    50: '#ffecec',
    100: '#ffd5d5',
    200: '#ffb5b5',
    300: '#ff8888',
    400: '#ff5f5f',
    500: '#ff3b3b',
    600: '#db2d2d',
    700: '#b22222',
    800: '#8c1c1c',
    900: '#6e1717',
    950: '#3e0c0c',
  },
};

const COLOR_PRIMITIVES = {
  ...BASE_COLORS,

  alpha: {
    gray: generateAlphaPalette(BASE_COLORS.gray[400]),
    slate: generateAlphaPalette(BASE_COLORS.slate[900]),
    red: generateAlphaPalette(BASE_COLORS.red[500]),
    accent: generateAlphaPalette(BASE_COLORS.accent[500]),
  },
};

export default defineConfig({
  safelist: [
    ...Object.keys(customIconCollection[collectionName] || {}).map((x) => `i-flowstarter:${x}`),

    // Add common Lucide icons to safelist
    'i-lucide:eye',
    'i-lucide:code',
    'i-lucide:database',
    'i-lucide:terminal',
    'i-lucide:settings',
    'i-lucide:rotate-cw',
    'i-lucide:more-horizontal',
    'i-lucide:external-link',
    'i-lucide:monitor',
    'i-lucide:download',
    'i-lucide:cloud-download',
    'i-lucide:git-branch',
    'i-lucide:loader-2',

    // Add Phosphor icons to safelist
    'i-ph:history-duotone',
    'i-ph:files-duotone',
    'i-ph:gear-duotone',
    'i-ph:chat-circle-duotone',
    'i-ph:lightning-duotone',
    'i-ph:sparkle-duotone',
  ],
  shortcuts: {
    'flowstarter-ease-cubic-bezier': 'ease-[cubic-bezier(0.4,0,0.2,1)]',
    'transition-theme': 'transition-[background-color,border-color,color] duration-150 flowstarter-ease-cubic-bezier',
    kdb: 'bg-flowstarter-elements-code-background text-flowstarter-elements-code-text py-1 px-1.5 rounded-md',
    'max-w-chat': 'max-w-[var(--chat-max-width)]',
  },
  rules: [
    /**
     * This shorthand doesn't exist in Tailwind and we overwrite it to avoid
     * any conflicts with minified CSS classes.
     */
    ['b', {}],
  ],
  theme: {
    fontFamily: {
      display: "'Outfit', system-ui, sans-serif",
    },
    colors: {
      ...COLOR_PRIMITIVES,
      flowstarter: {
        elements: {
          borderColor: 'var(--flowstarter-elements-borderColor)',
          borderColorActive: 'var(--flowstarter-elements-borderColorActive)',
          background: {
            depth: {
              1: 'var(--flowstarter-elements-bg-depth-1)',
              2: 'var(--flowstarter-elements-bg-depth-2)',
              3: 'var(--flowstarter-elements-bg-depth-3)',
              4: 'var(--flowstarter-elements-bg-depth-4)',
            },
          },
          textPrimary: 'var(--flowstarter-elements-textPrimary)',
          textSecondary: 'var(--flowstarter-elements-textSecondary)',
          textTertiary: 'var(--flowstarter-elements-textTertiary)',
          code: {
            background: 'var(--flowstarter-elements-code-background)',
            text: 'var(--flowstarter-elements-code-text)',
          },
          button: {
            primary: {
              background: 'var(--flowstarter-elements-button-primary-background)',
              backgroundHover: 'var(--flowstarter-elements-button-primary-backgroundHover)',
              text: 'var(--flowstarter-elements-button-primary-text)',
            },
            secondary: {
              background: 'var(--flowstarter-elements-button-secondary-background)',
              backgroundHover: 'var(--flowstarter-elements-button-secondary-backgroundHover)',
              text: 'var(--flowstarter-elements-button-secondary-text)',
            },
            danger: {
              background: 'var(--flowstarter-elements-button-danger-background)',
              backgroundHover: 'var(--flowstarter-elements-button-danger-backgroundHover)',
              text: 'var(--flowstarter-elements-button-danger-text)',
            },
          },
          item: {
            contentDefault: 'var(--flowstarter-elements-item-contentDefault)',
            contentActive: 'var(--flowstarter-elements-item-contentActive)',
            contentAccent: 'var(--flowstarter-elements-item-contentAccent)',
            contentDanger: 'var(--flowstarter-elements-item-contentDanger)',
            backgroundDefault: 'var(--flowstarter-elements-item-backgroundDefault)',
            backgroundActive: 'var(--flowstarter-elements-item-backgroundActive)',
            backgroundAccent: 'var(--flowstarter-elements-item-backgroundAccent)',
            backgroundDanger: 'var(--flowstarter-elements-item-backgroundDanger)',
          },
          actions: {
            background: 'var(--flowstarter-elements-actions-background)',
            code: {
              background: 'var(--flowstarter-elements-actions-code-background)',
            },
          },
          artifacts: {
            background: 'var(--flowstarter-elements-artifacts-background)',
            backgroundHover: 'var(--flowstarter-elements-artifacts-backgroundHover)',
            borderColor: 'var(--flowstarter-elements-artifacts-borderColor)',
            inlineCode: {
              background: 'var(--flowstarter-elements-artifacts-inlineCode-background)',
              text: 'var(--flowstarter-elements-artifacts-inlineCode-text)',
            },
          },
          messages: {
            background: 'var(--flowstarter-elements-messages-background)',
            linkColor: 'var(--flowstarter-elements-messages-linkColor)',
            code: {
              background: 'var(--flowstarter-elements-messages-code-background)',
            },
            inlineCode: {
              background: 'var(--flowstarter-elements-messages-inlineCode-background)',
              text: 'var(--flowstarter-elements-messages-inlineCode-text)',
            },
          },
          icon: {
            success: 'var(--flowstarter-elements-icon-success)',
            error: 'var(--flowstarter-elements-icon-error)',
            primary: 'var(--flowstarter-elements-icon-primary)',
            secondary: 'var(--flowstarter-elements-icon-secondary)',
            tertiary: 'var(--flowstarter-elements-icon-tertiary)',
          },
          preview: {
            addressBar: {
              background: 'var(--flowstarter-elements-preview-addressBar-background)',
              backgroundHover: 'var(--flowstarter-elements-preview-addressBar-backgroundHover)',
              backgroundActive: 'var(--flowstarter-elements-preview-addressBar-backgroundActive)',
              text: 'var(--flowstarter-elements-preview-addressBar-text)',
              textActive: 'var(--flowstarter-elements-preview-addressBar-textActive)',
            },
          },
          terminals: {
            background: 'var(--flowstarter-elements-terminals-background)',
            buttonBackground: 'var(--flowstarter-elements-terminals-buttonBackground)',
          },
          dividerColor: 'var(--flowstarter-elements-dividerColor)',
          loader: {
            background: 'var(--flowstarter-elements-loader-background)',
            progress: 'var(--flowstarter-elements-loader-progress)',
          },
          prompt: {
            background: 'var(--flowstarter-elements-prompt-background)',
          },
          sidebar: {
            dropdownShadow: 'var(--flowstarter-elements-sidebar-dropdownShadow)',
            buttonBackgroundDefault: 'var(--flowstarter-elements-sidebar-buttonBackgroundDefault)',
            buttonBackgroundHover: 'var(--flowstarter-elements-sidebar-buttonBackgroundHover)',
            buttonText: 'var(--flowstarter-elements-sidebar-buttonText)',
          },
          cta: {
            background: 'var(--flowstarter-elements-cta-background)',
            text: 'var(--flowstarter-elements-cta-text)',
          },
        },
      },
    },
  },
  transformers: [transformerDirectives()],
  presets: [
    presetUno({
      dark: {
        light: '[data-theme="light"]',
        dark: '[data-theme="dark"]',
      },
    }),
    presetIcons({
      warn: true,
      collections: customIconCollection,
      unit: 'em',
    }),
  ],
});

/**
 * Generates an alpha palette for a given hex color.
 *
 * @param hex - The hex color code (without alpha) to generate the palette from.
 * @returns An object where keys are opacity percentages and values are hex colors with alpha.
 *
 * Example:
 *
 * ```
 * {
 *   '1': '#FFFFFF03',
 *   '2': '#FFFFFF05',
 *   '3': '#FFFFFF08',
 * }
 * ```
 */
function generateAlphaPalette(hex: string) {
  return [1, 2, 3, 4, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].reduce(
    (acc, opacity) => {
      const alpha = Math.round((opacity / 100) * 255)
        .toString(16)
        .padStart(2, '0');

      acc[opacity] = `${hex}${alpha}`;

      return acc;
    },
    {} as Record<number, string>,
  );
}

