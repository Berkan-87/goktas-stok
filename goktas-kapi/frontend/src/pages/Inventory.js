import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  Snackbar,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Remove as RemoveIcon,
  AddCircle as AddCircleIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import axios from 'axios';

const branches = [
  { id: 'fabrika', name: 'Fabrika', color: '#2e7d32' },
  { id: 'karabaglar', name: 'Karabağlar', color: '#1976d2' },
  { id: 'edremit', name: 'Edremit', color: '#ed6c02' },
  { id: 'karsiyaka', name: 'Karşıyaka', color: '#9c27b0' },
  { id: 'manisa', name: 'Manisa', color: '#d32f2f' }
];

const Inventory = () => {
  const [tabValue, setTabValue] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { token, user } = useSelector(state => state.auth);

  const [formData, setFormData] = useState({
    model: '',
    quantity: 0,
    minStock: 0,
    maxStock: 100
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/inventory', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInventory(response.data);
    } catch (error) {
      showSnackbar('Stok bilgileri yüklenirken hata oluştu', 'error');
    }
  };

  const handleAddModel = async () => {
    try {
      await axios.post('http://localhost:5000/api/inventory', {
        ...formData,
        branch: branches[tabValue].id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showSnackbar('Stok modeli başarıyla eklendi', 'success');
      setOpenDialog(false);
      resetForm();
      fetchInventory();
    } catch (error) {
      showSnackbar('Stok modeli eklenirken hata oluştu', 'error');
    }
  };

  const handleUpdateStock = async (itemId, newQuantity) => {
    try {
      await axios.put(`http://localhost:5000/api/inventory/${itemId}`, 
        { quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showSnackbar('Stok güncellendi', 'success');
      fetchInventory();
    } catch (error) {
      showSnackbar('Stok güncellenirken hata oluştu', 'error');
    }
  };

  const handleDeleteModel = async (itemId) => {
    if (window.confirm('Bu stok modelini silmek istediğinizden emin misiniz?')) {
      try {
        await axios.delete(`http://localhost:5000/api/inventory/${itemId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showSnackbar('Stok modeli silindi', 'success');
        fetchInventory();
      } catch (error) {
        showSnackbar('Stok modeli silinirken hata oluştu', 'error');
      }
    }
  };

  const canModifyBranch = (branchId) => {
    return user?.role === 'admin' || (user?.role === 'inventory_user' && user?.branch === branchId);
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const resetForm = () => {
    setFormData({
      model: '',
      quantity: 0,
      minStock: 0,
      maxStock: 100
    });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const currentBranchInventory = inventory.filter(item => item.branch === branches[tabValue]?.id);

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Stok Yönetimi
        </Typography>
        {branches[tabValue] && canModifyBranch(branches[tabValue].id) && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Yeni Stok Modeli
          </Button>
        )}
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="şube seçimi"
        >
          {branches.map((branch, index) => (
            <Tab key={branch.id} label={branch.name} id={`branch-tab-${index}`} />
          ))}
        </Tabs>
      </Paper>

      {branches[tabValue] && (
        <Grid container spacing={3}>
          {currentBranchInventory.length > 0 ? (
            currentBranchInventory.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item._id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" component="div">
                        {item.model}
                      </Typography>
                      {user?.role === 'admin' && (
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteModel(item._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                    
                    <Box sx={{ my: 2 }}>
                      <Typography variant="h3" component="div" align="center" color="primary">
                        {item.quantity}
                      </Typography>
                      <Typography variant="body2" align="center" color="text.secondary">
                        {item.unit || 'adet'}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
                      {canModifyBranch(branches[tabValue].id) && (
                        <>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<RemoveIcon />}
                            onClick={() => handleUpdateStock(item._id, Math.max(0, item.quantity - 1))}
                            disabled={item.quantity <= 0}
                          >
                            Çıkar
                          </Button>
                          <Button
                            variant="outlined"
                            color="success"
                            size="small"
                            startIcon={<AddCircleIcon />}
                            onClick={() => handleUpdateStock(item._id, item.quantity + 1)}
                          >
                            Ekle
                          </Button>
                        </>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      {item.quantity <= item.minStock && (
                        <Chip label="Kritik Stok" color="error" size="small" />
                      )}
                      {item.quantity >= item.maxStock && (
                        <Chip label="Maksimum Stok" color="warning" size="small" />
                      )}
                    </Box>

                    <Typography variant="caption" display="block" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
                      Son Güncelleme: {new Date(item.lastUpdated).toLocaleDateString('tr-TR')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  Bu şubede henüz stok modeli bulunmuyor.
                </Typography>
                {canModifyBranch(branches[tabValue].id) && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenDialog(true)}
                    sx={{ mt: 2 }}
                  >
                    İlk Stok Modelini Ekle
                  </Button>
                )}
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Yeni Stok Modeli Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Yeni Stok Modeli Ekle - {branches[tabValue]?.name}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Model Adı"
                value={formData.model}
                onChange={(e) => setFormData({...formData, model: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Başlangıç Miktarı"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                inputProps={{ min: 0 }}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Minimum Stok"
                value={formData.minStock}
                onChange={(e) => setFormData({...formData, minStock: parseInt(e.target.value) || 0})}
                inputProps={{ min: 0 }}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Maksimum Stok"
                value={formData.maxStock}
                onChange={(e) => setFormData({...formData, maxStock: parseInt(e.target.value) || 1})}
                inputProps={{ min: 1 }}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>İptal</Button>
          <Button 
            onClick={handleAddModel} 
            variant="contained" 
            color="primary"
            disabled={!formData.model || formData.quantity < 0}
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

export default Inventory;