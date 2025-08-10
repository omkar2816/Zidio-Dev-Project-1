import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BarChart3, 
  PieChart, 
  Users, 
  Settings, 
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toggleSidebarCollapsed, toggleSidebar } from '../../store/slices/uiSlice';

const Sidebar = () => {
  const dispatch = useDispatch();
  const { sidebarOpen, sidebarCollapsed } = useSelector((state) => state.ui);
  const { isAdmin } = useSelector((state) => state.auth);

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
      name: 'Charts',
      href: '/charts',
      icon: PieChart,
      current: false,
    },
    {
      name: 'Excel Files',
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
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  Excel Analytics
                </span>
              </div>
            )}
            {sidebarCollapsed && (
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center mx-auto">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className={`flex-1 ${sidebarCollapsed ? 'px-2' : 'px-4'} py-6 space-y-2`}>
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'px-3'} py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                    }`
                  }
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${sidebarCollapsed ? 'mx-auto' : ''}`} />
                  {!sidebarCollapsed && (
                    <span className="ml-3 truncate">{item.name}</span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            {!sidebarCollapsed && (
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Excel Analytics Platform
                <br />
                v1.0.0
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
