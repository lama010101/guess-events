
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import LoginForm from '@/components/LoginForm';
import RegisterForm from '@/components/RegisterForm';
import { useAuth } from '@/contexts/AuthContext';

const Auth = () => {
  const [view, setView] = useState<'login' | 'register'>('login');
  const { user, isLoading } = useAuth();
  
  // If user is already logged in, redirect to home page
  if (user && !isLoading) {
    return <Navigate to="/" replace />;
  }
  
  const toggleView = () => {
    setView(prev => prev === 'login' ? 'register' : 'login');
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        {view === 'login' ? (
          <LoginForm onToggleView={toggleView} />
        ) : (
          <RegisterForm onToggleView={toggleView} />
        )}
      </div>
    </div>
  );
};

export default Auth;
