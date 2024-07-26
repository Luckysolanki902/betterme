import React from 'react';
import { Container, Typography, Breadcrumbs, Link } from '@mui/material';
import { Home as HomeIcon, AdminPanelSettings as AdminPanelSettingsIcon } from '@mui/icons-material';
import OverallProgress from '@/components/OverallProgress';
import WeeklyProgressChart from '@/components/WeeklyProgress';
import { useRouter } from 'next/router';
import CompletionCounts from '@/components/CompletionCounts';

const Progress = () => {
  const router = useRouter();

  return (
    <Container maxWidth="md">
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3, mt: 3 }}>
        <Link sx={{textDecoration:'none'}} color="inherit" href="/" onClick={(e) => { e.preventDefault(); router.push('/'); }}>
          BetterMe
        </Link>
        <Link sx={{textDecoration:'none'}} color="inherit" href="/admin" onClick={(e) => { e.preventDefault(); router.push('/admin'); }}>
          Admin
        </Link>
        <Typography color="textPrimary">Progress</Typography>
      </Breadcrumbs>
      <div style={{ marginBottom: '4rem' }}>
        <OverallProgress />
      </div>
      <div style={{ marginBottom: '4rem' }}>
        <CompletionCounts/>
      </div>
    </Container>
  );
}

export default Progress;
