// components/planner/PlannerSidebar.js
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  Button, 
  Typography, 
  TextField, 
  CircularProgress, 
  IconButton, 
  Collapse, 
  useTheme, 
  alpha,
  Tooltip 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';

const PlannerSidebar = ({ currentPageId }) => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [expandedItems, setExpandedItems] = useState({});
  const router = useRouter();
  const theme = useTheme();

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/planner');
      
      if (!res.ok) {
        throw new Error('Failed to fetch pages');
      }
      
      const data = await res.json();
      setPages(data);
      
      // Expand the parent of the current page
      if (currentPageId) {
        const currentPage = data.find(page => 
          page._id === currentPageId || page.childPages?.some(child => child === currentPageId)
        );
        if (currentPage) {
          setExpandedItems(prev => ({ ...prev, [currentPage._id]: true }));
        }
      }
    } catch (error) {
      console.error('Error fetching planner pages:', error);
      setError('Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePage = async () => {
    if (!newPageTitle.trim()) return;
    
    try {
      setLoading(true);
      const res = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newPageTitle }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to create page');
      }
      
      const newPage = await res.json();
      setPages(prev => [...prev, newPage]);
      setNewPageTitle('');
      setIsCreating(false);
      
      // Navigate to the new page
      router.push(`/planner/${newPage._id}`);
    } catch (error) {
      console.error('Error creating page:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExpand = (pageId) => {
    setExpandedItems(prev => ({ 
      ...prev, 
      [pageId]: !prev[pageId] 
    }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} sx={{ color: theme.palette.primary.main }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography color="error" sx={{ fontSize: '0.9rem' }}>{error}</Typography>
        <Button 
          onClick={fetchPages} 
          size="small" 
          sx={{ 
            mt: 1,
            textTransform: 'none',
            borderRadius: '8px'
          }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  // Function to render tree items recursively
  const renderPageTree = (pageList, parentId = null) => {
    const filteredPages = pageList.filter(page => {
      return parentId === null 
        ? !page.parentId 
        : page.parentId === parentId;
    });

    return (
      <List 
        sx={{ 
          pl: parentId ? 2 : 0,
          my: 0,
          py: 0
        }}
        dense
      >
        {filteredPages.map((page) => {
          const hasChildren = pageList.some(p => p.parentId === page._id);
          const isExpanded = expandedItems[page._id];
          const isActive = page._id === currentPageId;

          return (
            <Box component={motion.div} key={page._id} layout>
              <ListItem 
                disablePadding 
                sx={{ 
                  display: 'block',
                  mb: 0.5,
                }}
              >
                <ListItemButton
                  onClick={() => router.push(`/planner/${page._id}`)}
                  sx={{
                    borderRadius: '8px',
                    py: 0.75,
                    px: 1.5,
                    backgroundColor: isActive ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                    color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
                    fontWeight: isActive ? 600 : 400,
                    position: 'relative',
                    '&:hover': {
                      backgroundColor: isActive 
                        ? alpha(theme.palette.primary.main, 0.15)
                        : alpha(theme.palette.action.hover, 0.1),
                    },
                    '&::after': isActive ? {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '4px',
                      height: '50%',
                      borderRadius: '0 4px 4px 0',
                      background: 'linear-gradient(to bottom, #4263EB, #9370DB)',
                    } : {}
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    {hasChildren && (
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleExpand(page._id);
                        }}
                        size="small"
                        sx={{ 
                          mr: 0.5,
                          p: 0.5,
                          color: isActive ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.7),
                        }}
                      >
                        {isExpanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
                      </IconButton>
                    )}
                    
                    {!hasChildren && (
                      <Box sx={{ 
                        ml: 0.5,
                        mr: 1.5, 
                        display: 'flex',
                        color: isActive ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.6),
                      }}>
                        <DescriptionOutlinedIcon fontSize="small" />
                      </Box>
                    )}
                    
                    {hasChildren && (
                      <Box sx={{ 
                        mr: 1, 
                        display: 'flex',
                        color: isActive ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.6),
                      }}>
                        <FolderOutlinedIcon fontSize="small" />
                      </Box>
                    )}
                    
                    <ListItemText 
                      primary={page.title}
                      primaryTypographyProps={{
                        noWrap: true,
                        fontWeight: isActive ? 600 : 400,
                        fontSize: '0.9rem',
                        color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
                      }}
                    />
                  </Box>
                </ListItemButton>
                
                {hasChildren && (
                  <Collapse in={expandedItems[page._id]} timeout="auto" unmountOnExit>
                    {renderPageTree(pageList, page._id)}
                  </Collapse>
                )}
              </ListItem>
            </Box>
          );
        })}
      </List>
    );
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
          PAGES
        </Typography>
        <Tooltip title="New Page">
          <IconButton 
            size="small" 
            onClick={() => setIsCreating(true)} 
            sx={{ 
              color: theme.palette.primary.main,
              p: 0.5,
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.15),
              }
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {isCreating && (
        <Box sx={{ mb: 2, mt: 1 }}>
          <TextField
            size="small"
            placeholder="Page name"
            value={newPageTitle}
            onChange={(e) => setNewPageTitle(e.target.value)}
            fullWidth
            autoFocus
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreatePage();
              }
            }}
            InputProps={{
              sx: { borderRadius: '8px', fontSize: '0.9rem' }
            }}
            sx={{ mb: 1 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button 
              size="small" 
              onClick={() => setIsCreating(false)}
              sx={{ textTransform: 'none', fontWeight: 500, fontSize: '0.8rem' }}
            >
              Cancel
            </Button>
            <Button 
              size="small" 
              variant="contained" 
              onClick={handleCreatePage}
              disabled={!newPageTitle.trim()}
              sx={{ 
                textTransform: 'none', 
                fontWeight: 500, 
                fontSize: '0.8rem',
                borderRadius: '6px',
                background: 'linear-gradient(to right, #4263EB, #9370DB)',
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: '0 4px 8px rgba(66, 99, 235, 0.2)',
                }
              }}
            >
              Create
            </Button>
          </Box>
        </Box>
      )}

      {pages.length === 0 ? (
        <Box sx={{ py: 2, px: 1 }}>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ fontSize: '0.9rem', mb: 1 }}
          >
            No pages yet
          </Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={() => setIsCreating(true)}
            size="small"
            sx={{ 
              textTransform: 'none',
              fontSize: '0.85rem',
              borderRadius: '8px',
              fontWeight: 500
            }}
          >
            Create your first page
          </Button>
        </Box>
      ) : (
        <AnimatePresence>
          {renderPageTree(pages)}
        </AnimatePresence>
      )}
      
      <Box sx={{ mt: 4, pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.6)}` }}>
        <Button
          fullWidth
          startIcon={<AddIcon />}
          onClick={() => setIsCreating(true)}
          sx={{
            justifyContent: 'flex-start',
            textTransform: 'none',
            color: alpha(theme.palette.text.primary, 0.7),
            borderRadius: '8px',
            py: 0.75,
            '&:hover': {
              backgroundColor: alpha(theme.palette.action.hover, 0.08),
              color: theme.palette.primary.main
            }
          }}
        >
          New Page
        </Button>
      </Box>
    </>
  );
};

export default PlannerSidebar;
