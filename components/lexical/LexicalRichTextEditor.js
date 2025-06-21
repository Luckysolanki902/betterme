import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';

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
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';

// Import custom toolbar plugin
import ToolbarPlugin from './plugins/ToolbarPlugin';

// Main component
const LexicalRichTextEditor = ({
  onChange,
  initialState,
  placeholder = 'Start writing...',
  readOnly = false,
  height = 'auto',
  autoFocus = true,
  showToolbar = true
}) => {
  const [editorState, setEditorState] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const actualHeight = height === 'auto' ? '300px' : height;
  // Initialize editor state from props
  useEffect(() => {
    try {
      if (!initialState) {
        setEditorState(null);
        setIsLoading(false);
        return;
      }

      // Parse JSON if it's a string
      if (typeof initialState === 'string') {
        // Check if it's encrypted
        if (!initialState.startsWith('{') && initialState.match(/^[A-Za-z0-9+/=]+$/)) {
          console.warn('Encrypted content detected - cannot load into editor');
          setError('Content appears to be encrypted. Contact administrator.');
          setIsLoading(false);
          return;
        }
        
        // Try to parse JSON
        try {
          const parsed = JSON.parse(initialState);
          setEditorState(parsed);
        } catch (e) {
          console.error('Failed to parse initialState JSON:', e);
          setError('Failed to parse editor content');
        }
      } else if (typeof initialState === 'object') {
        // If it's already an object, use it directly
        setEditorState(initialState);
      }
    } catch (err) {
      console.error('Error initializing editor state:', err);
      setError('Failed to load editor content');
    } finally {
      setIsLoading(false);
    }
  }, [initialState]);
    

  // Handle text changes and provide Lexical JSON structure
  const handleChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    
    if (onChange) {
      // Create a simple Lexical-compatible JSON structure
      const paragraphs = newText.split('\n\n').filter(line => line.trim());
      
      const jsonStructure = {
        root: {
          children: paragraphs.map(paragraph => ({
            children: [{ 
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: paragraph,
              type: 'text',
              version: 1
            }],
            direction: null,
            format: '',
            indent: 0,
            type: 'paragraph',
            version: 1
          })),
          direction: null,
          format: '',
          indent: 0,
          type: 'root',
          version: 1
        }
      };
      
      onChange(JSON.stringify(jsonStructure));
    }
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Box 
        sx={{
          position: 'relative',
          border: '1px solid #ddd',
          borderRadius: showToolbar ? '0 0 8px 8px' : '8px',
          overflow: 'hidden'
        }}
      >
        {showToolbar && (
          <Box 
            sx={{
              display: 'flex',
              padding: 1,
              backgroundColor: readOnly ? '#f5f5f5' : '#e3f2fd',
              borderBottom: '1px solid #ddd',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Typography 
              variant="caption" 
              sx={{
                fontWeight: readOnly ? 'normal' : 'bold',
                color: readOnly ? 'text.secondary' : 'primary.main'
              }}
            >
              {readOnly ? 'Read-only Mode' : 'Editing Mode'}
            </Typography>
            
            <Typography variant="caption" color="text.secondary">
              Enhanced Text Editor
            </Typography>
          </Box>
        )}
        
        <Box 
          sx={{
            position: 'relative',
            minHeight: actualHeight,
            backgroundColor: '#fff'
          }}
        >
          {readOnly && htmlContent ? (
            <Box 
              sx={{ 
                padding: 2,
                minHeight: actualHeight,
                '& p': { mt: 0, mb: 2 },
                '& h1': { fontSize: '1.8rem', fontWeight: 'bold', mb: 2, mt: 1 },
                '& h2': { fontSize: '1.5rem', fontWeight: 'bold', mb: 1.5, mt: 1 },
                '& h3': { fontSize: '1.2rem', fontWeight: 'bold', mb: 1, mt: 1 },
                '& ul, & ol': { ml: 3, mb: 2 },
                '& li': { mb: 0.5 }
              }}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          ) : (
            <textarea
              ref={editorRef}
              value={text}
              onChange={handleChange}
              placeholder={placeholder}
              readOnly={readOnly}
              autoFocus={autoFocus && !readOnly}
              style={{
                width: '100%',
                minHeight: actualHeight,
                padding: '16px',
                fontSize: '16px',
                lineHeight: '1.5',
                border: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                outline: 'none',
                background: 'transparent',
                cursor: readOnly ? 'default' : 'text'
              }}
            />
          )}
        </Box>
      </Box>
      
      {!readOnly && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            mt: 1
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Tip: Use Shift+Enter for a new line, Enter twice for a new paragraph
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default LexicalRichTextEditor;
