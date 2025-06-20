// components/planner/PlannerContentEditor.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  CircularProgress,
  Fab,
  useTheme
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import dynamic from 'next/dynamic';

// Dynamically import the Lexical editor to avoid SSR issues
const RichTextEditor = dynamic(() => import('../lexical/RichTextEditor'), { 
  ssr: false,
  loading: () => <Box sx={{ 
    height: 400, 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center' 
  }}>
    <CircularProgress />
  </Box>
});

const PlannerContentEditor = ({ 
  content = {}, 
  onChange, 
  readOnly = false,
  onSave
}) => {
  const [editorContent, setEditorContent] = useState(content?.editorState || null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const theme = useTheme();

  // Update editor content when content prop changes
  useEffect(() => {
    if (content?.editorState) {
      setEditorContent(content.editorState);
    }
  }, [content]);
  
  // Handle content change from editor
  const handleEditorChange = useCallback((editorStateStr) => {
    setEditorContent(editorStateStr);
    setHasChanges(true);
    
    // Notify parent component of changes
    if (onChange) {
      onChange({ editorState: editorStateStr });
    }
  }, [onChange]);
  
  // Save handler
  const handleTriggerSave = useCallback(async () => {
    if (onSave && typeof onSave === 'function') {
      setIsSaving(true);
      
      try {
        await onSave({ editorState: editorContent });
        setHasChanges(false);
      } catch (error) {
        console.error('Error saving content:', error);
      } finally {
        setIsSaving(false);
      }
    }
  }, [onSave, editorContent]);
  
  // Add keyboard shortcut for saving (Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault(); // Prevent the browser save dialog
        if (!readOnly && hasChanges) {
          handleTriggerSave();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [readOnly, hasChanges, handleTriggerSave]);

  return (
    <Box sx={{ 
      position: 'relative',
      minHeight: '300px',
      mb: 6 
    }}>
      <Box sx={{
        borderRadius: 1,
        border: `1px solid ${theme.palette.divider}`,
        p: { xs: 1, sm: 2 },
        backgroundColor: theme.palette.background.paper,
        minHeight: '300px',
      }}>
        <RichTextEditor
          initialContent={editorContent}
          onChange={handleEditorChange}
          readOnly={readOnly}
        />
      </Box>

      {!readOnly && hasChanges && (
        <Fab
          color="primary"
          size="medium"
          onClick={handleTriggerSave}
          disabled={isSaving}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 2
          }}
        >
          {isSaving ? <CircularProgress size={24} /> : <SaveIcon />}
        </Fab>
      )}
    </Box>
  );
};

export default PlannerContentEditor;
