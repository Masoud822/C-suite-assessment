import React from 'react';
import { Navigate } from 'react-router-dom';

const GuestRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (token) {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user?.role === 'ADMIN') {
        return <Navigate to="/admin" replace />;
      }
      return <Navigate to="/assessment/question" replace />;
    } catch {
      return <Navigate to="/assessment/question" replace />;
    }
  }

  return children;
};

export default GuestRoute;
