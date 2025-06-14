// components/planner/PlannerCard.js
import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  useTheme,
  alpha
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';

const PlannerCard = ({ page, onDelete, index }) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const theme = useTheme();
  const router = useRouter();
  const delay = index * 0.05;

  // Generate a snippet from page content
  const generateSnippet = () => {
    if (!page.content || page.content.length === 0) return '';
    
    // Try to find the first body text block
    const bodyBlock = page.content.find(block => 
      ['body1', 'body2', 'body3'].includes(block.type)
    );
    
    if (bodyBlock && bodyBlock.content) {
      return bodyBlock.content.substring(0, 100) + (bodyBlock.content.length > 100 ? '...' : '');
    }
    
    // If no body block, try a list item
    const listBlock = page.content.find(block => 
      ['bulletedList', 'numberedList'].includes(block.type) && 
      block.listItems && 
      block.listItems.length > 0
    );
    
    if (listBlock) {
      return listBlock.listItems.slice(0, 2)
        .map(item => `• ${item.content}`)
        .join(', ') + (listBlock.listItems.length > 2 ? '...' : '');
    }
    
    return '';
  };

  const handleCardClick = (e) => {
    if (e.target.closest('button')) return; // Don't navigate if clicking on a button
    router.push(`/planner/${page._id}`);
  };

  const handleDelete = async () => {
    setDeleteDialogOpen(false);
    if (onDelete) {
      onDelete(page._id);
    }
  };

  const handleEdit = () => {
    router.push(`/planner/${page._id}`);
  };

  const snippet = page.snippet || generateSnippet();

  return (
    <>
      <Paper
        component={motion.div}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay }}
        elevation={0}
        onClick={handleCardClick}
        sx={{
          p: { xs: 2, sm: 2.5 },
          height: '100%',
          cursor: 'pointer',
          borderRadius: '12px',
          border: '1px solid',
          borderColor: alpha(theme.palette.divider, 0.6),
          transition: 'all 0.2s ease',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '4px',
            height: '100%',
            background: 'linear-gradient(to bottom, #4263EB, #9370DB)',
          },
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: '0 8px 15px rgba(0,0,0,0.08)',
            borderColor: alpha(theme.palette.primary.main, 0.3),
          }
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          pl: 1.5
        }}>
          <Typography 
            variant="h6" 
            gutterBottom 
            sx={{ 
              fontWeight: 600,
              background: 'linear-gradient(135deg, #4263EB, #9370DB)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              pr: 5, // Space for action buttons
              wordBreak: 'break-word',
              mb: 1
            }}
          >
            {page.title}
          </Typography>

          <Box sx={{ position: 'absolute', top: '8px', right: '8px', display: 'flex' }}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
              sx={{ 
                fontSize: '0.9rem',
                color: theme.palette.text.secondary,
                '&:hover': { color: theme.palette.primary.main }
              }}
            >
              <EditIcon fontSize="inherit" />
            </IconButton>

            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteDialogOpen(true);
              }}
              sx={{ 
                fontSize: '0.9rem',
                color: theme.palette.text.secondary,
                '&:hover': { color: theme.palette.error.main }
              }}
            >
              <DeleteOutlineIcon fontSize="inherit" />
            </IconButton>
          </Box>
        </Box>

        {snippet && (
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              pl: 1.5, 
              opacity: 0.8,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              lineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {snippet}
          </Typography>
        )}

        {page.childPages && page.childPages.length > 0 && (
          <Box sx={{ mt: 'auto', pt: 1.5, pl: 1.5 }}>
            <Typography 
              variant="caption"
              sx={{
                bgcolor: alpha(theme.palette.info.main, 0.1),
                color: theme.palette.info.dark,
                px: 1,
                py: 0.5,
                borderRadius: '4px',
                fontWeight: 500
              }}
            >
              {page.childPages.length} linked {page.childPages.length === 1 ? 'page' : 'pages'}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Page</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{page.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PlannerCard;
