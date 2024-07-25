// pages/admin/index.js
import { Container, Typography, Card, CardContent, CardActionArea, Grid } from '@mui/material';
import Link from 'next/link';

const AdminDashboard = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Header */}
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Panel
      </Typography>

      {/* Main content with cards */}
      <Grid container spacing={3}>
        {/* Modify Card */}
        <Grid item xs={12} sm={6}>
          <Card >
            <CardActionArea component={Link} href="/admin/modify">
              <CardContent>
                <Typography variant="h6">Modify</Typography>
                <Typography variant="body2" color="text.secondary">
                  Go to the modify page to make changes.
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>

        {/* Progress Card */}
        <Grid item xs={12} sm={6}>
          <Card >
            <CardActionArea component={Link} href="/admin/progress">
              <CardContent>
                <Typography variant="h6">Progress</Typography>
                <Typography variant="body2" color="text.secondary">
                  Check the progress details here.
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboard;
