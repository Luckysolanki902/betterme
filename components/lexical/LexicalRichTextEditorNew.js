import React, { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress, Alert, Typography } from '@mui/material';

// Lexical imports
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';

// Import custom toolbar plugin
import ToolbarPluginNew from './plugins/ToolbarPluginNew';

// Helper to create an empty editor state to avoid issues
const getEmptyEditorState = () => {
  return JSON.stringify({
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text: "",
              type: "text",
              version: 1
            }
          ],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1
        }
      ],
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1
    }
  });
}

// Check if data is likely encrypted
const isLikelyEncrypted = (str) => {
  if (typeof str !== 'string') return false;
  return !str.startsWith('{') && 
         str.match(/^[A-Za-z0-9+/=]+$/) && 
         str.length > 20;
}

// Main component
const LexicalRichTextEditorNew = ({
  onChange,
  initialState,
  placeholder = 'Start writing...',
  readOnly = false,
  height = 'auto',
  autoFocus = true,
  showToolbar = true
}) => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [validatedState, setValidatedState] = useState(null);
  const actualHeight = height === 'auto' ? '300px' : height;
  const hasAttemptedRepair = useRef(false);

  // Prepare the editor configuration
  const editorConfig = {
    namespace: 'MyLexicalEditor',
    theme: {
      paragraph: 'editor-paragraph',
      heading: {
        h1: 'editor-heading-h1',
        h2: 'editor-heading-h2',
        h3: 'editor-heading-h3',
      },
      list: {
        ul: 'editor-list-ul',
        ol: 'editor-list-ol',
        listitem: 'editor-listitem',
      },
      // Add other theme items as needed
    },
    onError: (error) => {
      console.error('Lexical error:', error);
      setError(error.message || "An error occurred in the editor");
    },
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      CodeHighlightNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      AutoLinkNode,
      LinkNode
    ],
    // Set editorState here, depending on whether we have a valid initialState
    editorState: validatedState,
    // Set read-only based on props
    editable: !readOnly,
  };

  // Process and validate initialState
  useEffect(() => {
    try {
      setIsLoading(true);
      setError(null);
      hasAttemptedRepair.current = false;

      // Early return if no initial state
      if (!initialState) {
        setValidatedState(() => getEmptyEditorState());
        setIsLoading(false);
        return;
      }

      // Handle different types of input
      if (typeof initialState === 'string') {
        // Check if it's encrypted
        if (isLikelyEncrypted(initialState)) {
          console.warn('Encrypted content detected, using empty document');
          setError('Content appears to be encrypted and cannot be displayed in the editor.');
          setValidatedState(() => getEmptyEditorState());
          setIsLoading(false);
          return;
        }

        try {
          // Try to parse the JSON to validate it
          const parsed = JSON.parse(initialState);
          
          // Additional validation to ensure it's a valid Lexical state
          if (!parsed.root) {
            throw new Error('Invalid Lexical state: missing root node');
          }
          
          // If it parsed without errors, use it directly
          setValidatedState(() => initialState);
        } catch (e) {
          console.error('Failed to parse initialState JSON:', e);
          
          // If this is our first attempt to repair, try to fix it
          if (!hasAttemptedRepair.current) {
            hasAttemptedRepair.current = true;
            console.log('Attempting to repair the editor state...');
            setValidatedState(() => getEmptyEditorState());
          } else {
            setError('Failed to parse editor content. Using empty document.');
            setValidatedState(() => getEmptyEditorState());
          }
        }
      } else if (typeof initialState === 'object') {
        // If it's an object, stringify it properly
        try {
          const stateStr = JSON.stringify(initialState);
          setValidatedState(() => stateStr);
        } catch (e) {
          console.error('Error stringifying object state:', e);
          setError('Failed to process editor state. Using empty document.');
          setValidatedState(() => getEmptyEditorState());
        }
      } else {
        // For any other type, use empty document
        setError('Unsupported editor state format. Using empty document.');
        setValidatedState(() => getEmptyEditorState());
      }
    } catch (err) {
      console.error('Error in editor state initialization:', err);
      setError('An unexpected error occurred. Using empty document.');
      setValidatedState(() => getEmptyEditorState());
    } finally {
      setIsLoading(false);
    }
  }, [initialState]);

  // Handle editor changes
  const handleEditorChange = (editorState) => {
    if (onChange) {
      editorState.read(() => {
        // Serialize the editor state to a string
        const json = editorState.toJSON();
        onChange(JSON.stringify(json));
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ 
        height: actualHeight, 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <CircularProgress size={40} />
        <Typography sx={{ mt: 2, color: 'text.secondary' }}>
          Loading editor...
        </Typography>
      </Box>
    );
  }

  // If we don't have valid state, can't render the editor
  if (!validatedState) {
    return (
      <Box sx={{ padding: 2, border: '1px solid red', borderRadius: 1 }}>
        <Typography color="error">
          Editor could not be initialized. Please try refreshing the page.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Display any errors as alerts */}
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Render the editor only when we have valid state */}
      <Box sx={{ 
        border: '1px solid #ddd',
        borderRadius: showToolbar ? '0 0 8px 8px' : '8px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <LexicalComposer initialConfig={editorConfig}>
          {showToolbar && !readOnly && <ToolbarPluginNew />}

          <Box sx={{ 
            position: 'relative',
            minHeight: actualHeight,
            maxHeight: actualHeight === 'auto' ? 'none' : '70vh',
            overflow: 'auto', 
            padding: '16px'
          }}>
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  style={{
                    height: '100%',
                    outline: 'none',
                    caretColor: readOnly ? 'transparent' : 'inherit'
                  }}
                  className="editor-content-editable"
                />
              }
              placeholder={
                <div className="editor-placeholder">
                  {placeholder}
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <LinkPlugin />
            <ListPlugin />
            {autoFocus && !readOnly && <AutoFocusPlugin />}
            <OnChangePlugin onChange={handleEditorChange} />
          </Box>
        </LexicalComposer>

        <style jsx global>{`
          .editor-placeholder {
            color: #999;
            position: absolute;
            top: 16px;
            left: 16px;
            user-select: none;
            pointer-events: none;
          }
          
          .editor-paragraph {
            margin: 0 0 15px 0;
            position: relative;
          }
          
          .editor-heading-h1 {
            font-size: 24px;
            font-weight: bold;
            margin: 10px 0;
          }
          
          .editor-heading-h2 {
            font-size: 20px;
            font-weight: bold;
            margin: 8px 0;
          }
          
          .editor-heading-h3 {
            font-size: 16px;
            font-weight: bold;
            margin: 6px 0;
          }
          
          .editor-list-ul, .editor-list-ol {
            padding: 0;
            margin: 0 0 0 20px;
          }
          
          .editor-listitem {
            margin: 4px 0;
          }
          
          .editor-content-editable:focus {
            outline: none;
          }
        `}</style>
      </Box>
    </Box>
  );
};

export default LexicalRichTextEditorNew;
