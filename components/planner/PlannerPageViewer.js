// components/planner/PlannerPageViewer.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Button,
  TextField,
  Skeleton,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Breadcrumbs,
  Link,
  useTheme,
  alpha,
  useMediaQuery,
  Chip,
  Snackbar,
  Fade,
  Slide,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useRouter } from 'next/router';
import PlannerContentEditor from './PlannerContentEditor';
import styles from './PlannerStyles.module.css';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { countWordsInLexicalContent } from '@/utils/plannerUtils';

const PlannerPageViewer = ({ pageId }) => {
  const [page, setPage] = useState(null);
  const [isEditing, setIsEditing] = useState(true); // Default to edit mode
  const [editData, setEditData] = useState({ title: '', description: '', content: { editorState: null } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveFeedbackOpen, setSaveFeedbackOpen] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Fetch page data
  useEffect(() => {
    if (!pageId) return;
    
    const fetchPage = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/planner/${pageId}`);
        
        if (!res.ok) {
          throw new Error(`Failed to fetch page: ${res.status}`);
        }
          const data = await res.json();
        setPage(data);
        
        // Validate that we have proper editorState data
        let editorState = null;
        if (data.content && data.content.editorState) {
          // Make sure editorState is valid JSON
          try {
            if (typeof data.content.editorState === 'string') {
              const parsed = JSON.parse(data.content.editorState);
              if (parsed && parsed.root) {
                editorState = data.content.editorState;
                console.log('Valid editor state found in API response');
              } else {
                console.warn('Invalid editor state structure in API response');
                editorState = null;
              }
            } else {
              console.warn('Editor state is not a string in API response');
              editorState = null;
            }
          } catch (e) {
            console.error('Failed to parse editor state from API:', e);
            editorState = null;
          }
        }
        
        // Set initial edit data
        setEditData({
          title: data.title,
          description: data.description || '',
          content: { 
            editorState: editorState
          },
        });
        
        // Calculate word count if content exists
        if (data.content?.editorState) {
          try {
            const count = countWordsInLexicalContent(data.content.editorState);
            setWordCount(count);
          } catch (e) {
            console.warn('Error calculating initial word count:', e);
          }
        }
        
        // Build breadcrumbs
        await buildBreadcrumbs(data.parentId);
      } catch (error) {
        console.error('Error fetching page:', error);
        setError('Failed to load page');
        // Redirect back to planner home after 2 seconds on error
        setTimeout(() => {
          router.push('/planner');
        }, 2000);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPage();
  }, [pageId]);

  // Handle content changes to update word count
  const handleContentChange = useCallback((newContent) => {
    setEditData(prev => ({ ...prev, content: newContent }));
    
    // Update word count
    if (newContent?.editorState) {
      try {
        const count = countWordsInLexicalContent(newContent.editorState);
        setWordCount(count);
      } catch (e) {
        console.warn('Error calculating word count on change:', e);
      }
    }
  }, []);

  // Build breadcrumb trail
  const buildBreadcrumbs = async (parentId) => {
    if (!parentId) {
      setBreadcrumbs([]);
      return;
    }
    
    try {
      const crumbs = [];
      let currentParentId = parentId;
      
      // Follow the parent chain up to 5 levels to avoid infinite loops
      for (let i = 0; i < 5; i++) {
        if (!currentParentId) break;
        
        const res = await fetch(`/api/planner/${currentParentId}`);
        
        if (!res.ok) break;
        
        const parent = await res.json();
        crumbs.unshift({ id: parent._id, title: parent.title });
        
        currentParentId = parent.parentId;
      }
      
      setBreadcrumbs(crumbs);
    } catch (error) {
      console.error('Error building breadcrumbs:', error);
    }
  };

  // Handle saving edits
  const handleSave = async () => {
    if (!editData.title.trim()) {
      return;
    }
    
    try {
      setSaveLoading(true);
      setError(null);
      
      const res = await fetch(`/api/planner/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      
      if (!res.ok) {
        throw new Error('Failed to save page');
      }
      
      const updatedPage = await res.json();
      setPage(updatedPage);
      
      // Also update the edit data to reflect the saved changes
      setEditData({
        title: updatedPage.title,
        description: updatedPage.description || '',
        content: {
          editorState: updatedPage.content?.editorState || null
        }
      });
      
      // Show save success feedback
      setSaveSuccess(true);
      setSaveFeedbackOpen(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveFeedbackOpen(false);
      }, 3000);
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving page:', error);
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  // Handle deleting the page
  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/planner/${pageId}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        throw new Error('Failed to delete page');
      }
      
      setDeleteDialogOpen(false);
      
      // Navigate to parent page if it exists, or to planner home
      if (page.parentId) {
        router.push(`/planner/${page.parentId}`);
      } else {
        router.push('/planner');
      }
    } catch (error) {
      console.error('Error deleting page:', error);
      setError('Failed to delete page');
    }
  };

  // Auto-save function using the PlannerContentEditor's onSave prop
  const handleAutoSave = async (contentUpdate) => {
    if (!editData.title.trim()) {
      return Promise.reject(new Error('Page title cannot be empty'));
    }
    
    try {
      const payload = {
        ...editData,
        content: contentUpdate
      };
      
      const res = await fetch(`/api/planner/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        throw new Error(`Failed to save page: ${res.status}`);
      }
      
      const updatedPage = await res.json();
      setPage(updatedPage);
      
      // Update edit data with the latest saved version
      setEditData(prev => ({
        ...prev,
        content: {
          editorState: updatedPage.content?.editorState || null
        }
      }));
      
      // Show brief save success feedback
      setSaveSuccess(true);
      setSaveFeedbackOpen(true);
      
      // Hide success message after 2 seconds
      setTimeout(() => {
        setSaveFeedbackOpen(false);
      }, 2000);
      
      return updatedPage;
    } catch (error) {
      console.error('Error auto-saving page:', error);
      setError('Auto-save failed. Your changes may not be saved.');
      throw error;
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditData({
      title: page.title,
      description: page.description || '',
      content: {
        editorState: page.content?.editorState || null
      }
    });
    setIsEditing(false);
  };

  // Loading state
  if (loading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={20} width="60%" sx={{ mb: 4 }} />
        
        {[1, 2, 3].map((i) => (
          <Box key={i} sx={{ mb: 3 }}>
            <Skeleton variant="rectangular" height={24} width="80%" sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" height={18} width="90%" sx={{ mb: 0.5 }} />
            <Skeleton variant="rectangular" height={18} width="85%" />
          </Box>
        ))}
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ mb: 4 }}
        action={
          <Button color="inherit" size="small" onClick={() => setError(null)}>
            Dismiss
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  // If no page found
  if (!page) {
    return (
      <Alert severity="info" sx={{ mb: 4 }}>
        Page not found
      </Alert>
    );
  }

  return (
    <Box>
      {/* Breadcrumbs navigation */}
      {breadcrumbs.length > 0 && (
        <Breadcrumbs 
          separator={<NavigateNextIcon fontSize="small" />} 
          sx={{ mb: 3, color: 'text.secondary' }}
        >
          <Link 
            color="inherit" 
            href="/planner" 
            onClick={(e) => {
              e.preventDefault();
              router.push('/planner');
            }}
            sx={{ 
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' } 
            }}
          >
            Planner
          </Link>
          
          {breadcrumbs.map((crumb, index) => (
            <Link
              key={crumb.id}
              color={index === breadcrumbs.length - 1 ? 'primary' : 'inherit'}
              href={`/planner/${crumb.id}`}
              onClick={(e) => {
                e.preventDefault();
                router.push(`/planner/${crumb.id}`);
              }}
              sx={{ 
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' } 
              }}
            >
              {crumb.title}
            </Link>
          ))}
        </Breadcrumbs>
      )}

      <Paper
        elevation={0}
        component={motion.div}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        sx={{
          p: { xs: 2, sm: 3 },
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '12px',
          mb: 4,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box sx={{ flex: 1 }}>
            {isEditing ? (
              <>
                <TextField
                  fullWidth
                  placeholder="Page title"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  required
                  variant="standard"
                  InputProps={{
                    sx: { 
                      fontSize: '1.75rem',
                      fontWeight: 700,
                      letterSpacing: '-0.01em',
                      '&::before': {
                        display: 'none',
                      },
                      '&::after': {
                        display: 'none',
                      }
                    }
                  }}
                  autoFocus
                />
                {!editData.title.trim() && (
                  <Typography variant="caption" color="error">
                    Title is required
                  </Typography>
                )}
              </>
            ) : (
              <Typography 
                variant="h4" 
                component="h1"
                sx={{ 
                  fontWeight: 700,
                  wordBreak: 'break-word',
                  letterSpacing: '-0.01em'
                }}
              >
                {page.title}
              </Typography>
            )}
            
            {isEditing ? (
              <TextField
                fullWidth
                placeholder="Add a description (optional)"
                value={editData.description || ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                variant="standard"
                sx={{ mt: 1 }}
                InputProps={{
                  sx: { 
                    fontSize: '1rem',
                    color: 'text.secondary',
                    '&::before': {
                      display: 'none',
                    },
                    '&::after': {
                      display: 'none',
                    }
                  }
                }}
              />
            ) : (
              page.description && (
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: 'text.secondary',
                    mt: 1
                  }}
                >
                  {page.description}
                </Typography>
              )
            )}
            
            {/* Page metadata */}
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              mt: 2, 
              flexWrap: 'wrap',
              color: alpha(theme.palette.text.primary, 0.6),
              fontSize: '0.875rem'
            }}>
              {/* Created date */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CalendarTodayIcon fontSize="small" />
                <Typography variant="caption">
                  Created {page.createdAt ? format(new Date(page.createdAt), 'MMM d, yyyy') : 'Just now'}
                </Typography>
              </Box>
              
              {/* Last updated */}
              {page.updatedAt && page.updatedAt !== page.createdAt && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AccessTimeIcon fontSize="small" />
                  <Typography variant="caption">
                    Updated {format(new Date(page.updatedAt), 'MMM d, yyyy')}
                  </Typography>
                </Box>
              )}
              
              {/* Word count */}
              <Chip 
                size="small" 
                label={`${wordCount} words`}
                sx={{ 
                  height: 20,
                  fontSize: '0.75rem',
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  '.MuiChip-label': { px: 1 }
                }} 
              />
            </Box>
          </Box>
          
          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
            {!isEditing ? (
              <>
                <Tooltip title="Edit page">
                  <IconButton onClick={() => setIsEditing(true)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete page">
                  <IconButton color="error" onClick={() => setDeleteDialogOpen(true)}>
                    <DeleteOutlineIcon />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSave}
                  disabled={!editData.title.trim() || saveLoading}
                  startIcon={saveLoading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                >
                  {saveLoading ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleCancelEdit}
                  disabled={saveLoading}
                >
                  Cancel
                </Button>
              </>
            )}
          </Box>
        </Box>        <Box sx={{ mt: 4 }}>
          {editData.content && (
            <PlannerContentEditor
              key={`editor-${pageId}-${!!editData.content.editorState}`}
              content={editData.content}
              onChange={handleContentChange}
              readOnly={!isEditing}
              onSave={handleAutoSave}
            />
          )}
        </Box>
      </Paper>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete this page?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{page.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Save feedback snackbar */}
      <Snackbar
        open={saveFeedbackOpen}
        autoHideDuration={2000}
        onClose={() => setSaveFeedbackOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={Slide}
      >
        <Paper
          sx={{
            py: 0.75,
            px: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            backgroundColor: alpha(theme.palette.success.main, 0.9),
            color: 'white',
            borderRadius: 2
          }}
        >
          <CloudDoneIcon fontSize="small" />
          <Typography variant="body2">Changes saved successfully</Typography>
        </Paper>
      </Snackbar>
    </Box>
  );
};

export default PlannerPageViewer;
