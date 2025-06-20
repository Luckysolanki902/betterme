// components/planner/PlannerContentEditor.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  CircularProgress,
  Fab,
  useTheme,
  Alert,
  Collapse,
  Tooltip,
  Typography,
  Chip,
  Paper,
  Snackbar,
  IconButton,
  Button
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import WarningIcon from '@mui/icons-material/Warning';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CloseIcon from '@mui/icons-material/Close';
import ReplayIcon from '@mui/icons-material/Replay';
import dynamic from 'next/dynamic';
import { processEditorContent, isLikelyEncrypted, createEmptyDocument, validateLexicalState, isValidJSON } from '@/utils/plannerUtils';
import { alpha } from '@mui/material/styles';
import { format } from 'date-fns';

// Try to load editors with multiple fallbacks - Using the new LexicalRichTextEditorNew first 
// which is the full-featured one with true rich text formatting (headings, bullets, etc.)
const RichTextEditor = dynamic(() => 
  import('../lexical/LexicalRichTextEditorNew')
  .catch((error) => {
    console.warn('Failed to load LexicalRichTextEditorNew, falling back to BasicLexicalEditor', error);
    return import('../lexical/BasicLexicalEditor')
    .catch((error) => {
      console.warn('Failed to load BasicLexicalEditor, falling back to ContentEditableEditor', error);
      return import('../lexical/ContentEditableEditor')
      .catch((error) => {
        console.warn('Failed to load ContentEditableEditor, falling back to RichTextEditor', error);
        return import('../lexical/RichTextEditor')
          .catch((error) => {
            console.warn('Failed to load RichTextEditor, falling back to BasicTextEditor', error);
            return import('../lexical/BasicTextEditor')
              .catch((error) => {
                console.error('All editor fallbacks failed', error);
                // Return a basic component that at least shows an error message
                return () => (
                  <Box sx={{ p: 2, border: '1px solid red', borderRadius: 1 }}>
                    <Typography color="error">
                      Editor failed to load. Please try refreshing the page.
                    </Typography>
                  </Box>
                );
              });
          });
      });
    });
  }), 
  { 
    ssr: false,
    loading: () => <Box sx={{ 
      height: 400, 
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
  }
);

const PlannerContentEditor = ({ 
  content = {}, 
  onChange, 
  readOnly = false,
  onSave
}) => {
  const [editorContent, setEditorContent] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showEncryptionAlert, setShowEncryptionAlert] = useState(false);
  const [editorLoadError, setEditorLoadError] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [wordCount, setWordCount] = useState(0);
  const [editorType, setEditorType] = useState('loading');
  const [saveStatus, setSaveStatus] = useState(null); // 'success', 'error', 'saving'
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [saveError, setSaveError] = useState(null);
  const theme = useTheme();
  const contentRef = useRef(content);
  const saveTimerRef = useRef(null);
  const lastSaveAttemptRef = useRef(null);
  const saveRetryTimeoutRef = useRef(null);
  const lastValidContentRef = useRef(null);
  const initialContentProcessed = useRef(false);
  // Process and update editor content when content prop changes
  useEffect(() => {
    contentRef.current = content;
    
    // Skip if we've already processed the initial content and there's no new content
    if (initialContentProcessed.current && !content) return;
    
    try {
      if (!content) {
        console.log('No content provided, creating empty document');
        setEditorContent(createEmptyDocument());
        setWordCount(0);
        initialContentProcessed.current = true;
        return;
      }
      
      console.log('Content received in editor:', 
        content?.editorState ? 
          (typeof content.editorState === 'string' ? 
            content.editorState.substring(0, 30) + '...' : 
            'non-string content') : 
          'no editor state');

      // Check if we're likely dealing with encrypted content
      let isEncrypted = false;      if (content.editorState && typeof content.editorState === 'string') {
        // First check if it's valid JSON
        let isValidJson = false;
        let isEncryptedContent = false;
        let parsedContent = null;
        
        try {
          parsedContent = JSON.parse(content.editorState);
          isValidJson = true;
          
          // Check if this is our special marker for encrypted content
          if (parsedContent.root && parsedContent.root.__encrypted === true) {
            isEncryptedContent = true;
            console.warn('Content marked as encrypted by processor');
          }
        } catch (e) {
          isValidJson = false;
        }

        // If it's not valid JSON, check if it's encrypted 
        if (!isValidJson) {
          isEncryptedContent = isLikelyEncrypted(content.editorState);
          if (isEncryptedContent) {
            console.warn('Encrypted editor state detected in PlannerContentEditor');
          }
        }
        
        setShowEncryptionAlert(isEncryptedContent);
      }
      
      // Process the content to ensure it's in the correct format
      const processedContent = processEditorContent(content);
        // Validate the processed content is a valid Lexical state
      let isValidContent = false;
      try {
        isValidContent = isValidJSON(processedContent) && validateLexicalState(processedContent);
      } catch (e) {
        console.warn('Invalid editor state after processing:', e);
        isValidContent = false;
      }
      
      // Set the editor content if valid, otherwise use last valid content or empty document
      if (isValidContent) {
        console.log('Setting valid editor content');
        setEditorContent(processedContent);
        lastValidContentRef.current = processedContent;
        
        // If we're setting valid content, also clear any encryption alert
        if (!showEncryptionAlert) {
          setShowEncryptionAlert(false);
        }
      } else if (lastValidContentRef.current) {
        console.warn('Using last valid content instead of invalid state');
        setEditorContent(lastValidContentRef.current);
      } else {
        const emptyDoc = createEmptyDocument();
        console.warn('Using empty document due to invalid content');
        setEditorContent(emptyDoc);
        lastValidContentRef.current = emptyDoc; // Store the empty doc as the last valid content
      }
      
      // Try to calculate word count from processed content
      try {
        if (processedContent && isValidJSON(processedContent)) {
          const contentObj = JSON.parse(processedContent);
          let plainText = '';
          
          // Extract text from Lexical JSON structure
          if (contentObj.root && Array.isArray(contentObj.root.children)) {
            plainText = contentObj.root.children
              .map(node => {
                if (node.children) {
                  return node.children
                    .map(child => child.text || '')
                    .join(' ');
                }
                return '';
              })
              .join(' ');
          }
          
          // Count words (split by whitespace and filter out empty strings)
          const count = plainText.split(/\s+/).filter(Boolean).length;
          setWordCount(count);
        } else {
          setWordCount(0);
        }
      } catch (countError) {
        console.warn('Error calculating word count:', countError);
        setWordCount(0);
      }
      
      // Mark that we've processed the initial content
      initialContentProcessed.current = true;
    } catch (error) {
      console.error('Error processing editor content:', error);
      
      // Try to use last valid content if available
      if (lastValidContentRef.current) {
        setEditorContent(lastValidContentRef.current);
      } else {
        setEditorContent(createEmptyDocument());
      }
      
      setWordCount(0);
      setEditorLoadError('Failed to process editor content');
      initialContentProcessed.current = true;
    }
  }, [content]);
  
  // Handle content change from editor
  const handleEditorChange = useCallback((editorStateStr) => {
    // Make sure we got a valid editor state
    if (!editorStateStr) {
      console.warn('Received empty editor state from editor component');
      return;
    }
    
    // Validate it's proper JSON before setting it
    try {
      if (!isValidJSON(editorStateStr)) {
        console.warn('Received invalid JSON from editor component');
        return;
      }
      
      // Store this as the last valid content
      lastValidContentRef.current = editorStateStr;
    } catch (e) {
      console.warn('Error validating editor state:', e);
      return;
    }
    
    setEditorContent(editorStateStr);
    setHasChanges(true);
    
    // Update word count when content changes
    try {
      if (editorStateStr) {
        const contentObj = JSON.parse(editorStateStr);
        let plainText = '';
        
        // Extract text from Lexical JSON structure
        if (contentObj.root && Array.isArray(contentObj.root.children)) {
          plainText = contentObj.root.children
            .map(node => {
              if (node.children) {
                return node.children
                  .map(child => child.text || '')
                  .join(' ');
              }
              return '';
            })
            .join(' ');
        }
        
        // Count words
        const count = plainText.split(/\s+/).filter(Boolean).length;
        setWordCount(count);
      } else {
        setWordCount(0);
      }
    } catch (error) {
      console.warn('Error calculating word count on change:', error);
    }
    
    // Notify parent component of changes
    if (onChange) {
      onChange({ editorState: editorStateStr });
    }
    
    // Set up auto-save if enabled
    if (autoSaveEnabled) {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(() => {
        handleTriggerSave();
      }, 3000); // Auto-save after 3 seconds of inactivity
    }
  }, [onChange, autoSaveEnabled]);
    // Save handler
  const handleTriggerSave = useCallback(async () => {
    if (onSave && typeof onSave === 'function' && hasChanges) {
      setIsSaving(true);
      setSaveStatus('saving');
      lastSaveAttemptRef.current = Date.now();
      
      try {
        // Make sure we have a valid editor state
        if (!editorContent || !isValidJSON(editorContent)) {
          throw new Error('Cannot save invalid editor state');
        }
        
        // Attempt to validate the state before saving
        try {
          validateLexicalState(editorContent);
          
          // Check if content is marked as encrypted
          const parsedContent = JSON.parse(editorContent);
          if (parsedContent.root && parsedContent.root.__encrypted === true) {
            console.warn('Attempting to save content marked as encrypted, creating new document');
            const emptyDoc = createEmptyDocument();
            await onSave({ editorState: emptyDoc });
            setEditorContent(emptyDoc);
            lastValidContentRef.current = emptyDoc;
            throw new Error('Cannot save encrypted content, created new document');
          }
        } catch (validationError) {
          console.warn('Validation error before saving:', validationError);
          // Fall back to the last valid content if available
          if (lastValidContentRef.current) {
            console.log('Using last valid content for save');
            await onSave({ editorState: lastValidContentRef.current });
          } else {
            const emptyDoc = createEmptyDocument();
            await onSave({ editorState: emptyDoc });
            setEditorContent(emptyDoc);
            lastValidContentRef.current = emptyDoc;
            throw new Error('No valid editor state available, created new document');
          }
        }
        
        // Hide encryption alert if we're saving valid content
        setShowEncryptionAlert(false);
        
        await onSave({ editorState: editorContent });
        setHasChanges(false);
        setSaveStatus('success');
        setLastSaved(new Date());
        setSaveError(null);
        
        // Show success status for 3 seconds, then hide
        setTimeout(() => {
          if (Date.now() - lastSaveAttemptRef.current >= 2900) {
            setSaveStatus(null);
          }
        }, 3000);
      } catch (error) {
        console.error('Error saving content:', error);
        setSaveStatus('error');
        setSaveError(`Failed to save: ${error.message || 'Unknown error'}`);
        
        // Set up retry auto-save after 30 seconds if auto-save is enabled
        if (autoSaveEnabled) {
          if (saveRetryTimeoutRef.current) {
            clearTimeout(saveRetryTimeoutRef.current);
          }
          saveRetryTimeoutRef.current = setTimeout(() => {
            if (hasChanges) handleTriggerSave();
          }, 30000);
        }
      } finally {
        setIsSaving(false);
      }
    }
  }, [onSave, editorContent, hasChanges, autoSaveEnabled]);
  
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
  
  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      if (saveRetryTimeoutRef.current) {
        clearTimeout(saveRetryTimeoutRef.current);
      }
    };
  }, []);
  // Handle refresh editor action - reset to a clean state
  const handleRefreshEditor = useCallback(() => {
    // Reset to a new empty document
    const emptyDoc = createEmptyDocument();
    setEditorContent(emptyDoc);
    setShowEncryptionAlert(false);
    setEditorLoadError(null);
    setWordCount(0);
    
    // Mark that we have changes so it can be saved
    setHasChanges(true);
    
    // Store this as the last valid content
    lastValidContentRef.current = emptyDoc;
    
    // Set up auto-save if enabled
    if (autoSaveEnabled) {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(() => {
        handleTriggerSave();
      }, 1000); // Auto-save quickly to overwrite the encrypted content
    }
  }, [autoSaveEnabled]);

  // Get save status indicator
  const getSaveStatusIndicator = () => {
    if (saveStatus === 'success') {
      return <CloudDoneIcon fontSize="small" sx={{ color: 'success.main' }} />;
    } else if (saveStatus === 'error') {
      return <CloudOffIcon fontSize="small" sx={{ color: 'error.main' }} />;
    } else if (saveStatus === 'saving') {
      return <AutorenewIcon fontSize="small" sx={{ color: 'info.main', animation: 'spin 1.5s linear infinite' }} />;
    }
    return null;
  };

  return (
    <Box sx={{ 
      position: 'relative',
      minHeight: '300px',
      mb: 6 
    }}>      <Collapse in={showEncryptionAlert}>
        <Alert 
          severity="warning" 
          sx={{ mb: 2 }}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                color="primary" 
                size="small" 
                variant="contained"
                startIcon={<ReplayIcon />} 
                onClick={handleRefreshEditor}
              >
                Reset Editor
              </Button>
              <Button
                color="inherit"
                size="small"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </Box>
          }
        >
          <Typography variant="subtitle2" gutterBottom>
            Content appears to be encrypted
          </Typography>
          <Typography variant="body2">
            There was an issue decrypting your content. <strong>Click "Reset Editor"</strong> to create a new document 
            (this will overwrite the encrypted content) or refresh the page to try again.
          </Typography>
        </Alert>
      </Collapse>
      
      {editorLoadError && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }} 
          onClose={() => setEditorLoadError(null)}
          action={
            <Button 
              color="inherit" 
              size="small" 
              startIcon={<ReplayIcon />} 
              onClick={handleRefreshEditor}
            >
              Reset Editor
            </Button>
          }
        >
          {editorLoadError}
        </Alert>
      )}
        <Box sx={{
        borderRadius: 1,
        border: `1px solid ${theme.palette.divider}`,
        p: { xs: 1, sm: 2 },
        backgroundColor: theme.palette.background.paper,
        minHeight: '300px',
        position: 'relative',
      }}>
        {editorContent ? (
          <RichTextEditor
            key={`editor-${editorContent ? 'loaded' : 'empty'}`}
            initialState={editorContent}
            onChange={handleEditorChange}
            readOnly={readOnly === true}
            height="400px"
            placeholder="Start writing your plan here..."
            showToolbar={true}
            autoFocus={!readOnly}
          />
        ) : (
          <Box sx={{ 
            height: 400, 
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
        )}
      </Box>

      {/* Status Bar */}
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 1,
          mt: 1,
          borderRadius: 1,
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          borderTop: `1px solid ${theme.palette.divider}`,
          fontSize: '0.875rem',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={`${wordCount} words`}
            size="small"
            variant="outlined"
            sx={{
              height: 24,
              fontSize: '0.75rem',
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              borderColor: alpha(theme.palette.primary.main, 0.3),
            }}
          />
          
          {lastSaved && !hasChanges && (
            <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CloudDoneIcon fontSize="inherit" sx={{ color: 'success.main' }} />
              Saved at {format(lastSaved, 'HH:mm:ss')}
            </Typography>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {saveStatus && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {getSaveStatusIndicator()}
              <Typography variant="caption" color={
                saveStatus === 'success' ? 'success.main' : 
                saveStatus === 'error' ? 'error.main' : 
                'info.main'
              }>
                {saveStatus === 'success' && 'Saved'}
                {saveStatus === 'error' && 'Save failed'}
                {saveStatus === 'saving' && 'Saving...'}
              </Typography>
            </Box>
          )}
          
          {!readOnly && autoSaveEnabled && (
            <Tooltip title="Auto-save enabled">
              <Chip
                label="Auto-save"
                size="small"
                color="secondary"
                variant="outlined"
                sx={{ height: 24, fontSize: '0.75rem' }}
                onClick={() => setAutoSaveEnabled(false)}
              />
            </Tooltip>
          )}
          
          {!readOnly && !autoSaveEnabled && (
            <Tooltip title="Auto-save disabled">
              <Chip
                label="Auto-save off"
                size="small"
                color="default"
                variant="outlined"
                sx={{ height: 24, fontSize: '0.75rem' }}
                onClick={() => setAutoSaveEnabled(true)}
              />
            </Tooltip>
          )}
        </Box>
      </Paper>

      {/* Save button for manual save */}
      {!readOnly && hasChanges && !autoSaveEnabled && (
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
          {isSaving ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
        </Fab>
      )}
      
      {/* Error Snackbar */}
      <Snackbar
        open={saveStatus === 'error' && Boolean(saveError)}
        autoHideDuration={6000}
        onClose={() => setSaveError(null)}
        message={saveError}
        action={
          <IconButton
            size="small"
            color="inherit"
            onClick={() => setSaveError(null)}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
      
      {/* Custom animation for rotating icon */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
};

export default PlannerContentEditor;
