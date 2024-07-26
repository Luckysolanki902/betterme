// pages/components/Dashboard
import { Container, Typography, Card, CardContent, CardActionArea, Grid, Breadcrumbs, Link as MuiLink } from '@mui/material';
import { useRouter } from 'next/router';
import { useState } from 'react';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
const Dashboard = ({ currentPage }) => {
    const router = useRouter();

    const handleCardClick = (path) => {
        router.push(path);
    };

    return (
        <>
        <Typography variant='h4' sx={{marginTop:'4rem', marginBottom:'2rem'}} >Dashboard</Typography>
            {/* Main content with cards */}
            <Grid container spacing={3}>


                {currentPage != 'home' && <Grid item xs={12} sm={6}>
                    <Card>
                        <CardActionArea onClick={() => handleCardClick('/')}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <HomeRoundedIcon color='gray' sx={{ color: 'gray' }} />
                                <Typography variant="h6">Home</Typography>
                            </CardContent>
                        </CardActionArea>
                    </Card>
                </Grid>}


                {currentPage != 'celibacy' && <Grid item xs={12} sm={6}>
                    <Card>
                        <CardActionArea onClick={() => handleCardClick('/celibacy')}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <LocalFireDepartmentRoundedIcon color='gray' sx={{ color: 'gray' }} />
                                <Typography variant="h6">Celibacy Tracker</Typography>
                            </CardContent>
                        </CardActionArea>
                    </Card>
                </Grid>}


                {currentPage != 'progress' && <Grid item xs={12} sm={6}>
                    <Card>
                        <CardActionArea onClick={() => handleCardClick('/progress')}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <LocalFireDepartmentRoundedIcon color='gray' sx={{ color: 'gray' }} />
                                <Typography variant="h6">Progress</Typography>
                            </CardContent>
                        </CardActionArea>
                    </Card>
                </Grid>}



                {currentPage != 'modify' && <Grid item xs={12} sm={6}>
                    <Card>
                        <CardActionArea onClick={() => handleCardClick('/modify')}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <AdminPanelSettingsRoundedIcon color='gray' sx={{ color: 'gray' }} />
                                <Typography variant="h6">Modify</Typography>
                            </CardContent>
                        </CardActionArea>
                    </Card>
                </Grid>}


            </Grid>
        </>
    );
};

export default Dashboard;