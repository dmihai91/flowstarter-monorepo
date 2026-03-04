import { StateEffect, StateField, type EditorState } from '@codemirror/state';
import { showTooltip, type Tooltip } from '@codemirror/view';
import { isFileLocked, getCurrentChatId } from '~/utils/fileLocks';
import type { EditorDocument } from './cm-types';

/** Module-level reference to the current document for tooltip functions */
export let currentDocRef: EditorDocument | undefined;

export function setCurrentDocRef(doc: EditorDocument | undefined) {
  currentDocRef = doc;
}

export const readOnlyTooltipStateEffect = StateEffect.define<boolean>();

export const editableTooltipField = StateField.define<readonly Tooltip[]>({
  create: () => [],
  update(_tooltips, transaction) {
    if (!transaction.state.readOnly) {
      return [];
    }

    for (const effect of transaction.effects) {
      if (effect.is(readOnlyTooltipStateEffect) && effect.value) {
        return getReadOnlyTooltip(transaction.state);
      }
    }

    return [];
  },
  provide: (field) => {
    return showTooltip.computeN([field], (state) => state.field(field));
  },
});

export const editableStateEffect = StateEffect.define<boolean>();

export const editableStateField = StateField.define<boolean>({
  create() {
    return true;
  },
  update(value, transaction) {
    for (const effect of transaction.effects) {
      if (effect.is(editableStateEffect)) {
        return effect.value;
      }
    }

    return value;
  },
});

function getReadOnlyTooltip(state: EditorState) {
  if (!state.readOnly) {
    return [];
  }

  const currentDoc = currentDocRef;
  let tooltipMessage = 'Cannot edit file while AI response is being generated';

  if (currentDoc?.filePath) {
    const chatId = getCurrentChatId();
    const { locked } = isFileLocked(currentDoc.filePath, chatId);

    if (locked) {
      tooltipMessage = 'This file is locked and cannot be edited';
    }
  }

  return state.selection.ranges
    .filter((range) => range.empty)
    .map((range) => ({
      pos: range.head,
      above: true,
      strictSide: true,
      arrow: true,
      create: () => {
        const divElement = document.createElement('div');
        divElement.className = 'cm-readonly-tooltip';
        divElement.textContent = tooltipMessage;

        return { dom: divElement };
      },
    }));
}
