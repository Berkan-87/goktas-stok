import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Production from './pages/Production';
import StockList from './pages/StockList';
import Transfer from './pages/Transfer';
import History from './pages/History';
import AdminPanel from './pages/AdminPanel';
import PrivateRoute from './components/PrivateRoute';
import MainLayout from './components/Layout/MainLayout';
import { setUser } from './store/slices/authSlice';

function App() {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // ✅ Sayfa yenilendiğinde user bilgisini Redux'a geri yükle
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        dispatch(setUser(JSON.parse(user)));
      } catch (error) {
        console.error('Kullanıcı geri yüklenirken hata:', error);
      }
    }
  }, [dispatch]);

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        
        <Route path="/" element={<PrivateRoute />}>
          <Route element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="uretim" element={<Production />} />
            <Route path="stoklar" element={<StockList />} />
            <Route path="transfer" element={<Transfer />} />
            <Route path="gecmis" element={<History />} />
            <Route path="admin" element={<AdminPanel />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;