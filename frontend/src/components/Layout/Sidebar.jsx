import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BarChart3, 
  PieChart, 
  Users, 
  Settings, 
  FileSpreadsheet,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toggleSidebarCollapsed, toggleSidebar } from '../../store/slices/uiSlice';
import TabNotificationBadge from './TabNotificationBadge';

const Sidebar = () => {
  const dispatch = useDispatch();
  const { sidebarOpen, sidebarCollapsed } = useSelector((state) => state.ui);
  const { isAdmin, isSuperAdmin } = useSelector((state) => state.auth);
  const [adminNotificationCount, setAdminNotificationCount] = useState(0);

  // Fetch admin notification count for superadmins
  useEffect(() => {
    const fetchAdminNotificationCount = async () => {
      if (!isSuperAdmin) return;
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/notifications?category=admin&isRead=false&limit=50', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setAdminNotificationCount(data.data.unreadCount);
        }
      } catch (error) {
        console.error('Error fetching admin notification count:', error);
      }
    };

    fetchAdminNotificationCount();
    
    // Poll every 30 seconds for updates
    const interval = isSuperAdmin ? setInterval(fetchAdminNotificationCount, 30000) : null;
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSuperAdmin]);

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      current: true,
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      current: false,
    },
    {
      name: 'Charts History',
      href: '/charts',
      icon: PieChart,
      current: false,
    },
    {
      name: 'Upload History',
      href: '/files',
      icon: FileSpreadsheet,
      current: false,
    },
    ...(isAdmin ? [{
      name: 'Admin Panel',
      href: '/admin',
      icon: Users,
      current: false,
    }] : []),
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      current: false,
    },
  ];

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-black/30"
          onClick={() => dispatch(toggleSidebar())}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-white/20 dark:border-gray-700/30 shadow-xl transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}`}
        style={{ position: 'fixed', top: 0, bottom: 0, overflowY: 'auto' }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-white/20 dark:border-gray-700/30 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Excel Analytics
                </span>
              </div>
            )}
            {sidebarCollapsed && (
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto shadow-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className={`flex-1 ${sidebarCollapsed ? 'px-2' : 'px-4'} py-6 space-y-2`}>
            {navigation.map((item) => {
              const Icon = item.icon;
              const showBadge = item.name === 'Admin Panel' && isSuperAdmin && adminNotificationCount > 0;
              
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'px-3'} py-3 text-sm font-medium rounded-xl transition-all duration-200 relative backdrop-blur-sm ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-300/30 dark:border-blue-600/30 text-blue-700 dark:text-blue-300 shadow-lg'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-gray-800/30 hover:text-gray-900 dark:hover:text-gray-100 hover:backdrop-blur-md hover:shadow-md'
                    }`
                  }
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${sidebarCollapsed ? 'mx-auto' : ''}`} />
                  {!sidebarCollapsed && (
                    <>
                      <span className="ml-3 truncate font-medium">{item.name}</span>
                      {showBadge && (
                        <span className="ml-auto bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full px-2 py-1 animate-pulse shadow-lg">
                          {adminNotificationCount > 9 ? '9+' : adminNotificationCount}
                        </span>
                      )}
                      {/* Tab-specific notification badges */}
                      {item.name === 'Analytics' && (
                        <TabNotificationBadge 
                          tabId="analytics"
                          category="analytics_tab"
                          targetRoles={['user']}
                        />
                      )}
                      {item.name === 'Charts History' && (
                        <TabNotificationBadge 
                          tabId="charts"
                          category="charts_tab"
                          targetRoles={['user', 'admin', 'superadmin']}
                        />
                      )}
                      {item.name === 'Upload History' && (
                        <TabNotificationBadge 
                          tabId="files"
                          category="files_tab"
                          targetRoles={['user']}
                        />
                      )}
                      {item.name === 'Dashboard' && (
                        <TabNotificationBadge 
                          tabId="dashboard"
                          category="dashboard_tab"
                          targetRoles={['user']}
                        />
                      )}
                    </>
                  )}
                  {sidebarCollapsed && showBadge && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center animate-pulse shadow-lg">
                      {adminNotificationCount > 9 ? '9' : adminNotificationCount}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-white/20 dark:border-gray-700/30 bg-gradient-to-r from-blue-500/5 to-purple-500/5 backdrop-blur-sm">
            {!sidebarCollapsed && (
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                <div className="font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Excel Analytics Platform
                </div>
                <div className="text-gray-400 dark:text-gray-500 mt-1">
                  v1.0.0
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
