import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isConnected, masterPassword, isWalletVerified } = useAuth();

  // If wallet not connected, not verified, OR master password not set, redirect to auth page
  if (!isConnected || !isWalletVerified || !masterPassword) {
    return <Navigate to="/auth" replace />;
  }

  // Otherwise, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
