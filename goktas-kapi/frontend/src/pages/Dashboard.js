import React from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button
} from '@mui/material';
import {
  Factory as FactoryIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Hoş Geldiniz, {user?.username}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Göktaş Kapı Üretim Takip Sistemi
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              height: '100%',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.02)' }
            }}
            onClick={() => navigate('/production')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FactoryIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Typography variant="h5" component="h2">
                  Üretim Takip
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Siparişlerin üretim sürecini takip edin. İstasyonlar arası geçişleri yönetin.
              </Typography>
              <Button 
                variant="contained" 
                sx={{ mt: 2 }}
                fullWidth
              >
                Üretim Bölümüne Git
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              height: '100%',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.02)' }
            }}
            onClick={() => navigate('/inventory')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <InventoryIcon sx={{ fontSize: 40, color: 'secondary.main', mr: 2 }} />
                <Typography variant="h5" component="h2">
                  Stok Yönetimi
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Tüm şubelerin stok durumlarını görüntüleyin ve güncelleyin.
              </Typography>
              <Button 
                variant="contained" 
                color="secondary"
                sx={{ mt: 2 }}
                fullWidth
              >
                Stok Bölümüne Git
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUpIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                Güncel Üretim Durumu
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Yakında: Üretim istatistikleri ve grafikler burada görüntülenecek.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;