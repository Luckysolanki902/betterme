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

      // Update text format
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsCode(selection.hasFormat('code'));
      setIsRTL($isParentElementRTL(selection));

      // Update links
      const node = getSelectedNode(selection);
      const parent = node.getParent();
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true);
      } else {
        setIsLink(false);
      }
    }
  }, [activeEditor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, newEditor) => {
          updateToolbar();
          setActiveEditor(newEditor);
          return false;
        },
        LowPriority,
      ),
    );
  }, [editor, updateToolbar]);

  const formatParagraph = () => {
    if (blockType !== 'paragraph') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createParagraphNode());
        }
      });
    }
  };

  const formatHeading = (headingSize) => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode(headingSize));
        }
      });
    }
  };

  const formatBulletList = () => {
    if (blockType !== 'bullet') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND);
    }
  };

  const formatNumberedList = () => {
    if (blockType !== 'number') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND);
    }
  };

  const formatQuote = () => {
    if (blockType !== 'quote') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createQuoteNode());
        }
      });
    }
  };

  const formatLink = () => {
    if (!isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, 'https://');
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  };

  const insertImage = () => {
    setShowImageDialog(true);
  };

  return (
    <div className="toolbar">
      <button
        onClick={formatParagraph}
        className={blockType === 'paragraph' ? 'active' : ''}
        title="Normal Text"
      >
        <i className="material-icons">format_paragraph</i>
      </button>
      <button
        onClick={() => formatHeading('h1')}
        className={blockType === 'h1' ? 'active' : ''}
        title="Heading 1"
      >
        <i className="material-icons">looks_one</i>
      </button>
      <button
        onClick={() => formatHeading('h2')}
        className={blockType === 'h2' ? 'active' : ''}
        title="Heading 2"
      >
        <i className="material-icons">looks_two</i>
      </button>

      <span className="divider" />

      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
        }}
        className={isBold ? 'active' : ''}
        title="Bold"
      >
        <i className="material-icons">format_bold</i>
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
        }}
        className={isItalic ? 'active' : ''}
        title="Italic"
      >
        <i className="material-icons">format_italic</i>
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
        }}
        className={isUnderline ? 'active' : ''}
        title="Underline"
      >
        <i className="material-icons">format_underlined</i>
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
        }}
        className={isStrikethrough ? 'active' : ''}
        title="Strikethrough"
      >
        <i className="material-icons">strikethrough_s</i>
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
        }}
        className={isCode ? 'active' : ''}
        title="Code"
      >
        <i className="material-icons">code</i>
      </button>

      <span className="divider" />

      <button
        onClick={formatBulletList}
        className={blockType === 'bullet' ? 'active' : ''}
        title="Bullet List"
      >
        <i className="material-icons">format_list_bulleted</i>
      </button>
      <button
        onClick={formatNumberedList}
        className={blockType === 'number' ? 'active' : ''}
        title="Numbered List"
      >
        <i className="material-icons">format_list_numbered</i>
      </button>
      <button
        onClick={formatQuote}
        className={blockType === 'quote' ? 'active' : ''}
        title="Quote"
      >
        <i className="material-icons">format_quote</i>
      </button>
      <button
        onClick={formatLink}
        className={isLink ? 'active' : ''}
        title={isLink ? 'Remove Link' : 'Insert Link'}
      >
        <i className="material-icons">link</i>
      </button>
      <button onClick={insertImage} title="Insert Image">
        <i className="material-icons">image</i>
      </button>

      {showImageDialog && (
        <InsertImageDialog
          activeEditor={activeEditor}
          onClose={() => setShowImageDialog(false)}
        />
      )}
    </div>
  );
};

export default ToolbarPlugin;
