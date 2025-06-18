// components/journal/JournalEditor.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  IconButton,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  alpha,
  useMediaQuery
} from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import CloseIcon from '@mui/icons-material/Close';
import TitleIcon from '@mui/icons-material/Title';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import SaveIcon from '@mui/icons-material/Save';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import dayjs from 'dayjs';
import styles from './JournalStyles.module.css';
import MoodDisplay from './MoodDisplay';
import { DEFAULT_MOOD } from '@/utils/moods';

// Journal editor component with Notion-like editing experience
const JournalEditor = ({ 
  date = dayjs(), 
  entry = null, 
  onSave,
  onClose,
  onUpdateMood 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    // State for journal entry data
  const [title, setTitle] = useState(entry?.title || '');
  const [content, setContent] = useState(entry?.content || [{ type: 'paragraph', content: '' }]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState('');
  // State for suggestions
  const [suggestionDialog, setSuggestionDialog] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [autoSuggestion, setAutoSuggestion] = useState("Let your thoughts flow — fresh writing prompts appear every 30 seconds to guide your journey.");
  const [showAutoSuggestion, setShowAutoSuggestion] = useState(true); // Always show footer
  const [loadingAutoSuggestion, setLoadingAutoSuggestion] = useState(false);
  
  // Default suggestions to show when no AI suggestion is available
  const defaultSuggestions = [
  "Let your thoughts flow — fresh writing prompts appear every 30 seconds to guide your journey."
  ];
  // State for mood management
  const [isManuallyUpdatingMood, setIsManuallyUpdatingMood] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [isAISuggestion, setIsAISuggestion] = useState(false); // Track if current suggestion is from AI
  
  // Refs for timers and other non-reactive data
  const editorRef = useRef(null);
  const lastMoodUpdateAttempt = useRef(0);
  const suggestionTimer = useRef(null);
  const suggestionChangeTimer = useRef(null);
  const autoSaveInterval = useRef(null);
  const autoMoodUpdateInterval = useRef(null);
  const typingTimer = useRef(null);  // Constants
  const MOOD_UPDATE_COOLDOWN = 10000; // 10 seconds
  const AUTO_SUGGESTION_DELAY = 30000; // 30 seconds between suggestion refreshes
  const CONTENT_CHANGE_SUGGESTION_DELAY = 10000; // 10 seconds after content changes
  const AUTOSAVE_DELAY = 30000; // 30 seconds for auto-save
  const AUTO_MOOD_UPDATE_DELAY = 45000; // 45 seconds for auto mood update= 45000

  // Get random default suggestion
  const getRandomDefaultSuggestion = useCallback(() => {
    return defaultSuggestions[Math.floor(Math.random() * defaultSuggestions.length)];  }, [defaultSuggestions]);

  // Effect to update local state when entry prop changes - but only once initially
  useEffect(() => {
    if (entry && !hasChanges) {
      setTitle(entry.title || '');
      setContent(entry.content || [{ type: 'paragraph', content: '' }]);
    }
  }, [entry]); // Removed isUserTyping dependency to prevent constant overrides
  
  // Calculate word count from content blocks
  const calculateWordCount = useCallback(() => {
    let count = 0;
    content.forEach(block => {
      if (block.content) {
        count += block.content.trim().split(/\s+/).filter(Boolean).length;
      }
      if (Array.isArray(block.listItems)) {
        block.listItems.forEach(item => {
          if (item.content) {
            count += item.content.trim().split(/\s+/).filter(Boolean).length;
          }
        });
      }
    });
    return count;
  }, [content]);
  
  // Handle saving the journal entry
  const handleSave = useCallback(async (isManualSave = false) => {
    if (!hasChanges && !isManualSave) return; // Don't save if no changes unless manual save
    
    setIsSaving(true);
    setError('');
    
    try {
      const wordCount = calculateWordCount();      const entryData = {
        entryDate: date,
        title,
        content,
        mood: entry?.mood || DEFAULT_MOOD,
        tags: [], // Remove tags
        wordCount,
        forceMoodUpdate: isManualSave,
      }
      
      await onSave(entryData);
      setHasChanges(false);
    } catch (err) {
      console.error('Error saving journal entry:', err);
      setError('Failed to save your entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [hasChanges, date, title, content, entry?.mood, onSave, calculateWordCount]);
  // Auto-save, auto-mood update, and auto-suggestion logic
  useEffect(() => {
    if (hasChanges) {
      // Clear previous auto-save timer
      if (autoSaveInterval.current) clearTimeout(autoSaveInterval.current);
      autoSaveInterval.current = setTimeout(() => handleSave(false), AUTOSAVE_DELAY);

      // Clear previous auto-mood update timer
      if (autoMoodUpdateInterval.current) clearTimeout(autoMoodUpdateInterval.current);
      autoMoodUpdateInterval.current = setTimeout(async () => {
        const wordCount = calculateWordCount();
        if (wordCount > 30 && onUpdateMood) { // Only update mood if enough content
          const currentMood = entry?.mood || DEFAULT_MOOD;
          const now = Date.now();
          // Check cooldown and if AI already detected or if it was long ago
          if (now - (currentMood.lastAnalyzedTimestamp || 0) > MOOD_UPDATE_COOLDOWN) { 
            try {
              setIsManuallyUpdatingMood(true);
              await onUpdateMood(content);
            } catch (e) { console.error('Auto mood update failed', e); }
            finally { setIsManuallyUpdatingMood(false); }
          }
        }
      }, AUTO_MOOD_UPDATE_DELAY);
    }

    return () => {
      if (autoSaveInterval.current) clearTimeout(autoSaveInterval.current);
      if (autoMoodUpdateInterval.current) clearTimeout(autoMoodUpdateInterval.current);
    };
  }, [hasChanges, handleSave, calculateWordCount, onUpdateMood, entry?.mood, content]);
  // Update hasChanges flag when content changes
  useEffect(() => {
    // Only set hasChanges if it's not the initial load with existing entry data
    const initialContent = JSON.stringify(entry?.content || [{ type: 'paragraph', content: '' }]);
    const currentContent = JSON.stringify(content);
    const initialTitle = entry?.title || '';
    const currentTitle = title;

    if (initialContent !== currentContent || initialTitle !== currentTitle) {
      setHasChanges(true);
      
      // When content changes substantially, update suggestions after a delay
      if (currentContent !== initialContent) {
        // Clear previous timer
        if (suggestionChangeTimer.current) {
          clearTimeout(suggestionChangeTimer.current);
        }
        
        // Set new timer to fetch suggestions if there's enough content
        suggestionChangeTimer.current = setTimeout(() => {
          const wordCount = calculateWordCount();
          if (wordCount > 20) {
            fetchAutoSuggestion();
          }
        }, CONTENT_CHANGE_SUGGESTION_DELAY);
      }
    }
    
    // Cleanup timer on unmount
    return () => {
      if (suggestionChangeTimer.current) {
        clearTimeout(suggestionChangeTimer.current);
      }
    };
  }, [title, content, entry, calculateWordCount]);
  
  // Set up timer to periodically fetch writing suggestions
  useEffect(() => {
    // Setup the timer to fetch suggestions periodically
    suggestionTimer.current = setInterval(() => {
      const wordCount = calculateWordCount();
      if (wordCount >= 20) {
        fetchAutoSuggestion();
      }
    }, AUTO_SUGGESTION_DELAY);
    
    // Initial fetch after a small delay to allow user to start writing
    const initialTimer = setTimeout(() => {
      const wordCount = calculateWordCount();
      if (wordCount >= 20) {
        fetchAutoSuggestion();
      }
    }, 5000);
    
    // Clean up timer on unmount
    return () => {
      if (suggestionTimer.current) {
        clearInterval(suggestionTimer.current);
      }
      if (initialTimer) {
        clearTimeout(initialTimer);
      }
    };  }, [calculateWordCount]);

  // Cleanup typing timer on unmount
  useEffect(() => {
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, []);

  // Handle manual mood update
  const handleManualMoodUpdate = async () => {
    const now = Date.now();
    if (now - lastMoodUpdateAttempt.current < MOOD_UPDATE_COOLDOWN) {
      setError(`Please wait ${Math.ceil((MOOD_UPDATE_COOLDOWN - (now - lastMoodUpdateAttempt.current)) / 1000)}s to update mood again.`);
      return;
    }
    lastMoodUpdateAttempt.current = now;
    setError('');
    setIsManuallyUpdatingMood(true);
    try {
      if (onUpdateMood) {
        await onUpdateMood(content, true); // Pass true for force update
      }
    } catch (err) {
      console.error('Manual mood update error:', err);
      setError('Failed to update mood. Try again.');
    } finally {
      setIsManuallyUpdatingMood(false);
    }
  };
  // Enhanced block addition with empty block replacement (like Notion)
  const handleAddBlock = (type, index = content.length) => {
    const newBlock = { type, content: '' };
    if (type === 'bulletList' || type === 'numberedList') {
      newBlock.listItems = [{ content: '', checked: false }];
    }
    
    // Check if we're inserting at the end or in the middle
    const isAppending = index === content.length;
    
    // Replace empty blocks (any type, not just paragraphs) - like Notion
    if (index > 0 && 
        isAppending && 
        (!content[index - 1].content || content[index - 1].content.trim() === '')) {
      
      // For heading blocks, if clicking a different heading and the current one is empty
      if (type.startsWith('heading') && 
          content[index - 1].type.startsWith('heading') && 
          content[index - 1].type !== type) {
        
        // Just change the heading level instead of adding a new one
        setContent(prevContent => {
          const newContent = [...prevContent];
          newContent[index - 1] = newBlock;
          return newContent;
        });
        
        // Focus the updated block
        setTimeout(() => {
          const blockEl = document.querySelector(`[data-block-id="${index - 1}"]`);
          if (blockEl) {
            const input = blockEl.querySelector('input, textarea');
            if (input) input.focus();
          }
        }, 0);
        
        return;
      }
      
      // For any empty block, replace it with the new type
      setContent(prevContent => {
        const newContent = [...prevContent];
        newContent[index - 1] = newBlock;
        return newContent;
      });
    } else {
      // Insert a new block at the specified index
      setContent(prevContent => [
        ...prevContent.slice(0, index),
        newBlock,
        ...prevContent.slice(index)
      ]);
      
      // For lists, always ensure there's a paragraph after the list
      if ((type === 'bulletList' || type === 'numberedList') && 
          (index === content.length || content[index]?.type !== 'paragraph')) {
        setTimeout(() => {
          setContent(prevContent => [
            ...prevContent.slice(0, index + 1),
            { type: 'paragraph', content: '' },
            ...prevContent.slice(index + 1)
          ]);
        }, 0);
      }
    }
  };
    // Handle updating a content block
  const handleUpdateBlock = (index, updatedBlock) => {
    // Set typing flag to prevent content override
    setIsUserTyping(true);
    
    // Clear existing typing timer
    if (typingTimer.current) clearTimeout(typingTimer.current);
    
    // Set timer to reset typing flag after user stops typing
    typingTimer.current = setTimeout(() => {
      setIsUserTyping(false);
    }, 5000); // 5 seconds after stopping typing
    
    setContent(prevContent => {
      const newContent = [...prevContent];
      newContent[index] = updatedBlock;
      return newContent;
    });
  };

  // Enhanced Notion-like key handling (Enter, Backspace, etc.)
  const handleKeyDown = (e, index, block) => {
    // SHIFT+ENTER for line break within the same block
    if (e.key === 'Enter' && e.shiftKey) {
      // Let default behavior happen (add line break)
      return;
    }
    
    // ENTER KEY HANDLING (like Notion)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      // Special handling for lists
      if (block.type === 'bulletList' || block.type === 'numberedList') {
        // Find the current list item
        const listItemEl = e.target.closest('.list-item');
        if (!listItemEl) return;
        
        const itemIndex = parseInt(listItemEl.dataset.itemIndex);
        if (isNaN(itemIndex) || itemIndex < 0 || !block.listItems) return;
        
        const currentItem = block.listItems[itemIndex];
        
        // If the current item is empty, break out of the list (like Notion)
        if (!currentItem.content.trim()) {
          // If it's the only item, convert the whole block to paragraph
          if (block.listItems.length === 1) {
            handleUpdateBlock(index, { type: 'paragraph', content: '' });
          } else {
            // Remove the empty item
            const newListItems = [...block.listItems];
            newListItems.splice(itemIndex, 1);
            handleUpdateBlock(index, { ...block, listItems: newListItems });
            
            // Add a paragraph after the list
            handleAddBlock('paragraph', index + 1);
            
            // Focus the new paragraph
            setTimeout(() => {
              const nextBlock = document.querySelector(`[data-block-id="${index + 1}"]`);
              if (nextBlock) {
                const input = nextBlock.querySelector('input, textarea');
                if (input) input.focus();
              }
            }, 0);
          }
          return;
        }
        
        // Get cursor position
        const cursorPos = e.target.selectionStart;
        const itemContent = currentItem.content;
        
        if (cursorPos > 0 && cursorPos < itemContent.length) {
          // Split the content at cursor position
          const beforeCursor = itemContent.slice(0, cursorPos);
          const afterCursor = itemContent.slice(cursorPos);
          
          // Update current item with content before cursor
          const newListItems = [...block.listItems];
          newListItems[itemIndex].content = beforeCursor;
          
          // Add new item with content after cursor
          newListItems.splice(itemIndex + 1, 0, { content: afterCursor, checked: false });
          handleUpdateBlock(index, { ...block, listItems: newListItems });
        } else {
          // Add a new empty list item
          const newListItems = [...block.listItems];
          newListItems.splice(itemIndex + 1, 0, { content: '', checked: false });
          handleUpdateBlock(index, { ...block, listItems: newListItems });
        }
        
        // Focus the new item
        setTimeout(() => {
          const listContainer = document.querySelector(`[data-block-id="${index}"]`);
          if (listContainer) {
            const listItems = listContainer.querySelectorAll('.list-item');
            const newItem = listItems[itemIndex + 1];
            if (newItem) {
              const input = newItem.querySelector('input, textarea');
              if (input) {
                input.focus();
                // If we split content, put cursor at beginning of new item
                if (cursorPos > 0 && cursorPos < itemContent.length) {
                  input.selectionStart = 0;
                  input.selectionEnd = 0;
                }
              }
            }
          }
        }, 0);
      } else {
        // Handle non-list blocks
        
        // For headings/quotes, if empty, convert to paragraph instead of adding a new block
        if ((block.type.startsWith('heading') || block.type === 'quote') && !block.content.trim()) {
          handleUpdateBlock(index, { type: 'paragraph', content: '' });
          return;
        }
        
        // Check if content starts with special characters for auto-formatting (like Notion)
        if (block.type === 'paragraph') {
          const content = block.content.trim();
          
          // Convert block based on prefix characters
          if (content === '#') {
            // Convert to heading 1
            handleUpdateBlock(index, { type: 'heading1', content: '' });
            return;
          } else if (content === '##') {
            // Convert to heading 2
            handleUpdateBlock(index, { type: 'heading2', content: '' });
            return;
          } else if (content === '###') {
            // Convert to heading 3
            handleUpdateBlock(index, { type: 'heading3', content: '' });
            return;
          } else if (content === '>') {
            // Convert to quote
            handleUpdateBlock(index, { type: 'quote', content: '' });
            return;
          } else if (content === '-' || content === '* ') {
            // Convert to bullet list
            handleUpdateBlock(index, { 
              type: 'bulletList', 
              listItems: [{ content: '', checked: false }]
            });
            
            // Focus the list item
            setTimeout(() => {
              const listBlock = document.querySelector(`[data-block-id="${index}"]`);
              if (listBlock) {
                const input = listBlock.querySelector('.list-item-input');
                if (input) input.focus();
              }
            }, 0);
            return;
          } else if (content === '1.') {
            // Convert to numbered list
            handleUpdateBlock(index, { 
              type: 'numberedList', 
              listItems: [{ content: '', checked: false }]
            });
            
            // Focus the list item
            setTimeout(() => {
              const listBlock = document.querySelector(`[data-block-id="${index}"]`);
              if (listBlock) {
                const input = listBlock.querySelector('.list-item-input');
                if (input) input.focus();
              }
            }, 0);
            return;
          }
        }
        
        // Get cursor position to split content
        const cursorPos = e.target.selectionStart;
        const currentContent = block.content;
        
        if (cursorPos > 0 && cursorPos < currentContent.length) {
          // Split the content at cursor position
          const beforeCursor = currentContent.slice(0, cursorPos);
          const afterCursor = currentContent.slice(cursorPos);
          
          // Update current block with content before cursor
          handleUpdateBlock(index, { ...block, content: beforeCursor });
          
          // Add new block with content after cursor
          handleAddBlock('paragraph', index + 1);
          setTimeout(() => {
            // Update the new block with the remaining content
            const updatedContent = [...content];
            updatedContent[index + 1] = { ...updatedContent[index + 1], content: afterCursor };
            setContent(updatedContent);
            
            // Focus the new block and set cursor at the beginning
            const nextBlock = document.querySelector(`[data-block-id="${index + 1}"]`);
            if (nextBlock) {
              const input = nextBlock.querySelector('input, textarea');
              if (input) {
                input.focus();
                input.selectionStart = 0;
                input.selectionEnd = 0;
              }
            }
          }, 0);
        } else {
          // Normal case - add a new empty paragraph after current block
          handleAddBlock('paragraph', index + 1);
          
          // Focus the new paragraph
          setTimeout(() => {
            const nextBlock = document.querySelector(`[data-block-id="${index + 1}"]`);
            if (nextBlock) {
              const input = nextBlock.querySelector('input, textarea');
              if (input) input.focus();
            }
          }, 0);
        }
      }
    }
    
    // BACKSPACE KEY HANDLING (like Notion)
    if (e.key === 'Backspace') {
      // If at the beginning of a block, merge with previous block
      if (e.target.selectionStart === 0 && e.target.selectionEnd === 0 && index > 0) {
        const prevBlock = content[index - 1];
        
        // For list items, only handle backspace for first item
        if (block.type === 'bulletList' || block.type === 'numberedList') {
          const listItemEl = e.target.closest('.list-item');
          if (!listItemEl || parseInt(listItemEl.dataset.itemIndex) !== 0) return;
          
          // Only proceed if at the beginning of the first list item
          if (block.listItems?.[0]?.content === '') {
            e.preventDefault();
            
            // Convert the list to a paragraph if empty
            handleUpdateBlock(index, { type: 'paragraph', content: '' });
          }
          return;
        }
        
        // If current block is empty, remove it and focus previous block
        if (!block.content) {
          e.preventDefault();
          
          // Remove current block
          const newContent = [...content];
          newContent.splice(index, 1);
          setContent(newContent);
          
          // Focus the previous block at the end
          setTimeout(() => {
            const prevBlockEl = document.querySelector(`[data-block-id="${index - 1}"]`);
            if (prevBlockEl) {
              const input = prevBlockEl.querySelector('input, textarea');
              if (input) {
                input.focus();
                const length = input.value.length;
                input.selectionStart = length;
                input.selectionEnd = length;
              }
            }
          }, 0);
        }
      }
    }
  };
    // Function to fetch automatic writing suggestions
  const fetchAutoSuggestion = async () => {
    // Don't fetch if we're already loading or there's not enough content
    if (loadingAutoSuggestion || calculateWordCount() < 20) return;
    
    setLoadingAutoSuggestion(true);
    try {
      // Build text from content
      let currentText = '';
      content.forEach(block => {
        if (block.content) currentText += block.content + ' ';
        if (Array.isArray(block.listItems)) {
          block.listItems.forEach(item => { if (item.content) currentText += ' - ' + item.content + ' '; });
        }
      });
      
      // If there's not enough text, skip the API call
      if (currentText.trim().split(/\s+/).length < 20) {
        setLoadingAutoSuggestion(false);
        return;
      }
        const response = await fetch('/api/journal/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          currentContent: currentText.trim(),
          type: 'continue'
        })
      });
      
      if (!response.ok) throw new Error('Failed to get suggestions');
      
      const data = await response.json();      if (data.suggestions && data.suggestions.length > 0) {
        const newSuggestion = data.suggestions[0];
        // Only update if it's different from current suggestion
        if (newSuggestion !== autoSuggestion) {
          setAutoSuggestion(newSuggestion);
          setIsAISuggestion(true);
          setShowAutoSuggestion(true);
        }
      }
    } catch (err) {
      console.error('Error getting auto suggestions:', err);
      // Fallback to default suggestion if AI fails
      if (!autoSuggestion) {
        setAutoSuggestion(getRandomDefaultSuggestion());
        setIsAISuggestion(false);
      }
    } finally {
      setLoadingAutoSuggestion(false);
    }
  };
    // Get writing suggestions for dialog
  const getWritingSuggestions = async (type = 'continue') => {
    setLoadingSuggestions(true);
    setSuggestions([]);
    
    try {
      let currentText = '';
      content.forEach(block => {
        if (block.content) currentText += block.content + ' ';
        if (Array.isArray(block.listItems)) {
          block.listItems.forEach(item => { if (item.content) currentText += ' - ' + item.content + ' '; });
        }
      });
      
      const response = await fetch('/api/journal/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentContent: currentText.trim(), type })
      });
      
      if (!response.ok) throw new Error('Failed to get suggestions');
      const data = await response.json();
      const newSuggestions = data.suggestions || [];
      setSuggestions(newSuggestions);
        // Update the auto suggestion with the first suggestion if available
      if (newSuggestions.length > 0 && newSuggestions[0] !== autoSuggestion) {
        setAutoSuggestion(newSuggestions[0]);
        setIsAISuggestion(true);
        setShowAutoSuggestion(true);
      }
      
      setSuggestionDialog(true);
    } catch (err) {
      console.error('Error getting writing suggestions:', err);
      setError('Failed to get writing suggestions. Please try again.');
    } finally {
      setLoadingSuggestions(false);
    }
  };
  
  // Use a suggestion by appending it to the current content
  const useSuggestion = (suggestion) => {
    const newBlock = { type: 'paragraph', content: suggestion };
    setContent(prevContent => [...prevContent, newBlock]);
    setSuggestionDialog(false);  };

  // Use the auto suggestion by appending it to the content
  const useAutoSuggestion = () => {
    const newBlock = { type: 'paragraph', content: autoSuggestion };
    setContent(prevContent => [...prevContent, newBlock]);
    // Get a new random suggestion after using one
    setAutoSuggestion(getRandomDefaultSuggestion());
  };

  // Get next suggestion
  const getNextSuggestion = () => {
    setAutoSuggestion(getRandomDefaultSuggestion());
  };
  
  // Improved text formatting with correct cursor placement and block updates
  const applyFormatting = (type) => {
    // Get active element - the input or textarea where user is typing
    const activeElement = document.activeElement;
    if (!activeElement || 
        (activeElement.tagName !== 'TEXTAREA' && 
         activeElement.tagName !== 'INPUT')) {
      return;
    }
    
    // Get selection range
    const start = activeElement.selectionStart;
    const end = activeElement.selectionEnd;
    const text = activeElement.value;
    const selectedText = text.substring(start, end);
    const hasSelection = start !== end;
    
    // Determine format markers and cursor position
    let prefix, suffix, cursorPosition;
    
    switch (type) {
      case 'bold':
        prefix = '**';
        suffix = '**';
        break;
      case 'italic':
        prefix = '*';
        suffix = '*';
        break;
      case 'underline':
        prefix = '__';
        suffix = '__';
        break;
      default:
        return;
    }
    
    // Format the text
    let newText;
    if (hasSelection) {
      // If text is selected, wrap it with format markers
      newText = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
      cursorPosition = end + prefix.length + suffix.length;
    } else {
      // If no text is selected, insert format markers and place cursor between them
      newText = text.substring(0, start) + prefix + suffix + text.substring(end);
      cursorPosition = start + prefix.length;
    }
    
    // Update the value
    activeElement.value = newText;
    
    // Trigger change event to update state
    const event = new Event('input', { bubbles: true });
    activeElement.dispatchEvent(event);
    
    // Update cursor position
    activeElement.focus();
    if (hasSelection) {
      activeElement.selectionStart = start;
      activeElement.selectionEnd = start + prefix.length + selectedText.length + suffix.length;
    } else {
      activeElement.selectionStart = cursorPosition;
      activeElement.selectionEnd = cursorPosition;
    }
    
    // Find and update the block in our content state
    const blockElement = activeElement.closest('[data-block-id]');
    if (blockElement) {
      const blockIndex = parseInt(blockElement.dataset.blockId);
      if (!isNaN(blockIndex) && blockIndex >= 0 && blockIndex < content.length) {
        const block = content[blockIndex];
        
        // Check if it's a list item
        const listItemElement = activeElement.closest('.list-item');
        if (listItemElement && block.type.includes('List') && block.listItems) {
          const itemIndex = parseInt(listItemElement.dataset.itemIndex);
          if (!isNaN(itemIndex) && itemIndex >= 0 && itemIndex < block.listItems.length) {
            // Update list item content
            const newListItems = [...block.listItems];
            newListItems[itemIndex] = { ...newListItems[itemIndex], content: newText };
            handleUpdateBlock(blockIndex, { ...block, listItems: newListItems });
          }
        } else {
          // Update normal block content
          handleUpdateBlock(blockIndex, { ...block, content: newText });
        }
      }
    }
  };

  // Handle deleting a block
  const handleDeleteBlock = (index) => {
    setContent(prevContent => prevContent.filter((_, i) => i !== index));
  };

  // Render a block based on its type
  const renderBlock = (block, index) => {
    switch (block.type) {
      case 'paragraph':
        return (
          <Box 
            key={index}
            className="journal-content-block"
            data-block-id={index}
            sx={{ 
              mb: 1.5,
              position: 'relative',
              '&:hover': {
                '& .block-actions': {
                  opacity: 1,
                }
              }
            }}
          >
            <TextField
              multiline
              fullWidth
              variant="standard"
              placeholder="Start writing..."
              value={block.content}
              onChange={(e) => handleUpdateBlock(index, { ...block, content: e.target.value })}
              onKeyDown={(e) => handleKeyDown(e, index, block)}
              InputProps={{
                disableUnderline: true,
                sx: {
                  fontSize: '1rem',
                  lineHeight: 1.6,
                  p: 1,
                  '&:focus': {
                    background: alpha(theme.palette.primary.light, 0.05)
                  }
                }
              }}
            />
          </Box>
        );
        
      case 'heading1':
      case 'heading2':
      case 'heading3':
        const fontSize = block.type === 'heading1' ? '1.8rem' : block.type === 'heading2' ? '1.5rem' : '1.2rem';
        const fontWeight = block.type === 'heading1' ? 700 : block.type === 'heading2' ? 600 : 500;
        
        return (
          <Box 
            key={index}
            className="journal-content-block"
            data-block-id={index}
            sx={{ 
              mb: 2,
              position: 'relative',
              '&:hover': {
                '& .block-actions': {
                  opacity: 1,
                }
              }
            }}
          >
            <TextField
              fullWidth
              variant="standard"
              placeholder={`${block.type.charAt(0).toUpperCase() + block.type.slice(1)}...`}
              value={block.content}
              onChange={(e) => handleUpdateBlock(index, { ...block, content: e.target.value })}
              onKeyDown={(e) => handleKeyDown(e, index, block)}
              InputProps={{
                disableUnderline: true,
                sx: {
                  fontSize,
                  fontWeight,
                  p: 1,
                  '&:focus': {
                    background: alpha(theme.palette.primary.light, 0.05)
                  }
                }
              }}
            />
          </Box>
        );
        
      case 'quote':
        return (
          <Box 
            key={index}
            className="journal-content-block"
            data-block-id={index}
            sx={{ 
              mb: 2,
              position: 'relative',
              '&:hover': {
                '& .block-actions': {
                  opacity: 1,
                }
              }
            }}
          >
            <TextField
              multiline
              fullWidth
              variant="standard"
              placeholder="Quote..."
              value={block.content}
              onChange={(e) => handleUpdateBlock(index, { ...block, content: e.target.value })}
              onKeyDown={(e) => handleKeyDown(e, index, block)}
              InputProps={{
                disableUnderline: true,
                sx: {
                  fontSize: '1rem',
                  fontStyle: 'italic',
                  borderLeft: `4px solid ${theme.palette.divider}`,
                  pl: 2,
                  py: 1,
                  '&:focus': {
                    background: alpha(theme.palette.primary.light, 0.05)
                  }
                }
              }}
            />
          </Box>
        );
          case 'bulletList':
      case 'numberedList':
        return (
          <Box key={index} className="journal-content-block" data-block-id={index} sx={{ pl: 3, mb: 2 }}>
            {block.listItems?.map((item, itemIndex) => (
              <Box key={itemIndex} className="list-item" data-item-index={itemIndex} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ mr: 1, width: 20, textAlign: 'center' }}>
                  {block.type === 'numberedList' ? `${itemIndex + 1}.` : '•'}
                </Typography>
                <TextField
                  fullWidth
                  variant="standard"
                  placeholder="List item..."
                  value={item.content}
                  onChange={(e) => {
                    const newListItems = [...block.listItems];
                    newListItems[itemIndex].content = e.target.value;
                    handleUpdateBlock(index, { ...block, listItems: newListItems });
                  }}
                  onKeyDown={(e) => handleKeyDown(e, index, block)}
                  InputProps={{
                    disableUnderline: true,
                    sx: {
                      '&:focus': {
                        background: alpha(theme.palette.primary.light, 0.05)
                      }
                    }
                  }}
                  className="list-item-input"
                />
                <IconButton 
                  size="small" 
                  onClick={() => {
                    const newListItems = [...block.listItems];
                    newListItems.splice(itemIndex, 1);
                    handleUpdateBlock(index, { ...block, listItems: newListItems });
                  }}
                  disabled={block.listItems.length <= 1}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            {/* Always add a paragraph after the list for continuation */}
            {index === content.length - 1 || content[index + 1]?.type !== 'paragraph' ? (
              <Button 
                startIcon={<AddCircleOutlineIcon />}
                onClick={() => {
                  // First add another list item
                  const newListItems = [...block.listItems, { content: '', checked: false }];
                  handleUpdateBlock(index, { ...block, listItems: newListItems });
                  
                  // Then ensure there's a paragraph after the list
                  if (index === content.length - 1 || content[index + 1]?.type !== 'paragraph') {
                    handleAddBlock('paragraph', index + 1);
                  }
                }}
                sx={{ ml: 3, mt: 1, textTransform: 'none' }}
              >
                Add Item
              </Button>
            ) : (
              <Button 
                startIcon={<AddCircleOutlineIcon />}
                onClick={() => {
                  const newListItems = [...block.listItems, { content: '', checked: false }];
                  handleUpdateBlock(index, { ...block, listItems: newListItems });
                }}
                sx={{ ml: 3, mt: 1, textTransform: 'none' }}
              >
                Add Item
              </Button>
            )}
          </Box>
        );
        
      case 'code':
        return (
          <Box 
            key={index}
            className="journal-content-block"
            data-block-id={index}
            sx={{ mb: 2 }}
          >
            <TextField
              multiline
              fullWidth
              variant="outlined"
              placeholder="Code snippet..."
              value={block.content}
              onChange={(e) => handleUpdateBlock(index, { ...block, content: e.target.value })}
              onKeyDown={(e) => handleKeyDown(e, index, block)}
              InputProps={{
                sx: {
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  bgcolor: alpha(theme.palette.text.primary, 0.04),
                }
              }}
            />
          </Box>
        );
        
      default:
        return null;
    }
  };

  // Return the editor component
  return (
    <Box>
      <Paper 
        elevation={0}
        sx={{ 
          p: 3,
          borderRadius: 2,
          boxShadow: 'none',
          minHeight: '60vh'
        }}
      >        {/* Header with date and actions */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}>
          <Box>
            <Typography variant="h6">
              {date.format('dddd, MMMM D, YYYY')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {calculateWordCount()} words
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton 
                onClick={handleManualMoodUpdate} 
                disabled={isManuallyUpdatingMood}
                size="small"
                sx={{ mr: 1 }}
              >
                <AutorenewIcon fontSize="small" />
              </IconButton>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MoodDisplay 
                  mood={entry?.mood || DEFAULT_MOOD} 
                  size="small" 
                  showLabel={true}
                  tooltipText="Click to update mood"
                  updating={isManuallyUpdatingMood}
                />
                
                {isManuallyUpdatingMood && (
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                    Analyzing...
                  </Typography>
                )}
              </Box>
            </Box>
            
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              onClick={() => handleSave(true)}
              disabled={isSaving || !hasChanges}
              sx={{ mr: 1 }}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          
            <Button 
              variant="outlined"
              color="primary"
              size="small"
              onClick={onClose}
            >
              Close
            </Button>
          </Box>
        </Box>
        
        {/* Journal title input */}        <TextField
          fullWidth
          placeholder="Title (optional)"
          variant="standard"
          value={title}
          onChange={(e) => {
            // Set typing flag to prevent content override
            setIsUserTyping(true);
            
            // Clear existing typing timer
            if (typingTimer.current) clearTimeout(typingTimer.current);
            
            // Set timer to reset typing flag after user stops typing
            typingTimer.current = setTimeout(() => {
              setIsUserTyping(false);
            }, 5000); // 5 seconds after stopping typing
            
            setTitle(e.target.value);
          }}
          InputProps={{
            disableUnderline: true,
            sx: {
              fontSize: '1.8rem',
              fontWeight: 700,
              mb: 3,
              '&::placeholder': {
                color: alpha(theme.palette.text.primary, 0.4)
              }
            }
          }}
        />
        
        {/* Empty state hint for new users */}
        {content.length === 1 && !content[0].content && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 2,
              backgroundColor: alpha(theme.palette.info.light, 0.1),
              border: `1px dashed ${alpha(theme.palette.info.main, 0.3)}`,
              borderRadius: 1
            }}
          >
            <Typography variant="subtitle1" color="primary" gutterBottom fontWeight={500}>
              Welcome to your journal!
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              <b>Editing tips:</b> Press Enter to create a new paragraph. Use Shift+Enter for a line break within the same block. 
              Select text to format it as bold, italic, or underlined using the toolbar above.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Don't know what to write? Start typing and suggestions will appear at the bottom to inspire you.
            </Typography>
          </Paper>
        )}
        
        <Box>
          <Paper 
            variant="outlined" 
            sx={{ 
              mb: 3, 
              borderRadius: 1, 
              overflow: 'hidden',
              borderColor: theme.palette.divider
            }}
          >
            <Box className={styles.editorToolbar}>
              <Tooltip title="Heading 1">
                <IconButton size="small" onClick={() => handleAddBlock('heading1')}>
                  <TitleIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Heading 2">
                <IconButton size="small" onClick={() => handleAddBlock('heading2')}>
                  <TitleIcon sx={{ transform: 'scale(0.85)' }} />
                </IconButton>
              </Tooltip>
              
              {/* <div className={styles.toolbarDivider} /> */}
              
              {/* <Tooltip title="Bold">
                <IconButton size="small" onClick={() => applyFormatting('bold')}>
                  <FormatBoldIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Italic">
                <IconButton size="small" onClick={() => applyFormatting('italic')}>
                  <FormatItalicIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Underline">
                <IconButton size="small" onClick={() => applyFormatting('underline')}>
                  <FormatUnderlinedIcon />
                </IconButton>
              </Tooltip> */}
              
              <div className={styles.toolbarDivider} />
              
              <Tooltip title="Bulleted List">
                <IconButton size="small" onClick={() => handleAddBlock('bulletList')}>
                  <FormatListBulletedIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Numbered List">
                <IconButton size="small" onClick={() => handleAddBlock('numberedList')}>
                  <FormatListNumberedIcon />
                </IconButton>
              </Tooltip>
              
              <div className={styles.toolbarDivider} />
              
              <Tooltip title="Quote">
                <IconButton size="small" onClick={() => handleAddBlock('quote')}>
                  <FormatQuoteIcon />
                </IconButton>
              </Tooltip>
              
              <div className={styles.toolbarDivider} />
                <Tooltip title="Get writing suggestions">
                <IconButton 
                  size="small" 
                  onClick={() => getWritingSuggestions('question')}
                  disabled={loadingSuggestions}
                  color="secondary"
                >
                  <LightbulbOutlinedIcon />
                </IconButton>
              </Tooltip>
            </Box>
            
            {/* Content blocks */}
            <Box sx={{ p: 2, minHeight: '40vh', position: 'relative' }}>
              {content.map((block, index) => renderBlock(block, index))}
            </Box>
          </Paper>
        </Box>
      </Paper>
      
      {/* Writing suggestions dialog */}
      <Dialog 
        open={suggestionDialog} 
        onClose={() => setSuggestionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Writing Suggestions
          <IconButton
            aria-label="close"
            onClick={() => setSuggestionDialog(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Click on any suggestion to add it to your journal entry.
          </Typography>
          
          {suggestions.map((suggestion, index) => (
            <Paper
              key={index}
              elevation={0}
              className={styles.suggestionCard}
              onClick={() => useSuggestion(suggestion)}
            >
              <Typography variant="body1">{suggestion}</Typography>
            </Paper>
          ))}
          
          {suggestions.length === 0 && !loadingSuggestions && (
            <Typography variant="body2" color="textSecondary" align="center">
              No suggestions available. Try again with more content.
            </Typography>
          )}
          
          {loadingSuggestions && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={30} />
            </Box>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Error snackbar */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError('')} severity="error">
          {error}
        </Alert>
      </Snackbar>      {/* Beautiful Quote-like Auto suggestion footer */}
      {showAutoSuggestion && (
        <Paper 
          elevation={3}
          sx={{ 
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,            zIndex: 1000,
            background: theme.palette.background.paper, // Pure white background
            borderTop: `3px solid ${theme.palette.primary.main}`,
            boxShadow: `0 -8px 32px ${alpha(theme.palette.primary.main, 0.12)}`,
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            maxHeight: '120px',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            }
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            p: 3,
            position: 'relative',
            ...(isMobile && {
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 2,
              p: 2
            })
          }}>
            {/* Quote-like left section */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: 1.5, 
              flex: 1, 
              minWidth: 0,
              position: 'relative',
              width: isMobile ? '100%' : 'auto'
            }}>
              {/* Opening quote mark */}
              <Typography
                sx={{
                  fontSize: isMobile ? '2rem' : '2.5rem',
                  color: theme.palette.primary.main,
                  fontFamily: 'Georgia, serif',
                  lineHeight: 1,
                  opacity: 0.6,
                  mt: -0.5,
                  mr: -0.5,
                  flexShrink: 0
                }}
              >
                "
              </Typography>
              
              <Box sx={{ flex: 1, minWidth: 0, pt: 0.5 }}>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: theme.palette.text.primary,
                    fontStyle: 'italic',
                    lineHeight: 1.5,
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    fontFamily: 'Georgia, serif',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: isMobile ? 3 : 2,
                    WebkitBoxOrient: 'vertical',
                    position: 'relative',
                    pr: 2,
    
                  }}
                >
                  {autoSuggestion.length > (isMobile ? 100 : 150) 
                    ? `${autoSuggestion.substring(0, isMobile ? 100 : 150)}...` 
                    : autoSuggestion}
                </Typography>
                
             
              </Box>
            </Box>
            
            {/* Action buttons */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5, 
              flexShrink: 0,
              ...(isMobile && {
                width: '100%',
                justifyContent: 'flex-end',
                mt: -0.5
              })
            }}>              <Button 
                variant="outlined" 
                size="small" 
                onClick={fetchAutoSuggestion}
                sx={{
                  borderRadius: '25px',
                  textTransform: 'none',
                  color: theme.palette.primary.main,
                  borderColor: alpha(theme.palette.primary.main, 0.5),
                  minWidth: 'auto',
                  px: 2,
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    borderColor: theme.palette.primary.main,
                  }
                }}
              >
               {autoSuggestion === 'Let your thoughts flow — fresh writing prompts appear every 30 seconds to guide your journey.' ? 'Get Ideas Now' : 'More Ideas'}
              </Button>
              
              <Button 
                variant="contained" 
                size="small" 
                color="primary"
                onClick={useAutoSuggestion}
                startIcon={<AddCircleOutlineIcon sx={{ fontSize: '1rem' }} />}
                sx={{
                  borderRadius: '25px',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 2.5,
                  fontSize: '0.85rem',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  boxShadow: `0 3px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                    transform: 'translateY(-1px)',
                    boxShadow: `0 5px 16px ${alpha(theme.palette.primary.main, 0.4)}`
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Add to Journal
              </Button>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default JournalEditor;
