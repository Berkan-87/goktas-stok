import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  console.log('🔒 PrivateRoute - isAuthenticated:', isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Outlet, alt route'ları render eder
  return <Outlet />;
};

export default PrivateRoute;