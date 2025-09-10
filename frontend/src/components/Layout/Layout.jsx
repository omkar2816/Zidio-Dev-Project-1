import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  const { sidebarCollapsed } = useSelector((state) => state.ui);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
      <Sidebar />
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`} 
        style={{ minHeight: '100vh' }}
      >
        <Header />
        <main className="flex-1 relative overflow-auto">
          {/* Glassmorphism background */}
          <div className="absolute inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
