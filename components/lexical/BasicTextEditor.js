import React, { useState, useEffect } from 'react';
import styles from './editor.module.css';

// A super basic editor that uses a textarea instead of Lexical
// Only use this as a last resort when all other editors fail
const BasicTextEditor = ({
  onChange,
  initialState,
  placeholder = 'Start writing...',
  readOnly = false,
  height = 'auto',
}) => {
  const [content, setContent] = useState('');
    // Parse initial state from Lexical JSON format
  useEffect(() => {
    if (initialState) {
      try {
        // Check if the initialState appears to be JSON
        if (!initialState.startsWith('{') && !initialState.startsWith('[')) {
          // This is not JSON, might be an encrypted string
          console.log('Non-JSON content detected in BasicTextEditor');
          setContent(initialState);
          return;
        }
        
        const parsedState = JSON.parse(initialState);
        
        // Extract text content from Lexical JSON if possible
        if (parsedState.children) {
          const textContent = parsedState.children
            .map(node => {
              if (node.type === 'paragraph') {
                return (node.children || [])
                  .map(child => child.text || '')
                  .join('');
              }
              return '';
            })
            .join('\n\n');
            
          setContent(textContent);
        } else if (parsedState.root && parsedState.root.children) {
          // Handle Lexical root structure
          const textContent = parsedState.root.children
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
            
          setContent(textContent);
        } else {
          // Fallback to showing the raw JSON
          setContent(JSON.stringify(parsedState, null, 2));
        }
      } catch (error) {
        console.error('Failed to parse initial editor state', error);
        // If it's a string, just display it as is
        setContent(typeof initialState === 'string' ? initialState : '');
      }
    }
  }, [initialState]);

  // Handle content changes
  const handleChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    // Build a simple Lexical JSON structure
    if (onChange) {
      const paragraphs = newContent.split('\n\n').filter(p => p.trim());
      
      // Create a basic Lexical document structure
      const lexicalJSON = {
        root: {
          type: 'root',
          format: '',
          indent: 0,
          version: 1,
          children: paragraphs.map(p => ({
            type: 'paragraph',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                type: 'text',
                format: 0,
                text: p,
                version: 1,
              }
            ],
          })),
        }
      };
      
      onChange(JSON.stringify(lexicalJSON));
    }
  };

  return (
    <div className={styles['editor-container']} style={{ height }}>
      <div className={styles['editor-shell']}>
        <textarea
          className={styles['editor-input']}
          style={{
            width: '100%',
            height: height === 'auto' ? '300px' : height,
            padding: '16px',
            fontSize: '16px',
            lineHeight: '1.5',
            border: 'none',
            outline: 'none',
            resize: 'vertical',
          }}
          value={content}
          onChange={handleChange}
          placeholder={placeholder}
          readOnly={readOnly}
          autoFocus={!readOnly}
        />
      </div>
    </div>
  );
};

export default BasicTextEditor;
