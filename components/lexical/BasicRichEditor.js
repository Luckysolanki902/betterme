// components/lexical/BasicRichEditor.js
import React, { useEffect, useState, useRef } from 'react';
import { Box, CircularProgress, Typography, Alert, Collapse } from '@mui/material';
import { isLikelyEncrypted } from '@/utils/plannerUtils';

// A basic rich text editor component that handles formatting
const BasicRichEditor = ({
  onChange,
  initialState,
  placeholder = 'Start writing...',
  readOnly = false,
  height = 'auto',
  autoFocus = true,
  showToolbar = true,
}) => {
  const [editorContent, setEditorContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true); 
  const [error, setError] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const editorRef = useRef(null);
  const contentRef = useRef(initialState);
  const actualHeight = height === 'auto' ? '300px' : height;

  useEffect(() => {
    contentRef.current = initialState;
    
    // Check if content appears to be encrypted
    if (initialState && typeof initialState === 'string' && isLikelyEncrypted(initialState)) {
      setShowWarning(true);
      setError("Content appears to be encrypted. Formatting may not display correctly.");
    } else {
      setShowWarning(false);
    }

    try {
      let contentToProcess = initialState;
      let jsonContent = null;
      
      if (typeof contentToProcess === 'string') {
        if (!contentToProcess.startsWith('{') && !contentToProcess.startsWith('[')) {
          setError("Invalid content format. Expected JSON.");
          setEditorContent({
            root: {
              children: [{
                children: [{ text: "Error loading content. Try refreshing." }],
                type: "paragraph"
              }],
              type: "root"
            }
          });
          return;
        }
        
        try {
          jsonContent = JSON.parse(contentToProcess);
        } catch (e) {
          console.error('Failed to parse editor content:', e);
          setError("Invalid JSON content.");
          setEditorContent(null);
          return;
        }
      } else if (typeof contentToProcess === 'object') {
        jsonContent = contentToProcess;
      } else {
        setEditorContent(null);
        return;
      }

      // Process the Lexical structure
      if (jsonContent) {
        setEditorContent(jsonContent);
      }
    } catch (e) {
      console.error('Error processing editor content:', e);
      setError("Error processing content.");
    } finally {
      setIsLoading(false);
    }
  }, [initialState]);

  // Custom renderer for rich text content
  const renderContent = () => {
    if (!editorContent) return null;
    
    try {
      return (
        <div className="rich-content-wrapper">
          {editorContent.root?.children?.map((node, index) => {
            if (node.type === 'paragraph') {
              return (
                <p key={index} style={{ 
                  margin: node.format === 'center' ? '8px auto' : '8px 0',
                  textAlign: node.format || 'left', 
                  paddingLeft: node.indent ? `${node.indent * 20}px` : 0 
                }}>
                  {node.children?.map((child, childIndex) => {
                    if (!child.text) return null;
                    
                    // Apply basic formatting
                    let style = {};
                    if (child.format & 1) style.fontWeight = 'bold';
                    if (child.format & 2) style.fontStyle = 'italic';
                    if (child.format & 4) style.textDecoration = 'underline';
                    if (child.format & 8) style.textDecoration = 'line-through';
                    if (child.format & 16) style.fontFamily = 'monospace';

                    return (
                      <span key={childIndex} style={style}>
                        {child.text}
                      </span>
                    );
                  })}
                </p>
              );
            }
            
            if (node.type === 'heading') {
              const HeadingTag = `h${node.tag}`;
              return (
                <HeadingTag key={index} style={{ 
                  margin: node.format === 'center' ? '10px auto' : '10px 0',
                  textAlign: node.format || 'left'
                }}>
                  {node.children?.map((child, childIndex) => (
                    <span key={childIndex}>{child.text}</span>
                  ))}
                </HeadingTag>
              );
            }
            
            if (node.type === 'list') {
              const ListTag = node.listType === 'number' ? 'ol' : 'ul';
              return (
                <ListTag key={index} start={node.start || 1}>
                  {node.children?.map((listItem, itemIndex) => (
                    <li key={itemIndex}>
                      {listItem.children?.map((child, childIndex) => {
                        if (child.type === 'text') {
                          return <span key={childIndex}>{child.text}</span>;
                        }
                        return null;
                      })}
                    </li>
                  ))}
                </ListTag>
              );
            }
            
            // Default fallback for unhandled node types
            return (
              <div key={index} style={{ margin: '8px 0' }}>
                {node.children?.map((child, childIndex) => (
                  <span key={childIndex}>{child.text || ''}</span>
                ))}
              </div>
            );
          })}
        </div>
      );
    } catch (error) {
      console.error('Error rendering rich content:', error);
      return <Typography color="error">Error rendering content</Typography>;
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: actualHeight 
      }}>
        <CircularProgress size={30} />
      </Box>
    );
  }

  return (
    <div 
      ref={editorRef}
      style={{ 
        position: 'relative',
        minHeight: actualHeight,
        fontFamily: 'inherit',
        lineHeight: '1.5'
      }}
    >
      {showWarning && (
        <Collapse in={showWarning}>
          <Alert 
            severity="warning" 
            onClose={() => setShowWarning(false)}
            sx={{ mb: 2 }}
          >
            {error || "Content may be encrypted or invalid. Rich formatting might not display correctly."}
          </Alert>
        </Collapse>
      )}

      {showToolbar && (
        <Box
          sx={{
            display: 'flex',
            padding: '8px',
            borderBottom: '1px solid #eee',
            background: '#f9f9f9',
            borderRadius: '8px 8px 0 0',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Read-only rich text view
          </Typography>
        </Box>
      )}
      
      <Box
        sx={{
          border: '1px solid #ddd',
          borderRadius: showToolbar ? '0 0 8px 8px' : '8px',
          padding: 2,
          minHeight: '250px',
          backgroundColor: '#fff'
        }}
      >
        {renderContent()}
        {!editorContent || !editorContent.root?.children?.length && (
          <Typography 
            color="text.disabled" 
            sx={{ fontStyle: 'italic' }}
          >
            {placeholder}
          </Typography>
        )}
      </Box>
    </div>
  );
};

export default BasicRichEditor;
