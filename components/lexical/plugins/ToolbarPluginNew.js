import React, { useCallback, useState } from 'react';
import { 
  Box, 
  ButtonGroup, 
  IconButton, 
  Tooltip, 
  Divider, 
  Menu, 
  MenuItem,
  ListItemIcon,
  ListItemText
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
import TextFieldsIcon from '@mui/icons-material/TextFields';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { 
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  $createParagraphNode
} from 'lexical';
import { $isHeadingNode } from '@lexical/rich-text';
import { $wrapNodes, $isAtNodeEnd } from '@lexical/selection';
import { $getNearestNodeOfType } from '@lexical/utils';
import { 
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode
} from '@lexical/list';
import { 
  $createHeadingNode, 
  $createQuoteNode 
} from '@lexical/rich-text';

const LowPriority = 1;

// Helper function to get the current selected node
function getSelectedNode(selection) {
  const anchor = selection.anchor;
  const focus = selection.focus;
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();

  if (anchorNode === focusNode) {
    return anchorNode;
  }

  const isBackward = selection.isBackward();
  if (isBackward) {
    return $isAtNodeEnd(focus) ? anchorNode : focusNode;
  } else {
    return $isAtNodeEnd(anchor) ? focusNode : anchorNode;
  }
}

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [blockType, setBlockType] = useState('paragraph');
  const [anchorEl, setAnchorEl] = useState(null);
  
  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    
    if ($isRangeSelection(selection)) {
      // Update text format
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));

      // Update block type
      const anchorNode = selection.anchor.getNode();
      const element = anchorNode.getKey() === 'root' 
        ? anchorNode 
        : anchorNode.getTopLevelElementOrThrow();
      
      if ($isListNode(element)) {
        const parentList = $getNearestNodeOfType(anchorNode, ListNode);
        const type = parentList ? parentList.getTag() : element.getTag();
        setBlockType(type === 'ul' ? 'bullet' : 'number');
      } else {
        const type = $isHeadingNode(element) 
          ? element.getTag() 
          : element.getType();
        setBlockType(type);
      }
    }
  }, []);

  // Register update listener
  React.useEffect(() => {
    return editor.registerUpdateListener(({editorState}) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  // Format commands
  const formatBold = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
  };

  const formatItalic = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
  };

  const formatUnderline = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
  };

  const formatBulletList = () => {
    if (blockType === 'bullet') {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    }
  };

  const formatNumberedList = () => {
    if (blockType === 'number') {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    }
  };

  const formatQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $wrapNodes(selection, () => $createQuoteNode());
      }
    });
  };
  const formatHeading = (headingSize) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        // If already this heading type, convert to paragraph
        if (blockType === headingSize) {
          $wrapNodes(selection, () => $createParagraphNode());
        } else {
          $wrapNodes(selection, () => $createHeadingNode(headingSize));
        }
      }
    });
    
    setAnchorEl(null);
  };
  
  const handleHeadingClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const undo = () => {
    editor.dispatchCommand(UNDO_COMMAND, undefined);
  };

  const redo = () => {
    editor.dispatchCommand(REDO_COMMAND, undefined);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexWrap: 'wrap', 
      gap: 1,
      p: 1,
      borderBottom: '1px solid #eee',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px 8px 0 0'
    }}>
      {/* Text Formatting */}
      <ButtonGroup size="small" variant="outlined">
        <Tooltip title="Bold">
          <IconButton 
            size="small" 
            onClick={formatBold}
            color={isBold ? 'primary' : 'default'}
          >
            <FormatBoldIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Italic">
          <IconButton 
            size="small" 
            onClick={formatItalic}
            color={isItalic ? 'primary' : 'default'}
          >
            <FormatItalicIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Underline">
          <IconButton 
            size="small" 
            onClick={formatUnderline}
            color={isUnderline ? 'primary' : 'default'}
          >
            <FormatUnderlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </ButtonGroup>
      
      <Divider orientation="vertical" flexItem />
      
      {/* Headings */}
      <Box sx={{ position: 'relative' }}>
        <Tooltip title="Headings">
          <IconButton 
            size="small" 
            onClick={handleHeadingClick}
            color={blockType.startsWith('h') ? 'primary' : 'default'}
          >
            <TitleIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <MenuItem onClick={() => formatHeading('h1')}>
            <ListItemIcon>
              <TextFieldsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Heading 1</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => formatHeading('h2')}>
            <ListItemIcon>
              <TextFieldsIcon fontSize="small" sx={{ transform: 'scale(0.9)' }} />
            </ListItemIcon>
            <ListItemText>Heading 2</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => formatHeading('h3')}>
            <ListItemIcon>
              <TextFieldsIcon fontSize="small" sx={{ transform: 'scale(0.8)' }} />
            </ListItemIcon>
            <ListItemText>Heading 3</ListItemText>
          </MenuItem>
        </Menu>
      </Box>
      
      {/* Lists and Quote */}
      <ButtonGroup size="small" variant="outlined">
        <Tooltip title="Bullet List">
          <IconButton 
            size="small" 
            onClick={formatBulletList}
            color={blockType === 'bullet' ? 'primary' : 'default'}
          >
            <FormatListBulletedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Numbered List">
          <IconButton 
            size="small" 
            onClick={formatNumberedList}
            color={blockType === 'number' ? 'primary' : 'default'}
          >
            <FormatListNumberedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Quote">
          <IconButton 
            size="small" 
            onClick={formatQuote}
            color={blockType === 'quote' ? 'primary' : 'default'}
          >
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
  );
}
