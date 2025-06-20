import React, { useState, useEffect } from 'react';

// A super simplified editor with no dependencies on Lexical
// This is a fallback for when all Lexical-based editors fail
const SimplestEditor = ({
  onChange,
  initialState,
  placeholder = 'Start writing...',
  readOnly = false,
  height = '300px',
}) => {
  const [text, setText] = useState('');

  // Initialize with content from initialState if available
  useEffect(() => {
    if (initialState) {
      try {
        // Try to extract text from Lexical JSON format
        const parsed = JSON.parse(initialState);
        
        // Simple extraction of text from Lexical format
        if (parsed.root && Array.isArray(parsed.root.children)) {
          const extractedText = parsed.root.children
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
          
          setText(extractedText || '');
        } else {
          setText('');
        }
      } catch (e) {
        console.error('Failed to parse initial state:', e);
        setText('');
      }
    }
  }, [initialState]);

  // Handle text changes and provide JSON structure to parent
  const handleChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    
    if (onChange) {
      // Create a simple Lexical-like JSON structure
      const paragraphs = newText.split('\n').filter(line => line.trim());
      
      const jsonStructure = {
        root: {
          children: paragraphs.map(paragraph => ({
            children: [{ text: paragraph }],
            type: 'paragraph'
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
      border: '1px solid #ddd',
      borderRadius: '4px',
      position: 'relative'
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
          lineHeight: '1.5',
          border: 'none',
          borderRadius: '4px',
          resize: 'vertical',
          fontFamily: 'inherit',
          outline: 'none',
          boxSizing: 'border-box'
        }}
      />
    </div>
  );
};

export default SimplestEditor;
