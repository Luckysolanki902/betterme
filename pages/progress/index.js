import React from 'react';
import { Container, Typography, Breadcrumbs, Link } from '@mui/material';
import { Home as HomeIcon, AdminPanelSettings as AdminPanelSettingsIcon } from '@mui/icons-material';
import OverallProgress from '@/components/OverallProgress';
import WeeklyProgressChart from '@/components/WeeklyProgress';
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
