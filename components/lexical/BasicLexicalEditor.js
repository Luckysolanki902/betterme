// components/lexical/BasicLexicalEditor.js
import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Alert, Button } from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';

// Import minimal set of Lexical dependencies
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $createParagraphNode, $createTextNode, $getSelection, FORMAT_TEXT_COMMAND } from 'lexical';

// Very simple toolbar with minimal functionality to avoid errors
function SimpleToolbar() {
  const [editor] = useLexicalComposerContext();
  
  const formatBold = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
  };
  
  const formatItalic = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
  };
  
  const formatUnderline = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
  };
  
  return (
    <Box sx={{ 
      display: 'flex', 
      gap: 1, 
      p: 1, 
      bgcolor: '#f5f5f5', 
      borderBottom: '1px solid #e0e0e0' 
    }}>
      <Button 
        variant="outlined" 
        size="small" 
        onClick={formatBold} 
        startIcon={<FormatBoldIcon />}
      >
        Bold
      </Button>
      <Button 
        variant="outlined" 
        size="small" 
        onClick={formatItalic} 
        startIcon={<FormatItalicIcon />}
      >
        Italic
      </Button>
      <Button 
        variant="outlined" 
        size="small" 
        onClick={formatUnderline} 
        startIcon={<FormatUnderlinedIcon />}
      >
        Underline
      </Button>
    </Box>
  );
}

// Main editor component
const BasicLexicalEditor = ({
  onChange,
  initialState,
  placeholder = 'Start writing...',
  readOnly = false,
  height = 'auto',
  autoFocus = true,
  showToolbar = true
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const actualHeight = height === 'auto' ? '300px' : height;

  // Minimal editor config
  const editorConfig = {
    namespace: 'BasicEditor',
    theme: {
      text: {
        bold: 'font-bold',
        italic: 'italic',
        underline: 'underline',
      }
    },
    onError(error) {
      console.error('Editor error:', error);
    },
  };

  // Handler for editor changes
  const handleEditorChange = (editorState) => {
    if (!onChange) return;

    editorState.read(() => {
      const root = $getRoot();
      const textContent = root.getTextContent();
      
      // Create a simple JSON structure for storage
      const simpleJson = {
        text: textContent,
        format: 'plain'
      };
      
      onChange(JSON.stringify(simpleJson));
    });
  };

  // CSS styles
  const editorStyles = `
    .editor-container {
      border: 1px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .editor-inner {
      position: relative;
      min-height: ${actualHeight};
    }
    
    .editor-input {
      padding: 16px;
      min-height: ${actualHeight};
      outline: none;
      font-family: inherit;
      font-size: 16px;
      line-height: 1.5;
    }
    
    .editor-placeholder {
      color: #999;
      position: absolute;
      top: 16px;
      left: 16px;
      pointer-events: none;
    }
    
    .font-bold {
      font-weight: bold;
    }
    
    .italic {
      font-style: italic;
    }
    
    .underline {
      text-decoration: underline;
    }
  `;

  // Handle loading state
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Show loading spinner
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  // Show error if any
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  // Placeholder component
  const Placeholder = () => {
    return <div className="editor-placeholder">{placeholder}</div>;
  };

  return (
    <Box>
      <style>{editorStyles}</style>
      
      <LexicalComposer initialConfig={editorConfig}>
        <div className="editor-container">
          {showToolbar && !readOnly && <SimpleToolbar />}
          
          <div className="editor-inner">
            <PlainTextPlugin
              contentEditable={<ContentEditable className="editor-input" />}
              placeholder={<Placeholder />}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <OnChangePlugin onChange={handleEditorChange} />
            <HistoryPlugin />
          </div>
        </div>
      </LexicalComposer>
    </Box>
  );
};

export default BasicLexicalEditor;
