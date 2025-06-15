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
        const res = await fetch(`/api/planner/${id}`);
        
        if (res.ok) {
          const page = await res.json();
          setPageTitle(page.title);
        }
      } catch (error) {
        console.error('Error fetching page title:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPageTitle();
  }, [id]);

  if (!id) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
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
