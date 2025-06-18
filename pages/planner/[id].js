// pages/planner/[id].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Box, CircularProgress, Typography, Paper } from '@mui/material';
import Layout from '@/components/Layout';
import PlannerLayout from '@/components/planner/PlannerLayout';
import PlannerPageViewer from '@/components/planner/PlannerPageViewer';

const PlannerPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [pageTitle, setPageTitle] = useState('Planner');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!id) return;
    
    const fetchPageTitle = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/planner/${id}`);
        
        if (res.ok) {
          const page = await res.json();
          setPageTitle(page.title);
        } else {
          // Handle 404 and other errors
          if (res.status === 404) {
            setError('Page not found');
            // Redirect back to planner home after 2 seconds
            setTimeout(() => {
              router.push('/planner');
            }, 2000);
          } else {
            setError(`Error: ${res.status}`);
          }
        }
      } catch (error) {
        console.error('Error fetching page title:', error);
        setError('Failed to load page');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPageTitle();
  }, [id, router]);
  if (!id) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <PlannerLayout>
          <Paper 
            elevation={0}
            sx={{ 
              p: 4, 
              borderRadius: 2, 
              textAlign: 'center',
              border: '1px solid rgba(0, 0, 0, 0.12)',
            }}
          >
            <Typography variant="h5" color="error" gutterBottom>
              {error}
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Redirecting to planner home...
            </Typography>
            <CircularProgress size={24} />
          </Paper>
        </PlannerLayout>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{pageTitle} | Another Me - Planner</title>
      </Head>
      
      <PlannerLayout currentPageId={id} title={pageTitle}>
        <PlannerPageViewer pageId={id} />
      </PlannerLayout>
    </Layout>
  );
};

export default PlannerPage;
