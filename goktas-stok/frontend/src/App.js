import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StockList from './pages/StockList';
import Transfer from './pages/Transfer';
import History from './pages/History';
import AdminPanel from './pages/AdminPanel';
import PrivateRoute from './components/PrivateRoute';
import MainLayout from './components/Layout/MainLayout';

function App() {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        
        <Route path="/" element={<PrivateRoute />}>
          <Route element={<MainLayout />}>
            <Route index element={<Dashboard />} />
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