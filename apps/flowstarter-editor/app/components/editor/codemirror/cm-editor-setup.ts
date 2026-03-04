import { acceptCompletion, autocompletion, closeBrackets } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { bracketMatching, indentOnInput, indentUnit } from '@codemirror/language';
import { EditorState, type Extension } from '@codemirror/state';
import {
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  scrollPastEnd,
  tooltips,
} from '@codemirror/view';
import type { MutableRefObject } from 'react';
import type { Theme } from '~/types/theme';
import { debounce } from '~/utils/debounce';
import { getTheme } from './cm-theme';
import { indentKeyBinding } from './indent';
import type { EditorSettings, OnScrollCallback, OnSaveCallback } from './cm-types';
import {
  readOnlyTooltipStateEffect,
  editableTooltipField,
  editableStateField,
} from './cm-state-fields';

const CODE_FILE_EXTENSIONS = [
  '.js', '.ts', '.tsx', '.jsx', '.py', '.cpp', '.c', '.h', '.hpp',
  '.vue', '.html', '.css', '.scss', '.sass', '.json', '.java', '.rs', '.go', '.php',
];

export function newEditorState(
  content: string,
  theme: Theme,
  settings: EditorSettings | undefined,
  onScrollRef: MutableRefObject<OnScrollCallback | undefined>,
  debounceScroll: number,
  onFileSaveRef: MutableRefObject<OnSaveCallback | undefined>,
  loadSearchExtension: (view: EditorView) => Promise<void>,
  extensions: Extension[],
  filePath?: string,
) {
  const isCodeFile = filePath
    ? CODE_FILE_EXTENSIONS.some((ext) => filePath.endsWith(ext))
    : true;

  return EditorState.create({
    doc: content,
    extensions: [
      EditorView.domEventHandlers({
        scroll: debounce((event, view) => {
          if (event.target !== view.scrollDOM) {
            return;
          }

          onScrollRef.current?.({ left: view.scrollDOM.scrollLeft, top: view.scrollDOM.scrollTop });
        }, debounceScroll),
        keydown: (event, view) => {
          if ((event.metaKey || event.ctrlKey) && event.key === 'f') {
            event.preventDefault();
            loadSearchExtension(view);

            return true;
          }

          if (view.state.readOnly) {
            view.dispatch({
              effects: [readOnlyTooltipStateEffect.of(event.key !== 'Escape')],
            });

            return true;
          }

          return false;
        },
      }),
      getTheme(theme, settings),
      history(),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        { key: 'Tab', run: acceptCompletion },
        {
          key: 'Mod-s',
          preventDefault: true,
          run: () => {
            onFileSaveRef.current?.();
            return true;
          },
        },
        indentKeyBinding,
      ]),
      indentUnit.of('\t'),
      autocompletion({
        closeOnBlur: false,
      }),
      tooltips({
        position: 'absolute',
        parent: document.body,
        tooltipSpace: (view) => {
          const rect = view.dom.getBoundingClientRect();

          return {
            top: rect.top - 50,
            left: rect.left,
            bottom: rect.bottom,
            right: rect.right + 10,
          };
        },
      }),
      closeBrackets(),
      lineNumbers(),
      scrollPastEnd(),
      dropCursor(),
      drawSelection(),
      ...(isCodeFile ? [bracketMatching()] : []),
      EditorState.tabSize.of(settings?.tabSize ?? 2),
      indentOnInput(),
      editableTooltipField,
      editableStateField,
      EditorState.readOnly.from(editableStateField, (editable) => !editable),
      highlightActiveLineGutter(),
      highlightActiveLine(),
      ...extensions,
    ],
  });
}
