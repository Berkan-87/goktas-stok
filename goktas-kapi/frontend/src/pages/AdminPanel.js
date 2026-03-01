import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import axios from 'axios';

const stations = [
  { id: 'planlama', name: 'Planlama' },
  { id: 'cnc', name: 'CNC' },
  { id: 'tutkal', name: 'Tutkal' },
  { id: 'vakum', name: 'Vakum' },
  { id: 'pres', name: 'Pres' },
  { id: 'kenarbant', name: 'Kenarbant' },
  { id: 'kilit', name: 'Kilit' },
  { id: 'lake', name: 'Lake' },
  { id: 'paketleme', name: 'Paketleme' }
];

const branches = [
  { id: 'fabrika', name: 'Fabrika' },
  { id: 'karabaglar', name: 'Karabağlar' },
  { id: 'edremit', name: 'Edremit' },
  { id: 'karsiyaka', name: 'Karşıyaka' },
  { id: 'manisa', name: 'Manisa' }
];

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { token } = useSelector(state => state.auth);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'viewer',
    station: '',
    branch: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      showSnackbar('Kullanıcılar yüklenirken hata oluştu', 'error');
    }
  };

  const handleAddUser = async () => {
    try {
      await axios.post('http://localhost:5000/api/auth/register', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showSnackbar('Kullanıcı başarıyla eklendi', 'success');
      setOpenDialog(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      showSnackbar('Kullanıcı eklenirken hata oluştu', 'error');
    }
  };

  const handleUpdateUser = async () => {
    try {
      await axios.put(`http://localhost:5000/api/users/${selectedUser._id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showSnackbar('Kullanıcı güncellendi', 'success');
      setOpenDialog(false);
      setSelectedUser(null);
      resetForm();
      fetchUsers();
    } catch (error) {
      showSnackbar('Kullanıcı güncellenirken hata oluştu', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      try {
        await axios.delete(`http://localhost:5000/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showSnackbar('Kullanıcı silindi', 'success');
        fetchUsers();
      } catch (error) {
        showSnackbar('Kullanıcı silinirken hata oluştu', 'error');
      }
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      role: 'viewer',
      station: '',
      branch: ''
    });
  };

  const openEditDialog = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: '',
      role: user.role,
      station: user.station || '',
      branch: user.branch || ''
    });
    setOpenDialog(true);
  };

  const getRoleText = (role) => {
    switch(role) {
      case 'admin': return 'Admin';
      case 'station_user': return 'İstasyon Yetkilisi';
      case 'inventory_user': return 'Stok Yetkilisi';
      case 'viewer': return 'İzleyici';
      default: return role;
    }
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'admin': return 'error';
      case 'station_user': return 'primary';
      case 'inventory_user': return 'success';
      case 'viewer': return 'default';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Admin Paneli
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            resetForm();
            setSelectedUser(null);
            setOpenDialog(true);
          }}
        >
          Yeni Kullanıcı
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Kullanıcı Yönetimi
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Kullanıcı Adı</TableCell>
                      <TableCell>Rol</TableCell>
                      <TableCell>Yetkili Olduğu Bölüm</TableCell>
                      <TableCell>Kayıt Tarihi</TableCell>
                      <TableCell>İşlemler</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon fontSize="small" />
                            {user.username}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={getRoleText(user.role)} 
                            color={getRoleColor(user.role)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {user.role === 'station_user' && user.station && 
                            stations.find(s => s.id === user.station)?.name}
                          {user.role === 'inventory_user' && user.branch &&
                            branches.find(b => b.id === user.branch)?.name}
                          {user.role === 'admin' && 'Tüm Sistem'}
                          {user.role === 'viewer' && 'Tümünü Görüntüleme'}
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => openEditDialog(user)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteUser(user._id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Kullanıcı Ekle/Düzenle Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Kullanıcı Adı"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="password"
                label="Şifre"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                helperText={selectedUser ? 'Boş bırakılırsa şifre değişmez' : ''}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={formData.role}
                  label="Rol"
                  onChange={(e) => setFormData({...formData, role: e.target.value, station: '', branch: ''})}
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="station_user">İstasyon Yetkilisi</MenuItem>
                  <MenuItem value="inventory_user">Stok Yetkilisi</MenuItem>
                  <MenuItem value="viewer">İzleyici</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {formData.role === 'station_user' && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>İstasyon</InputLabel>
                  <Select
                    value={formData.station}
                    label="İstasyon"
                    onChange={(e) => setFormData({...formData, station: e.target.value})}
                  >
                    {stations.map((station) => (
                      <MenuItem key={station.id} value={station.id}>
                        {station.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {formData.role === 'inventory_user' && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Şube</InputLabel>
                  <Select
                    value={formData.branch}
                    label="Şube"
                    onChange={(e) => setFormData({...formData, branch: e.target.value})}
                  >
                    {branches.map((branch) => (
                      <MenuItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>İptal</Button>
          <Button 
            onClick={selectedUser ? handleUpdateUser : handleAddUser} 
            variant="contained" 
            color="primary"
          >
            {selectedUser ? 'Güncelle' : 'Ekle'}
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

export default AdminPanel;