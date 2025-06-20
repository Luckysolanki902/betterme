import React, { useEffect, useState } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/history';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $createParagraphNode } from 'lexical';
import styles from './editor.module.css';

// A simple editor component that only includes the bare minimum functionality
const SimpleEditor = ({
  onChange,
  initialState,
  placeholder = 'Start writing...',
  readOnly = false,
}) => {
  const [editorState, setEditorState] = useState(null);

  const initialConfig = {
    namespace: 'SimpleEditor',
    theme: {
      paragraph: 'editor-paragraph',
      text: {
        bold: 'editor-text-bold',
        italic: 'editor-text-italic',
        underline: 'editor-text-underline',
      },
    },
    onError: (error) => {
      console.error('Editor error:', error);
    },
    editable: !readOnly,
    nodes: [],
  };

  const handleEditorChange = (editorState) => {
    setEditorState(editorState);
    if (onChange) {
      editorState.read(() => {
        const root = $getRoot();
        const jsonString = JSON.stringify(root.exportJSON());
        onChange(jsonString);
      });
    }
  };

  return (
    <div className={styles['editor-container']}>
      <LexicalComposer initialConfig={initialConfig}>
        <div className={styles['editor-inner']}>
          <div className={styles['editor-input']}>
            <ContentEditable
              className={styles['content-editable']}
              readOnly={readOnly}
            />
          </div>
          
          {placeholder && !readOnly && (
            <div className={styles['editor-placeholder']}>{placeholder}</div>
          )}
          
          <OnChangePlugin onChange={handleEditorChange} />
          <HistoryPlugin />
          
          {initialState && <InitialStatePlugin initialState={initialState} />}
        </div>
      </LexicalComposer>
    </div>
  );
};

// Plugin to set initial state
const InitialStatePlugin = ({ initialState }) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (initialState) {
      try {
        const parsedState = JSON.parse(initialState);
        editor.update(() => {
          const root = $getRoot();
          root.clear();
          root.importJSON(parsedState);
        });
      } catch (error) {
        console.error('Failed to parse initial editor state', error);
        
        // If parsing fails, create a default paragraph
        editor.update(() => {
          const root = $getRoot();
          root.clear();
          const paragraph = $createParagraphNode();
          root.append(paragraph);
        });
      }
    }
  }, [editor, initialState]);

  return null;
};

export default SimpleEditor;
