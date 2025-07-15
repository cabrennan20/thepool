import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from '../components/LoginForm';
import Header from '../components/Header';
import Dashboard from '../components/Dashboard';

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <Dashboard />
    </div>
  );
}

