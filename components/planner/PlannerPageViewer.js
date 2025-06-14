// components/planner/PlannerPageViewer.js
import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useRouter } from 'next/router';
import PlannerContentEditor from './PlannerContentEditor';
import styles from './PlannerStyles.module.css';
import { motion } from 'framer-motion';

const PlannerPageViewer = ({ pageId }) => {
  const [page, setPage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ title: '', description: '', content: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch page data
  useEffect(() => {
    if (!pageId) return;
    
    const fetchPage = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch(`/api/planner/${pageId}`);
        
        if (!res.ok) {
          throw new Error(`Failed to fetch page: ${res.status}`);
        }
        
        const data = await res.json();
        setPage(data);
        
        // Set initial edit data
        setEditData({
          title: data.title,
          description: data.description || '',
          content: data.content || [],
        });
        
        // Build breadcrumbs
        await buildBreadcrumbs(data.parentId);
      } catch (error) {
        console.error('Error fetching page:', error);
        setError('Failed to load page');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPage();
  }, [pageId]);

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
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving page:', error);
      setError('Failed to save changes');
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

  // Handle content changes
  const handleContentChange = (newContent) => {
    setEditData({ ...editData, content: newContent });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditData({
      title: page.title,
      description: page.description || '',
      content: page.content || [],
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
      <Alert severity="error" sx={{ mb: 4 }}>
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
        sx={{
          p: { xs: 2, sm: 3 },
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '12px',
          mb: 4,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box sx={{ flex: 1 }}>            {isEditing ? (
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
                      },
                    }
                  }}
                  sx={{ mb: 1 }}
                />
              </>
            ) : (
              <>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700,
                    fontSize: '1.75rem',
                    letterSpacing: '-0.01em',
                    background: 'linear-gradient(to right, #4263EB, #9370DB)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    display: 'inline-block',
                    pb: 0.5,
                  }}
                >
                  {page.title}
                </Typography>
              </>
            )}
          </Box>
          
          {!isEditing ? (
            <Box>              <IconButton 
                onClick={() => setIsEditing(true)}
                sx={{ mr: 1 }}
                title="Edit page"
              >
                <EditIcon />
              </IconButton>
              
              <IconButton 
                onClick={() => setDeleteDialogOpen(true)}
                color="error"
                title="Delete page"
              >
                <DeleteOutlineIcon />
              </IconButton>
            </Box>
          ) : (
            <Box>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saveLoading || !editData.title.trim()}
                sx={{ mr: 1 }}
              >
                Save
              </Button>
              
              <IconButton onClick={handleCancelEdit}>
                <CloseIcon />
              </IconButton>
            </Box>
          )}
        </Box>
        
        {/* Divider */}
        <Box 
          sx={{ 
            height: 1,
            bgcolor: theme.palette.divider,
            mb: 3
          }}
        />
        {/* Page content */}
        <PlannerContentEditor
          content={isEditing ? editData.content : page.content || []}
          onChange={handleContentChange}
          readOnly={!isEditing}
          onSave={isEditing ? handleSave : null}
        />
      </Paper>

      {/* Child pages */}
      {page.childPages && page.childPages.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Linked Pages
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {page.childPages.map((childPage) => (
              <Paper
                key={childPage._id}
                elevation={0}
                sx={{
                  p: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: '8px',
                  width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.33% - 11px)' },
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.07)',
                    borderColor: 'primary.main',
                  },
                }}
                onClick={() => router.push(`/planner/${childPage._id}`)}
              >
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  {childPage.title}
                </Typography>
                
                {childPage.description && (
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {childPage.description}
                  </Typography>
                )}
              </Paper>
            ))}
          </Box>
        </Box>
      )}
      
      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Page</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{page.title}</strong>?
            {page.childPages && page.childPages.length > 0 && (
              <Box component="span" sx={{ display: 'block', mt: 1, color: 'error.main', fontWeight: 500 }}>
                This will also delete {page.childPages.length} linked page(s).
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlannerPageViewer;
