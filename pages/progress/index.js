import React from 'react';
import { Container } from '@mui/material';
import OverallProgress from '@/components/OverallProgress';
import { useRouter } from 'next/router';
import CompletionCounts from '@/components/CompletionCounts';
import Dashboard from '@/components/Dashboard';

const Progress = () => {
  const router = useRouter();

  return (
    <Container maxWidth="md">
      <div style={{ marginBottom: '4rem' }}>
        <OverallProgress />
      </div>
      <div style={{ marginBottom: '4rem' }}>
        <CompletionCounts/> 
      </div>
      <Dashboard currentPage={'progress'} />
    </Container>
  );
}

export default Progress;
