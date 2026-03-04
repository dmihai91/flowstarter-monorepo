import type { Compartment } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import type { Theme } from '~/types/theme';
import { createScopedLogger } from '~/utils/logger';
import { isFileLocked, getCurrentChatId } from '~/utils/fileLocks';
import { getLanguage } from './languages';
import { reconfigureTheme } from './cm-theme';
import { editableStateEffect } from './cm-state-fields';
import type { EditorDocument, TextEditorDocument } from './cm-types';

const logger = createScopedLogger('CodeMirrorEditor');

export function setNoDocument(view: EditorView) {
  view.dispatch({
    selection: { anchor: 0 },
    changes: {
      from: 0,
      to: view.state.doc.length,
      insert: '',
    },
  });

  view.scrollDOM.scrollTo(0, 0);
}

export function scrollToPosition(view: EditorView, doc: EditorDocument) {
  if (typeof doc.scroll?.line === 'number') {
    const line = doc.scroll.line;
    const column = doc.scroll.column ?? 0;

    try {
      const totalLines = view.state.doc.lines;

      if (line < totalLines) {
        const linePos = view.state.doc.line(line + 1).from + column;
        view.dispatch({
          selection: { anchor: linePos },
          scrollIntoView: true,
        });
        view.focus();
      } else {
        logger.warn(`Invalid line number ${line + 1} in ${totalLines}-line document`);
      }
    } catch (error) {
      logger.error('Error scrolling to line:', error);
    }
  } else if (typeof doc.scroll?.top === 'number' || typeof doc.scroll?.left === 'number') {
    view.scrollDOM.scrollTo(doc.scroll.left ?? 0, doc.scroll.top ?? 0);
  }
}

export function setEditorDocument(
  view: EditorView,
  theme: Theme,
  editable: boolean,
  languageCompartment: Compartment,
  autoFocus: boolean,
  doc: TextEditorDocument,
) {
  if (doc.value !== view.state.doc.toString()) {
    view.dispatch({
      selection: { anchor: 0 },
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: doc.value,
      },
    });
  }

  const currentChatId = getCurrentChatId();
  const { locked } = isFileLocked(doc.filePath, currentChatId);

  view.dispatch({
    effects: [editableStateEffect.of(editable && !doc.isBinary && !locked)],
  });

  getLanguage(doc.filePath).then((languageSupport) => {
    if (!languageSupport) {
      return;
    }

    view.dispatch({
      effects: [languageCompartment.reconfigure([languageSupport]), reconfigureTheme(theme)],
    });

    requestAnimationFrame(() => {
      const currentLeft = view.scrollDOM.scrollLeft;
      const currentTop = view.scrollDOM.scrollTop;
      const newLeft = doc.scroll?.left ?? 0;
      const newTop = doc.scroll?.top ?? 0;

      if (typeof doc.scroll?.line === 'number') {
        const line = doc.scroll.line;
        const column = doc.scroll.column ?? 0;

        try {
          const totalLines = view.state.doc.lines;

          if (line < totalLines) {
            const linePos = view.state.doc.line(line + 1).from + column;
            view.dispatch({
              selection: { anchor: linePos },
              scrollIntoView: true,
            });
            view.focus();
          } else {
            logger.warn(`Invalid line number ${line + 1} in ${totalLines}-line document`);
          }
        } catch (error) {
          logger.error('Error scrolling to line:', error);
        }

        return;
      }

      const needsScrolling = currentLeft !== newLeft || currentTop !== newTop;

      if (autoFocus && editable) {
        if (needsScrolling) {
          view.scrollDOM.addEventListener(
            'scroll',
            () => {
              view.focus();
            },
            { once: true },
          );
        } else {
          view.focus();
        }
      }

      view.scrollDOM.scrollTo(newLeft, newTop);
    });
  });
}
