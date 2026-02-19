import type { ITheme } from '@xterm/xterm';

const style = getComputedStyle(document.documentElement);
const cssVar = (token: string) => style.getPropertyValue(token) || undefined;

export function getTerminalTheme(overrides?: ITheme): ITheme {
  return {
    cursor: cssVar('--flowstarter-elements-terminal-cursorColor'),
    cursorAccent: cssVar('--flowstarter-elements-terminal-cursorColorAccent'),
    foreground: cssVar('--flowstarter-elements-terminal-textColor'),
    background: cssVar('--flowstarter-elements-terminal-backgroundColor'),
    selectionBackground: cssVar('--flowstarter-elements-terminal-selection-backgroundColor'),
    selectionForeground: cssVar('--flowstarter-elements-terminal-selection-textColor'),
    selectionInactiveBackground: cssVar('--flowstarter-elements-terminal-selection-backgroundColorInactive'),

    // ansi escape code colors
    black: cssVar('--flowstarter-elements-terminal-color-black'),
    red: cssVar('--flowstarter-elements-terminal-color-red'),
    green: cssVar('--flowstarter-elements-terminal-color-green'),
    yellow: cssVar('--flowstarter-elements-terminal-color-yellow'),
    blue: cssVar('--flowstarter-elements-terminal-color-blue'),
    magenta: cssVar('--flowstarter-elements-terminal-color-magenta'),
    cyan: cssVar('--flowstarter-elements-terminal-color-cyan'),
    white: cssVar('--flowstarter-elements-terminal-color-white'),
    brightBlack: cssVar('--flowstarter-elements-terminal-color-brightBlack'),
    brightRed: cssVar('--flowstarter-elements-terminal-color-brightRed'),
    brightGreen: cssVar('--flowstarter-elements-terminal-color-brightGreen'),
    brightYellow: cssVar('--flowstarter-elements-terminal-color-brightYellow'),
    brightBlue: cssVar('--flowstarter-elements-terminal-color-brightBlue'),
    brightMagenta: cssVar('--flowstarter-elements-terminal-color-brightMagenta'),
    brightCyan: cssVar('--flowstarter-elements-terminal-color-brightCyan'),
    brightWhite: cssVar('--flowstarter-elements-terminal-color-brightWhite'),

    ...overrides,
  };
}

