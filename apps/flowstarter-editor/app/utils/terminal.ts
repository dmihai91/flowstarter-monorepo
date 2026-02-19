const reset = '\x1b[0m';

export const escapeCodes = {
  reset,
  clear: '\x1b[g',
  red: '\x1b[1;31m',
  yellow: '\x1b[1;33m',
  cyan: '\x1b[1;36m',
  green: '\x1b[1;32m',
  blue: '\x1b[1;34m',
};

export const coloredText = {
  red: (text: string) => `${escapeCodes.red}${text}${reset}`,
  yellow: (text: string) => `${escapeCodes.yellow}${text}${reset}`,
  cyan: (text: string) => `${escapeCodes.cyan}${text}${reset}`,
  green: (text: string) => `${escapeCodes.green}${text}${reset}`,
  blue: (text: string) => `${escapeCodes.blue}${text}${reset}`,
};

