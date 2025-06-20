import React, { useState, useEffect } from 'react';

// A simple fallback editor with no dependencies
const MinimalEditor = ({
  onChange,
  initialState,
  placeholder = 'Start writing...',
  readOnly = false,
  height = '300px',
}) => {
  const [text, setText] = useState('');
  // Initialize with content from initialState
  useEffect(() => {
    if (initialState) {
      try {
        // Check if the initialState is valid JSON
        if (!initialState.startsWith('{') && !initialState.startsWith('[')) {
          // This is not JSON, might be an encrypted or encoded string
          console.log('Non-JSON content detected, displaying as is');
          setText(initialState);
          return;
        }
        
        const parsed = JSON.parse(initialState);
        let extractedText = '';
        
        const extractTextFromNode = (node) => {
          if (node.text) return node.text;
          if (node.children) {
            return node.children.map(child => extractTextFromNode(child)).join('');
          }
          return '';
        };
        
        if (parsed.root && parsed.root.children) {
          extractedText = parsed.root.children
            .map(node => extractTextFromNode(node))
            .join('\n\n');
        }
        
        setText(extractedText || '');
      } catch (e) {
        // If parsing fails, use the original content
        console.error('Failed to parse initial state:', e);
        // If it's a string, just display it as is
        setText(typeof initialState === 'string' ? initialState : '');
      }
    }
  }, [initialState]);

  const handleChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    
    if (onChange) {
      // Create a Lexical-compatible JSON
      const paragraphs = newText.split('\n\n').filter(p => p.trim());
      
      const jsonStructure = {
        root: {
          children: paragraphs.map(paragraph => ({
            children: [{ 
              text: paragraph,
              type: 'text',
              version: 1
            }],
            type: 'paragraph',
            version: 1
          })),
          type: 'root',
          version: 1
        }
      };
      
      onChange(JSON.stringify(jsonStructure));
    }
  };

  return (
    <div style={{ 
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <textarea
        value={text}
        onChange={handleChange}
        placeholder={placeholder}
        readOnly={readOnly}
        style={{
          width: '100%',
          height: height,
          padding: '16px',
          fontSize: '16px',
          fontFamily: 'inherit',
          lineHeight: '1.5',
          border: 'none',
          outline: 'none',
          resize: 'vertical',
          boxSizing: 'border-box'
        }}
      />
    </div>
  );
};

export default MinimalEditor;
