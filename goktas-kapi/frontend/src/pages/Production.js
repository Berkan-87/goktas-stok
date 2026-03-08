import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import axios from 'axios';

const stations = [
  { id: 'planlama', name: 'Planlama', color: '#2196f3' },
  { id: 'cnc', name: 'CNC', color: '#4caf50' },
  { id: 'tutkal', name: 'Tutkal', color: '#ff9800' },
  { id: 'vakum', name: 'Vakum', color: '#9c27b0' },
  { id: 'pres', name: 'Pres', color: '#f44336' },
  { id: 'kenarbant', name: 'Kenarbant', color: '#009688' },
  { id: 'kilit', name: 'Kilit', color: '#795548' },
  { id: 'lake', name: 'Lake', color: '#607d8b' },
  { id: 'paketleme', name: 'Paketleme', color: '#ff5722' },
  { id: 'tamamlandi', name: 'Tamamlandı', color: '#8bc34a' }
];

const Production = () => {
  const [orders, setOrders] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { token, user } = useSelector(state => state.auth);

  const [formData, setFormData] = useState({
    orderCode: '',
    customerName: '',
    model: '',
    color: '',
    quantity: 1
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (error) {
      showSnackbar('Siparişler yüklenirken hata oluştu', 'error');
    }
  };

  const handleAddOrder = async () => {
    try {
      await axios.post('http://localhost:5000/api/orders', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showSnackbar('Sipariş başarıyla eklendi', 'success');
      setOpenDialog(false);
      resetForm();
      fetchOrders();
    } catch (error) {
      showSnackbar('Sipariş eklenirken hata oluştu', 'error');
    }
  };

  const handleMoveToNextStation = async (order) => {
    const currentIndex = stations.findIndex(s => s.id === order.currentStation);
    if (currentIndex < stations.length - 1) {
      const nextStation = stations[currentIndex + 1].id;
      
      try {
        await axios.put(`http://localhost:5000/api/orders/${order._id}/station`, 
          { nextStation },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showSnackbar('Sipariş ilerletildi', 'success');
        fetchOrders();
      } catch (error) {
        showSnackbar('Sipariş ilerletilirken hata oluştu', 'error');
      }
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Bu siparişi silmek istediğinizden emin misiniz?')) {
      try {
        await axios.delete(`http://localhost:5000/api/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showSnackbar('Sipariş silindi', 'success');
        fetchOrders();
      } catch (error) {
        showSnackbar('Sipariş silinirken hata oluştu', 'error');
      }
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const resetForm = () => {
    setFormData({
      orderCode: '',
      customerName: '',
      model: '',
      color: '',
      quantity: 1
    });
  };

  const canModifyStation = (stationId) => {
    return user?.role === 'admin' || (user?.role === 'station_user' && user?.station === stationId);
  };

  const canModifyPlanning = () => {
    return user?.role === 'admin' || (user?.role === 'station_user' && user?.station === 'planlama');
  };

  // Siparişleri istasyonlara göre grupla
  const ordersByStation = stations.reduce((acc, station) => {
    acc[station.id] = orders.filter(order => order.currentStation === station.id);
    return acc;
  }, {});

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Üretim Takip Sistemi
        </Typography>
        {canModifyPlanning() && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Yeni Sipariş
          </Button>
        )}
      </Box>

      <Grid container spacing={2}>
        {stations.map((station) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={station.id}>
            <Paper 
              sx={{ 
                p: 2, 
                backgroundColor: '#f5f5f5',
                borderTop: 3,
                borderColor: station.color,
                height: '100%'
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, color: station.color }}>
                {station.name}
              </Typography>
              
              <Box sx={{ minHeight: 200, maxHeight: 400, overflowY: 'auto' }}>
                {ordersByStation[station.id]?.map((order) => (
                  <Card key={order._id} sx={{ mb: 1 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="subtitle2" color="primary">
                            {order.orderCode}
                          </Typography>
                          <Typography variant="body2">
                            {order.customerName}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Model: {order.model} - Renk: {order.color}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Adet: {order.quantity}
                          </Typography>
                        </Box>
                        <Chip 
                          label={`${order.quantity} adet`} 
                          size="small"
                          color="primary"
                        />
                      </Box>
                      
                      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        {station.id !== 'tamamlandi' && canModifyStation(station.id) && (
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleMoveToNextStation(order)}
                          >
                            <ArrowForwardIcon />
                          </IconButton>
                        )}
                        {user?.role === 'admin' && (
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteOrder(order._id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Yeni Sipariş Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Yeni Sipariş Ekle</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Sipariş Kodu"
                value={formData.orderCode}
                onChange={(e) => setFormData({...formData, orderCode: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Cari İsmi"
                value={formData.customerName}
                onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Model"
                value={formData.model}
                onChange={(e) => setFormData({...formData, model: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Renk"
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Adet"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                inputProps={{ min: 1 }}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>İptal</Button>
          <Button 
            onClick={handleAddOrder} 
            variant="contained" 
            color="primary"
            disabled={!formData.orderCode || !formData.customerName || !formData.model || !formData.color}
          >
            Ekle
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({...snackbar, open: false})}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Production;
