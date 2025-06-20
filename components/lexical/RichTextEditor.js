import React, { useState, useEffect } from 'react';

// A simplified editor with NO dependencies on Lexical
// This version is a direct replacement for RichTextEditor with the same prop interface
const RichTextEditor = ({
  onChange,
  initialState,
  placeholder = 'Start writing...',
  readOnly = false,
  height = 'auto',
  autoFocus = true,
  showToolbar = true,
}) => {
  const [text, setText] = useState('');
  const actualHeight = height === 'auto' ? '300px' : height;
  
  // Initialize with content from initialState if available
  useEffect(() => {
    if (!initialState) {
      setText('');
      return;
    }
    
    try {
      // Check if we're dealing with encrypted content
      if (typeof initialState === 'string') {
        // If it's likely encrypted (base64-like string with no JSON structure)
        if ((!initialState.startsWith('{') && !initialState.startsWith('[')) || 
            initialState.match(/^[A-Za-z0-9+/=]+$/)) {
          console.warn('Encrypted or invalid JSON content detected - please decrypt this content first');
          setText('*** This content appears to be encrypted. Please check API decryption. ***');
          return;
        }
        
        // It's valid JSON format, try to parse it
        try {
          const parsed = JSON.parse(initialState);
          
          // Parse the JSON structure to extract text content
          let extractedText = '';
          
          // Handle different possible JSON structures
          if (parsed && typeof parsed === 'object') {
            // Handle root-level structure for Lexical format
            if (parsed.root && Array.isArray(parsed.root.children)) {
              extractedText = parsed.root.children
                .map(node => {
                  if (node.children) {
                    return node.children
                      .map(child => child.text || '')
                      .join('');
                  }
                  return '';
                })
                .filter(Boolean)
                .join('\n\n');
            }
            // Handle editor state object with nested root
            else if (parsed.editorState) {
              try {
                const editorState = typeof parsed.editorState === 'string' 
                  ? JSON.parse(parsed.editorState)
                  : parsed.editorState;
                
                if (editorState.root && Array.isArray(editorState.root.children)) {
                  extractedText = editorState.root.children
                    .map(node => {
                      if (node.children) {
                        return node.children
                          .map(child => child.text || '')
                          .join('');
                      }
                      return '';
                    })
                    .filter(Boolean)
                    .join('\n\n');
                }
              } catch (e) {
                console.error('Failed to parse editorState:', e);
              }
            }
            // Handle direct children array
            else if (Array.isArray(parsed.children)) {
              extractedText = parsed.children
                .map(node => {
                  if (node.children) {
                    return node.children
                      .map(child => child.text || '')
                      .join('');
                  }
                  return '';
                })
                .filter(Boolean)
                .join('\n\n');
            }
          }
          
          setText(extractedText || '');
        } catch (e) {
          // If parsing fails, use the original content
          console.error('Failed to parse initial state:', e);
          // If it's a string, just display it as is
          setText(typeof initialState === 'string' ? initialState : '');
        }
      }
    } catch (e) {
      console.error('Error processing initialState:', e);
      setText('');
    }
  }, [initialState]);

  // Auto focus the editor when mounted if autoFocus is true
  useEffect(() => {
    if (autoFocus && !readOnly) {
      const textarea = document.getElementById('richtext-editor-textarea');
      if (textarea) {
        textarea.focus();
      }
    }
  }, [autoFocus, readOnly]);

  // Handle text changes and provide compatible JSON structure
  const handleChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    
    if (onChange) {
      // Create a Lexical-compatible JSON structure
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
    <div style={{ 
      position: 'relative',
      borderRadius: '8px',
      minHeight: actualHeight,
      fontFamily: 'inherit',
      lineHeight: '1.5',
      transition: 'all 0.2s ease'
    }}>
      {showToolbar && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          borderBottom: '1px solid #eee',
          background: readOnly ? '#f9f9f9' : '#e6f7ff',
          borderRadius: '8px 8px 0 0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ 
              fontSize: '14px', 
              color: readOnly ? '#666' : '#1976d2',
              fontWeight: readOnly ? 'normal' : '500' 
            }}>
              {readOnly ? 'Read-only mode' : 'Edit mode'} - Simple text editor
            </span>
          </div>
          
          {!readOnly && (
            <small style={{ color: '#666' }}>
              Press Enter twice for new paragraph
            </small>
          )}
        </div>
      )}
      
      <div style={{
        position: 'relative',
        border: `1px solid ${readOnly ? '#ddd' : '#1976d2'}`,
        borderRadius: showToolbar ? '0 0 8px 8px' : '8px',
        padding: '16px',
        minHeight: '250px',
        backgroundColor: readOnly ? '#fafafa' : '#fff'
      }}>
        <textarea
          id="richtext-editor-textarea"
          value={text}
          onChange={handleChange}
          placeholder={placeholder}
          readOnly={readOnly}
          style={{
            width: '100%',
            minHeight: actualHeight,
            padding: '0',
            margin: '0',
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
      </div>
    </div>
  );
};

// Export the component
export default RichTextEditor;
