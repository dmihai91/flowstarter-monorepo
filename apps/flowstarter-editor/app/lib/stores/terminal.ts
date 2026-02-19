/**
 * Terminal Store
 *
 * In Daytona mode, the terminal shows informational messages about the cloud runtime.
 * Local shell processes are not available - all execution happens in Daytona sandboxes.
 */

import { atom, type WritableAtom } from 'nanostores';
import type { ITerminal } from '~/types/terminal';
import { coloredText } from '~/utils/terminal';

// Shell stub type for Daytona mode
type ShellStub = { terminal: unknown; process: unknown };

export class TerminalStore {
  #flowstarterTerminal: ShellStub = { terminal: null, process: null };

  showTerminal: WritableAtom<boolean> = import.meta.hot?.data.showTerminal ?? atom(true);

  constructor() {
    if (import.meta.hot) {
      import.meta.hot.data.showTerminal = this.showTerminal;
    }
  }

  get flowstarterTerminal() {
    return this.#flowstarterTerminal;
  }

  toggleTerminal(value?: boolean) {
    this.showTerminal.set(value !== undefined ? value : !this.showTerminal.get());
  }

  async attachFlowstarterTerminal(terminal: ITerminal) {
    // Daytona mode - show info message
    terminal.write(coloredText.yellow('╭─────────────────────────────────────────────────────╮\n'));
    terminal.write(
      coloredText.yellow('│  ') +
        coloredText.cyan('Daytona Cloud Runtime') +
        coloredText.yellow('                            │\n'),
    );
    terminal.write(coloredText.yellow('├─────────────────────────────────────────────────────┤\n'));
    terminal.write(
      coloredText.yellow('│  ') + 'Preview runs in a remote Daytona sandbox.' + coloredText.yellow('       │\n'),
    );
    terminal.write(
      coloredText.yellow('│  ') + 'Terminal is managed automatically.' + coloredText.yellow('              │\n'),
    );
    terminal.write(
      coloredText.yellow('│  ') + 'Your changes sync to the cloud preview.' + coloredText.yellow('         │\n'),
    );
    terminal.write(coloredText.yellow('╰─────────────────────────────────────────────────────╯\n'));
  }

  async attachTerminal(terminal: ITerminal) {
    // Daytona mode - show info message
    terminal.write(coloredText.yellow('╭─────────────────────────────────────────────────────╮\n'));
    terminal.write(
      coloredText.yellow('│  ') +
        coloredText.cyan('Daytona Cloud Runtime') +
        coloredText.yellow('                            │\n'),
    );
    terminal.write(coloredText.yellow('├─────────────────────────────────────────────────────┤\n'));
    terminal.write(
      coloredText.yellow('│  ') + 'Preview runs in a remote Daytona sandbox.' + coloredText.yellow('       │\n'),
    );
    terminal.write(
      coloredText.yellow('│  ') + 'Local terminal is not available in this mode.' + coloredText.yellow('   │\n'),
    );
    terminal.write(
      coloredText.yellow('│  ') + 'Your changes sync automatically to the cloud.' + coloredText.yellow('   │\n'),
    );
    terminal.write(coloredText.yellow('╰─────────────────────────────────────────────────────╯\n'));
  }

  onTerminalResize(_cols: number, _rows: number) {
    // No-op in Daytona mode - no local shell processes
  }
}

