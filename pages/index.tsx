import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from '../components/LoginForm';
import Header from '../components/Header';
import PicksManager from '../components/PicksManager';

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-lg text-gray-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <LoginForm />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-red-500 dark:bg-red-900">
      <div className="text-center py-20">
        <h1 className="text-6xl font-bold text-white mb-4">🚨 VERCEL TEST 🚨</h1>
        <p className="text-2xl text-white">IF YOU SEE THIS RED PAGE, DEPLOYMENT IS WORKING!</p>
      </div>
      <Header />
      <PicksManager />
    </div>
  );
}

