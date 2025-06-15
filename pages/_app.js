// pages/_app.js
import "@/styles/globals.css";
import { createTheme, ThemeProvider, CssBaseline, responsiveFontSizes } from '@mui/material';
import { StartDateProvider } from "@/contexts/StartDateContext";
import { StreakProvider } from "@/contexts/StreakContext";
import PageTransition from "@/components/PageTransition";
import { Inter } from 'next/font/google';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AuthGuard from '@/components/AuthGuard';

// Load Inter font
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// Create a custom theme
let theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4263EB',
      light: '#5C7CFA',
      dark: '#3B5BDB',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#9370DB',
      light: '#A48BE4',
      dark: '#8258DB',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F7F9FC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1E2A3B',
      secondary: '#64748B',
    },
    divider: 'rgba(0, 0, 0, 0.07)',
  },
  typography: {
    fontFamily: `'${inter.style.fontFamily}', 'Roboto', 'Helvetica', 'Arial', sans-serif`,
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.005em',
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.01em',
      textTransform: 'none',
    },
    body1: {
      letterSpacing: '0.005em',
    },
    body2: {
      letterSpacing: '0.005em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollBehavior: 'smooth',
          backgroundColor: '#F7F9FC',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
        },
        elevation1: {
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          fontWeight: 600,
        },
        contained: {
          boxShadow: '0px 3px 6px rgba(66, 99, 235, 0.16)',
          '&:hover': {
            boxShadow: '0px 5px 14px rgba(66, 99, 235, 0.2)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          overflow: 'hidden',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: 'rgba(255, 255, 255, 0.72)',
        },
      },
    },
  },
});

// Make fonts responsive
theme = responsiveFontSizes(theme);

// Define public paths that don't need authentication
const publicPaths = ['/sign-in', '/sign-up', '/about', '/api'];

function AppWithAuth({ Component, pageProps }) {
  const router = useRouter();
  
  // Check if the current path is in the public paths list
  const isPublicPath = publicPaths.some(path => 
    router.pathname === path || router.pathname.startsWith(path + '/')
  );

  // If it's a public path, render the component directly
  // Otherwise, wrap it with AuthGuard
  const ComponentToRender = isPublicPath ? Component : AuthGuard(Component);

  return (
    <>
      <Head>
        <title>Another Me | Todo Tracker</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="description" content="Another Me - A minimalist todo tracking application" />
        <link rel="icon" href="/favicon2.png" />
      </Head>
      
      <ThemeProvider theme={theme}>
        <CssBaseline />        <main className={inter.className}>
          <StartDateProvider>
            <StreakProvider>
              <PageTransition>
                <ComponentToRender {...pageProps} />
              </PageTransition>
            </StreakProvider>
          </StartDateProvider>
        </main>
      </ThemeProvider>
    </>
  );
}

export default function App(props) {
  return <AppWithAuth {...props} />;
}
