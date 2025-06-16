import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Box, 
  Drawer, 
  IconButton, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Toolbar, 
  Typography, 
  Container, 
  Divider,
  useMediaQuery,
  useTheme,
  Button,
  Avatar,
  Tooltip,
  styled
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import BookRoundedIcon from '@mui/icons-material/BookRounded';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { alpha } from '@mui/system';

const drawerWidth = 270;

// Custom styled components
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backdropFilter: 'blur(20px)',
  backgroundColor: alpha(theme.palette.background.paper, 0.85),
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.03)',
  color: theme.palette.text.primary,
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  transition: 'all 0.3s ease'
}));

const Logo = styled(Box)(({ theme }) => ({
  fontWeight: 800,
  fontSize: '1.5rem',
  background: 'linear-gradient(135deg, #4263EB 0%, #9370DB 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  display: 'flex',
  alignItems: 'center',
  letterSpacing: '-0.02em'
}));

const NavItem = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'active',
})(({ theme, active }) => ({
  color: active ? theme.palette.primary.main : theme.palette.text.secondary,
  fontWeight: active ? 700 : 500,
  fontSize: '0.95rem',
  padding: theme.spacing(1.5, 2.5),
  margin: theme.spacing(0, 0.5),
  borderRadius: '12px',
  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    transform: 'translateY(-2px)',
  },
  '&:after': active ? {
    content: '""',
    position: 'absolute',
    bottom: '8px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '20px',
    height: '3px',
    borderRadius: '4px',
    background: 'linear-gradient(90deg, #4263EB, #9370DB)'
  } : {}
}));

const NavItemDrawer = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== 'active',
})(({ theme, active }) => ({
  borderRadius: '12px',
  margin: theme.spacing(0.5, 1),
  color: active ? theme.palette.primary.main : theme.palette.text.secondary,
  fontWeight: active ? 600 : 500,
  backgroundColor: active ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08)
  }
}));

// Navigation items
const navItems = [  { text: 'Home', icon: <HomeRoundedIcon />, path: '/' },
  { text: 'Planner', icon: <EditRoundedIcon />, path: '/planner' },
  { text: 'Journal', icon: <BookRoundedIcon />, path: '/journal' },
  { text: 'Progress', icon: <TimelineRoundedIcon />, path: '/progress' },
  { text: 'Settings', icon: <SettingsRoundedIcon />, path: '/settings' }
];

export default function Layout({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState('/');
  useEffect(() => {
    // Set active tab based on current route
    setActiveTab(router.pathname);
  }, [router.pathname]);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const navigateTo = (path) => {
    router.push(path);
    setDrawerOpen(false);
  };

  // Mobile drawer content
  const drawer = (
    <Box 
      component={motion.div}
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      sx={{ 
        width: drawerWidth,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ 
        p: 3, 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            sx={{ 
              background: 'linear-gradient(135deg, #4263EB 0%, #9370DB 100%)', 
              width: 40, 
              height: 40,
              mr: 1.5,
              fontWeight: 'bold'
            }}
          >
            B
          </Avatar>
          <Typography 
            variant="h6" 
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #4263EB 0%, #9370DB 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Another Me
          </Typography>
        </Box>
        <IconButton onClick={handleDrawerToggle} sx={{ color: 'text.secondary' }}>
          <CloseRoundedIcon />
        </IconButton>
      </Box>
      
      <Divider sx={{ opacity: 0.6, mx: 2 }} />
      
      <List sx={{ p: 2, flexGrow: 1, mt: 1 }}>
        {navItems.map((item, index) => (
          <ListItem 
            key={item.text} 
            disablePadding 
            component={motion.div}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.05 * index + 0.1, duration: 0.3 }}
            sx={{ mb: 1.5 }}
          >
            <NavItemDrawer
              active={router.pathname === item.path}
              onClick={() => navigateTo(item.path)}
            >
              <ListItemIcon sx={{ 
                color: router.pathname === item.path ? 'primary.main' : 'text.secondary',
                minWidth: '40px'
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ 
                  fontWeight: router.pathname === item.path ? 600 : 400,
                  fontSize: '1rem'
                }}
              />
            </NavItemDrawer>
          </ListItem>
        ))}
      </List>
      
      <Box sx={{ p: 3, opacity: 0.6 }}>
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center' }}>
          Another Me • {new Date().getFullYear()}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <StyledAppBar 
        position="fixed" 
        elevation={0}
        component={motion.header}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', py: { xs: 0.5, md: 0.5 }, minHeight: { xs: '56px', md: '64px' } }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            
            <Logo
              component={motion.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              onClick={() => { navigateTo('/') }}
              sx={{cursor: 'pointer'}}
            >
              {!isMobile && (
                <Avatar 
                  sx={{ 
                    background: 'linear-gradient(135deg, #4263EB 0%, #9370DB 100%)', 
                    width: 36, 
                    height: 36, 
                    mr: 1.5,
                    boxShadow: '0 4px 12px rgba(66, 99, 235, 0.2)'
                  }}
                >
                  B
                </Avatar>
              )}
              Another Me
            </Logo>
          </Box>

          {!isMobile && (
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                background: alpha(theme.palette.background.paper, 0.5),
                backdropFilter: 'blur(8px)',
                borderRadius: '16px',
                padding: '4px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
              }}
              component={motion.div}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              {navItems.map((item, index) => (
                  <NavItem
                    component={motion.button}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 * index + 0.3, duration: 0.3 }}
                    active={router.pathname === item.path}
                    onClick={() => navigateTo(item.path)}
                    startIcon={item.icon}
                  >
                    {item.text}
                  </NavItem>
              ))}
            </Box>
          )}
        </Toolbar>
      </StyledAppBar>

      <Box component="nav">
        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              width: drawerWidth,
              boxShadow: '0 0 40px rgba(0, 0, 0, 0.1)',
              borderRight: 'none',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 0.5, sm: 1.5, md: 3 },
          px: { xs: 0.5, sm: 1, md: 2 },
          width: '100%',
          minHeight: '100vh',
          pt: { xs: '70px', sm: '80px', md: '90px' } // Account for fixed AppBar with reduced spacing
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 0.5, sm: 2, md: 3 } }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
}
