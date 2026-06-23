import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';

export const MainLayout = () => {
  const [lastUpdated, setLastUpdated] = useState('Just now');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshCallback, setRefreshCallback] = useState(null);
  const location = useLocation();

  // Reset refresh callback on route change to prevent stale callbacks
  useEffect(() => {
    setRefreshCallback(null);
  }, [location.pathname]);

  const handleRefresh = async () => {
    if (!refreshCallback) return;
    setIsRefreshing(true);
    try {
      await refreshCallback();
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Helper to allow child pages to set the refresh handler and last updated timestamp
  const registerRefreshHandler = (callback) => {
    setRefreshCallback(() => callback);
  };

  return (
    <div className="min-h-screen bg-surface-alt font-sans antialiased text-gray-900">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Panel */}
      <div className="ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <Header
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          lastUpdated={lastUpdated}
        />

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-y-auto flex flex-col justify-between">
          <div className="flex-grow">
            <Outlet context={{ registerRefreshHandler, isRefreshing, setLastUpdated }} />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
