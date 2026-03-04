import { foldGutter } from '@codemirror/language';
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { memo, useEffect, useRef, useState } from 'react';
import type { Theme } from '~/types/theme';
import { classNames } from '~/utils/classNames';
import { debounce } from '~/utils/debounce';
import { createScopedLogger, renderLogger } from '~/utils/logger';
import { isFileLocked, getCurrentChatId } from '~/utils/fileLocks';
import { BinaryContent } from './BinaryContent';
import { reconfigureTheme } from './cm-theme';
import { createEnvMaskingExtension } from './EnvMasking';
import { setCurrentDocRef, editableStateEffect } from './cm-state-fields';
import { newEditorState } from './cm-editor-setup';
import { setNoDocument, setEditorDocument, scrollToPosition } from './cm-editor-document';
import type { EditorDocument, EditorUpdate, EditorProps, EditorStates, TextEditorDocument } from './cm-types';

// Re-export types for backward compatibility
export type {
  EditorDocument,
  EditorSettings,
  ScrollPosition,
  EditorUpdate,
  OnChangeCallback,
  OnScrollCallback,
  OnSaveCallback,
} from './cm-types';

const logger = createScopedLogger('CodeMirrorEditor');

export const CodeMirrorEditor = memo(
  ({
    id,
    doc,
    debounceScroll = 100,
    debounceChange = 300,
    autoFocusOnDocumentChange = false,
    editable = true,
    onScroll,
    onChange,
    onSave,
    theme,
    settings,
    className = '',
  }: EditorProps) => {
    renderLogger.trace('CodeMirrorEditor');

    const [languageCompartment] = useState(new Compartment());
    const [envMaskingCompartment] = useState(new Compartment());
    const [searchCompartment] = useState(new Compartment());
    const [foldGutterCompartment] = useState(new Compartment());
    const searchLoadedRef = useRef(false);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const viewRef = useRef<EditorView | null>(null);
    const themeRef = useRef<Theme | null>(null);
    const docRef = useRef<EditorDocument | undefined>(undefined);
    const editorStatesRef = useRef<EditorStates | null>(null);
    const onScrollRef = useRef(onScroll);
    const onChangeRef = useRef(onChange);
    const onSaveRef = useRef(onSave);

    useEffect(() => {
      onScrollRef.current = onScroll;
      onChangeRef.current = onChange;
      onSaveRef.current = onSave;
      docRef.current = doc;
      setCurrentDocRef(doc);
      themeRef.current = theme;
    });

    useEffect(() => {
      if (!viewRef.current || !doc || doc.isBinary) {
        return;
      }

      scrollToPosition(viewRef.current, doc);
    }, [doc?.scroll?.line, doc?.scroll?.column, doc?.scroll?.top, doc?.scroll?.left]);

    useEffect(() => {
      const onUpdate = debounce((update: EditorUpdate) => {
        onChangeRef.current?.(update);
      }, debounceChange);

      const view = new EditorView({
        parent: containerRef.current!,
        dispatchTransactions(transactions) {
          const previousSelection = view.state.selection;

          view.update(transactions);

          const newSelection = view.state.selection;

          const selectionChanged =
            newSelection !== previousSelection &&
            (newSelection === undefined || previousSelection === undefined || !newSelection.eq(previousSelection));

          if (docRef.current && (transactions.some((transaction) => transaction.docChanged) || selectionChanged)) {
            onUpdate({
              selection: view.state.selection,
              content: view.state.doc.toString(),
            });

            editorStatesRef.current!.set(docRef.current.filePath, view.state);
          }
        },
      });

      viewRef.current = view;

      return () => {
        viewRef.current?.destroy();
        viewRef.current = null;
      };
    }, []);

    useEffect(() => {
      if (!viewRef.current) {
        return;
      }

      viewRef.current.dispatch({
        effects: [reconfigureTheme(theme)],
      });
    }, [theme]);

    useEffect(() => {
      editorStatesRef.current = new Map<string, EditorState>();
    }, [id]);

    useEffect(() => {
      const editorStates = editorStatesRef.current!;
      const view = viewRef.current!;
      const theme = themeRef.current!;

      if (!doc) {
        const state = newEditorState('', theme, settings, onScrollRef, debounceScroll, onSaveRef, loadSearchExtension, [
          languageCompartment.of([]),
          envMaskingCompartment.of([]),
          searchCompartment.of([]),
          foldGutterCompartment.of([]),
        ]);

        view.setState(state);

        setNoDocument(view);

        return;
      }

      if (doc.isBinary) {
        return;
      }

      if (doc.filePath === '') {
        logger.warn('File path should not be empty');
      }

      let state = editorStates.get(doc.filePath);

      if (!state) {
        const lineCount = doc.value.split('\n').length;
        const shouldLoadFoldGutter = lineCount > 100;

        state = newEditorState(
          doc.value,
          theme,
          settings,
          onScrollRef,
          debounceScroll,
          onSaveRef,
          loadSearchExtension,
          [
            languageCompartment.of([]),
            envMaskingCompartment.of([createEnvMaskingExtension(() => docRef.current?.filePath)]),
            searchCompartment.of([]),
            foldGutterCompartment.of(
              shouldLoadFoldGutter
                ? [
                    foldGutter({
                      markerDOM: (open) => {
                        const icon = document.createElement('div');
                        icon.className = `fold-icon ${open ? 'i-ph-caret-down-bold' : 'i-ph-caret-right-bold'}`;

                        return icon;
                      },
                    }),
                  ]
                : [],
            ),
          ],
          doc.filePath,
        );

        editorStates.set(doc.filePath, state);
      }

      view.setState(state);

      setEditorDocument(
        view,
        theme,
        editable,
        languageCompartment,
        autoFocusOnDocumentChange,
        doc as TextEditorDocument,
      );

      // Check if the file is locked and update the editor state accordingly
      const currentChatId = getCurrentChatId();
      const { locked } = isFileLocked(doc.filePath, currentChatId);

      if (locked) {
        view.dispatch({
          effects: [editableStateEffect.of(false)],
        });
      }
    }, [doc?.value, editable, doc?.filePath, autoFocusOnDocumentChange]);

    // Function to lazy-load search extension
    const loadSearchExtension = async (view: EditorView) => {
      if (searchLoadedRef.current) {
        return;
      }

      try {
        const { searchKeymap, search } = await import('@codemirror/search');
        view.dispatch({
          effects: searchCompartment.reconfigure([search(), keymap.of(searchKeymap)]),
        });
        searchLoadedRef.current = true;
      } catch (error) {
        logger.error('Failed to load search extension:', error);
      }
    };

    return (
      <div className={classNames('relative h-full rounded-md overflow-hidden', className)}>
        {doc?.isBinary && <BinaryContent />}
        <div className="h-full overflow-hidden" ref={containerRef} />
      </div>
    );
  },
);

export default CodeMirrorEditor;

CodeMirrorEditor.displayName = 'CodeMirrorEditor';
