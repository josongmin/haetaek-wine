import React, { useContext, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from '../UserContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user } = useContext(UserContext) as { user: any; setUser?: (user: any) => void };

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

