import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Divider, 
  Button, 
  ButtonGroup, 
  Tooltip
} from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import TitleIcon from '@mui/icons-material/Title';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import MenuIcon from '@mui/icons-material/Menu';

// A rich text editor using the browser's contentEditable API
const ContentEditableEditor = ({
  onChange,
  initialState,
  placeholder = 'Start writing...',
  readOnly = false,
  height = 'auto',
  autoFocus = true,
  showToolbar = true
}) => {
  const editorRef = useRef(null);
  const [editorHtml, setEditorHtml] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isHeadingMenuOpen, setIsHeadingMenuOpen] = useState(false);
  const actualHeight = height === 'auto' ? '300px' : height;

  // Initialize editor content
  useEffect(() => {
    if (!initialState) {
      setEditorHtml('');
      return;
    }

    try {
      if (typeof initialState === 'string') {
        // Check if it looks encrypted
        if (!initialState.startsWith('{') && 
            initialState.match(/^[A-Za-z0-9+/=]+$/)) {
          setEditorHtml('<div style="color:red">Content appears to be encrypted.</div>');
          return;
        }
        
        // Try to parse as Lexical JSON
        try {
          const parsed = JSON.parse(initialState);
          
          // Convert Lexical format to HTML
          if (parsed.root && Array.isArray(parsed.root.children)) {
            let convertedHtml = '';
            
            parsed.root.children.forEach(node => {
              if (node.type === 'paragraph') {
                convertedHtml += '<p>';
                if (node.children) {
                  node.children.forEach(child => {
                    let text = child.text || '';
                    
                    // Apply text formatting
                    if (child.format) {
                      if (child.format & 1) text = `<strong>${text}</strong>`;
                      if (child.format & 2) text = `<em>${text}</em>`;
                      if (child.format & 4) text = `<u>${text}</u>`;
                    }
                    
                    convertedHtml += text;
                  });
                }
                convertedHtml += '</p>';
              }
              else if (node.type === 'heading') {
                const level = node.tag || 'h1';
                convertedHtml += `<${level}>`;
                if (node.children) {
                  node.children.forEach(child => {
                    convertedHtml += child.text || '';
                  });
                }
                convertedHtml += `</${level}>`;
              }
              else if (node.type === 'list') {
                const listType = node.listType === 'number' ? 'ol' : 'ul';
                convertedHtml += `<${listType}>`;
                
                if (node.children) {
                  node.children.forEach(item => {
                    convertedHtml += '<li>';
                    if (item.children) {
                      item.children.forEach(child => {
                        convertedHtml += child.text || '';
                      });
                    }
                    convertedHtml += '</li>';
                  });
                }
                
                convertedHtml += `</${listType}>`;
              }
              else if (node.type === 'quote') {
                convertedHtml += '<blockquote>';
                if (node.children) {
                  node.children.forEach(child => {
                    convertedHtml += child.text || '';
                  });
                }
                convertedHtml += '</blockquote>';
              }
            });
            
            setEditorHtml(convertedHtml || '');
          } else {
            // Fallback to displaying as text
            const text = JSON.stringify(parsed);
            setEditorHtml(`<p>${text}</p>`);
          }
        } catch (e) {
          // If parsing fails, use as plain text
          setEditorHtml(`<p>${initialState}</p>`);
        }
      } else {
        setEditorHtml('');
      }
    } catch (e) {
      console.error('Error processing initial content:', e);
      setEditorHtml('<p>Error loading content.</p>');
    }
  }, [initialState]);

  // Handle editor changes
  const handleContentChange = () => {
    if (!editorRef.current || readOnly) return;
    
    const content = editorRef.current.innerHTML;
    setEditorHtml(content);
    
    if (onChange) {
      // Convert HTML to Lexical JSON format
      const lexicalJson = convertHtmlToLexicalJson(content);
      onChange(JSON.stringify(lexicalJson));
    }
  };

  // Convert HTML to a simplified Lexical JSON format
  const convertHtmlToLexicalJson = (html) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const rootChildren = [];
    let currentListItems = [];
    let currentListType = null;
    
    // Process each top-level node
    Array.from(tempDiv.childNodes).forEach(node => {
      // If text node, wrap in paragraph
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.textContent.trim()) {
          rootChildren.push({
            type: 'paragraph',
            children: [{ text: node.textContent, type: 'text' }],
            direction: null,
            format: '',
            indent: 0,
            version: 1
          });
        }
        return;
      }
      
      // Process element nodes
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();
        
        // Handle paragraphs
        if (tagName === 'p') {
          rootChildren.push({
            type: 'paragraph',
            children: processTextContent(node),
            direction: null, 
            format: '',
            indent: 0,
            version: 1
          });
        }
        // Handle headings
        else if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
          rootChildren.push({
            type: 'heading',
            tag: tagName,
            children: processTextContent(node),
            direction: null,
            format: '',
            indent: 0,
            version: 1
          });
        }
        // Handle lists
        else if (tagName === 'ul' || tagName === 'ol') {
          const listItems = [];
          
          Array.from(node.childNodes).forEach(listItemNode => {
            if (listItemNode.nodeType === Node.ELEMENT_NODE && listItemNode.tagName.toLowerCase() === 'li') {
              listItems.push({
                type: 'listitem',
                children: processTextContent(listItemNode),
                direction: null,
                format: '',
                indent: 0,
                value: 1,
                version: 1
              });
            }
          });
          
          rootChildren.push({
            type: 'list',
            listType: tagName === 'ol' ? 'number' : 'bullet',
            children: listItems,
            direction: null,
            format: '',
            indent: 0,
            version: 1
          });
        }
        // Handle blockquotes
        else if (tagName === 'blockquote') {
          rootChildren.push({
            type: 'quote',
            children: processTextContent(node),
            direction: null,
            format: '',
            indent: 0,
            version: 1
          });
        }
        // Handle divs (convert to paragraphs)
        else if (tagName === 'div' || tagName === 'span') {
          rootChildren.push({
            type: 'paragraph',
            children: processTextContent(node),
            direction: null,
            format: '',
            indent: 0,
            version: 1
          });
        }
        // Handle any other elements
        else {
          rootChildren.push({
            type: 'paragraph',
            children: processTextContent(node),
            direction: null,
            format: '',
            indent: 0,
            version: 1
          });
        }
      }
    });
    
    // Ensure at least one paragraph
    if (rootChildren.length === 0) {
      rootChildren.push({
        type: 'paragraph',
        children: [{ text: '', type: 'text' }],
        direction: null,
        format: '',
        indent: 0,
        version: 1
      });
    }
    
    return {
      root: {
        children: rootChildren,
        direction: null,
        format: '',
        indent: 0,
        type: 'root',
        version: 1
      }
    };
  };
  
  // Process text content and formatting
  const processTextContent = (node) => {
    const textNodes = [];
    
    // If no children, return the text content
    if (!node.childNodes || node.childNodes.length === 0) {
      textNodes.push({
        detail: 0,
        format: 0,
        mode: 'normal',
        style: '',
        text: node.textContent || '',
        type: 'text',
        version: 1
      });
      return textNodes;
    }
    
    // Process child nodes
    Array.from(node.childNodes).forEach(childNode => {
      // Handle text nodes
      if (childNode.nodeType === Node.TEXT_NODE) {
        if (childNode.textContent.trim()) {
          textNodes.push({
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: childNode.textContent,
            type: 'text',
            version: 1
          });
        }
      }
      // Handle element nodes with formatting
      else if (childNode.nodeType === Node.ELEMENT_NODE) {
        const childTagName = childNode.tagName.toLowerCase();
        let format = 0;
        
        // Determine format flags
        if (childTagName === 'strong' || childTagName === 'b') format |= 1;
        if (childTagName === 'em' || childTagName === 'i') format |= 2;
        if (childTagName === 'u') format |= 4;
        
        // Handle nested formatting
        if (['strong', 'b', 'em', 'i', 'u', 'span'].includes(childTagName)) {
          const nestedTextNodes = processTextContent(childNode);
          nestedTextNodes.forEach(textNode => {
            textNode.format |= format;
            textNodes.push(textNode);
          });
        } else {
          // Handle other elements
          textNodes.push({
            detail: 0,
            format: format,
            mode: 'normal',
            style: '',
            text: childNode.textContent || '',
            type: 'text',
            version: 1
          });
        }
      }
    });
    
    return textNodes;
  };

  // Format commands
  const execCommand = (command, value = null) => {
    if (readOnly) return;
    
    document.execCommand(command, false, value);
    handleContentChange();
    editorRef.current.focus();
  };

  // Formatting handlers
  const toggleBold = () => execCommand('bold');
  const toggleItalic = () => execCommand('italic');
  const toggleUnderline = () => execCommand('underline');
  const toggleUnorderedList = () => execCommand('insertUnorderedList');
  const toggleOrderedList = () => execCommand('insertOrderedList');
  const formatBlock = (block) => execCommand('formatBlock', block);
  const undo = () => execCommand('undo');
  const redo = () => execCommand('redo');

  // Insert heading
  const insertHeading = (level) => {
    formatBlock(`<h${level}>`);
    setIsHeadingMenuOpen(false);
  };
  
  // Insert blockquote
  const insertQuote = () => formatBlock('<blockquote>');

  // Style for contentEditable area
  const editorStyle = {
    padding: '16px',
    minHeight: actualHeight,
    maxHeight: '500px',
    overflow: 'auto',
    outline: 'none',
    lineHeight: '1.5',
    fontSize: '16px',
    fontFamily: 'inherit',
  };

  // CSS styles for formatted content
  const contentStyles = `
    .rich-editor-content p {
      margin: 0 0 16px 0;
    }
    .rich-editor-content h1 {
      font-size: 24px;
      font-weight: bold;
      margin: 24px 0 16px 0;
    }
    .rich-editor-content h2 {
      font-size: 20px;
      font-weight: bold;
      margin: 20px 0 14px 0;
    }
    .rich-editor-content h3 {
      font-size: 18px;
      font-weight: bold;
      margin: 18px 0 12px 0;
    }
    .rich-editor-content ul, .rich-editor-content ol {
      margin: 16px 0;
      padding-left: 24px;
    }
    .rich-editor-content li {
      margin-bottom: 8px;
    }
    .rich-editor-content blockquote {
      border-left: 3px solid #ddd;
      margin: 16px 0;
      padding-left: 16px;
      font-style: italic;
      color: #555;
    }
  `;

  return (
    <Box sx={{ position: 'relative', mt: 2 }}>
      {/* Add CSS styles */}
      <style>{contentStyles}</style>
      
      <Box
        sx={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: '#fff'
        }}
      >
        {/* Toolbar */}
        {showToolbar && !readOnly && (
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            padding: 1,
            gap: 1,
            borderBottom: '1px solid #eee',
            backgroundColor: '#f8f9fa',
            alignItems: 'center'
          }}>
            {/* Text formatting */}
            <ButtonGroup size="small" variant="outlined">
              <Tooltip title="Bold">
                <IconButton size="small" onClick={toggleBold}>
                  <FormatBoldIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Italic">
                <IconButton size="small" onClick={toggleItalic}>
                  <FormatItalicIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Underline">
                <IconButton size="small" onClick={toggleUnderline}>
                  <FormatUnderlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </ButtonGroup>
            
            <Divider orientation="vertical" flexItem />
            
            {/* Headings menu */}
            <Box sx={{ position: 'relative' }}>
              <Tooltip title="Headings">
                <IconButton 
                  size="small" 
                  onClick={() => setIsHeadingMenuOpen(!isHeadingMenuOpen)}
                >
                  <TitleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              {isHeadingMenuOpen && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    zIndex: 10,
                    boxShadow: 3,
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: 1
                  }}
                >
                  <Button 
                    sx={{ display: 'block', textAlign: 'left', width: '100%', justifyContent: 'flex-start' }}
                    onClick={() => insertHeading(1)}
                  >
                    Heading 1
                  </Button>
                  <Button 
                    sx={{ display: 'block', textAlign: 'left', width: '100%', justifyContent: 'flex-start' }}
                    onClick={() => insertHeading(2)}
                  >
                    Heading 2
                  </Button>
                  <Button 
                    sx={{ display: 'block', textAlign: 'left', width: '100%', justifyContent: 'flex-start' }}
                    onClick={() => insertHeading(3)}
                  >
                    Heading 3
                  </Button>
                  <Button 
                    sx={{ display: 'block', textAlign: 'left', width: '100%', justifyContent: 'flex-start' }}
                    onClick={() => formatBlock('<p>')}
                  >
                    Normal Text
                  </Button>
                </Box>
              )}
            </Box>
            
            {/* Lists and quote */}
            <ButtonGroup size="small" variant="outlined">
              <Tooltip title="Bullet List">
                <IconButton size="small" onClick={toggleUnorderedList}>
                  <FormatListBulletedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Numbered List">
                <IconButton size="small" onClick={toggleOrderedList}>
                  <FormatListNumberedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Quote">
                <IconButton size="small" onClick={insertQuote}>
                  <FormatQuoteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </ButtonGroup>
            
            <Divider orientation="vertical" flexItem />
            
            {/* Undo/Redo */}
            <ButtonGroup size="small" variant="outlined">
              <Tooltip title="Undo">
                <IconButton size="small" onClick={undo}>
                  <UndoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Redo">
                <IconButton size="small" onClick={redo}>
                  <RedoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </ButtonGroup>
          </Box>
        )}
        
        {/* Read-only indicator */}
        {readOnly && (
          <Box 
            sx={{ 
              padding: 1, 
              backgroundColor: '#f5f5f5',
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Read-only Mode
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Rich Text Content
            </Typography>
          </Box>
        )}
        
        {/* Editor area */}
        <div 
          ref={editorRef}
          className="rich-editor-content"
          contentEditable={!readOnly}
          dangerouslySetInnerHTML={{ __html: editorHtml || placeholder }}
          onInput={handleContentChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            ...editorStyle,
            color: editorHtml ? 'inherit' : '#aaa'
          }}
        />
      </Box>
    </Box>
  );
};

export default ContentEditableEditor;
