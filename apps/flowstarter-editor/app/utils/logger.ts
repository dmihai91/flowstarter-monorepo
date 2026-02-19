export type DebugLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';
import { Chalk } from 'chalk';

const chalk = new Chalk({ level: 3 });

type LoggerFunction = (...messages: unknown[]) => void;

interface Logger {
  trace: LoggerFunction;
  debug: LoggerFunction;
  info: LoggerFunction;
  warn: LoggerFunction;
  error: LoggerFunction;
  setLevel: (level: DebugLevel) => void;
}

let currentLevel: DebugLevel = (import.meta.env.VITE_LOG_LEVEL ?? import.meta.env.DEV) ? 'debug' : 'info';

export const logger: Logger = {
  trace: (...messages: unknown[]) => log('trace', undefined, messages),
  debug: (...messages: unknown[]) => log('debug', undefined, messages),
  info: (...messages: unknown[]) => log('info', undefined, messages),
  warn: (...messages: unknown[]) => log('warn', undefined, messages),
  error: (...messages: unknown[]) => log('error', undefined, messages),
  setLevel,
};

export function createScopedLogger(scope: string): Logger {
  return {
    trace: (...messages: unknown[]) => log('trace', scope, messages),
    debug: (...messages: unknown[]) => log('debug', scope, messages),
    info: (...messages: unknown[]) => log('info', scope, messages),
    warn: (...messages: unknown[]) => log('warn', scope, messages),
    error: (...messages: unknown[]) => log('error', scope, messages),
    setLevel,
  };
}

function setLevel(level: DebugLevel) {
  if ((level === 'trace' || level === 'debug') && import.meta.env.PROD) {
    return;
  }

  currentLevel = level;
}

function log(level: DebugLevel, scope: string | undefined, messages: unknown[]) {
  const levelOrder: DebugLevel[] = ['trace', 'debug', 'info', 'warn', 'error'];

  if (levelOrder.indexOf(level) < levelOrder.indexOf(currentLevel)) {
    return;
  }

  const allMessages = messages.reduce<string>((acc, current) => {
    const currentStr = String(current);

    if (acc.endsWith('\n')) {
      return acc + currentStr;
    }

    if (!acc) {
      return currentStr;
    }

    return `${acc} ${currentStr}`;
  }, '');

  const labelBackgroundColor = getColorForLevel(level);
  const labelTextColor = level === 'warn' ? '#000000' : '#FFFFFF';

  const labelStyles = getLabelStyles(labelBackgroundColor, labelTextColor);
  const scopeStyles = getLabelStyles('#77828D', 'white');

  const styles = [labelStyles];

  if (typeof scope === 'string') {
    styles.push('', scopeStyles);
  }

  let labelText = formatText(` ${level.toUpperCase()} `, labelTextColor, labelBackgroundColor);

  if (scope) {
    labelText = `${labelText} ${formatText(` ${scope} `, '#FFFFFF', '77828D')}`;
  }

  if (typeof window !== 'undefined') {
    console.log(`%c${level.toUpperCase()}${scope ? `%c %c${scope}` : ''}`, ...styles, allMessages);
  } else {
    console.log(`${labelText}`, allMessages);
  }
}

function formatText(text: string, color: string, bg: string) {
  return chalk.bgHex(bg)(chalk.hex(color)(text));
}

function getLabelStyles(color: string, textColor: string) {
  return `background-color: ${color}; color: white; border: 4px solid ${color}; color: ${textColor};`;
}

function getColorForLevel(level: DebugLevel): string {
  switch (level) {
    case 'trace':
    case 'debug': {
      return '#77828D';
    }
    case 'info': {
      return '#1389FD';
    }
    case 'warn': {
      return '#FFDB6C';
    }
    case 'error': {
      return '#EE4744';
    }
    default: {
      return '#000000';
    }
  }
}

export const renderLogger = createScopedLogger('Render');

