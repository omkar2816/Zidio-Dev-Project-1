import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Search, 
  Sun, 
  Moon, 
  User, 
  Settings, 
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toggleTheme, toggleSidebar, toggleSidebarCollapsed } from '../../store/slices/uiSlice';
import { logoutUser } from '../../store/slices/authSlice';
import NotificationPanel from './NotificationPanel';
import toast from 'react-hot-toast';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAdmin } = useSelector((state) => state.auth);
  const { theme, sidebarOpen, sidebarCollapsed, notifications } = useSelector((state) => state.ui);
  const { recentFiles, chartHistory } = useSelector((state) => state.analytics);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/auth/notifications?limit=1', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.data.unreadCount);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      toast.success('Logged out successfully', { position: 'bottom-center' });
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error('Logout failed', { position: 'bottom-center' });
      // Still navigate to login as token is cleared client-side in rejected handler
      navigate('/login', { replace: true });
    }
  };

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
    toast.success(`Switched to ${theme === 'light' ? 'dark' : 'light'} mode`);
  };

  const handleSearch = () => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      toast.error('Type something to search', { position: 'bottom-center' });
      return;
    }

    const go = (path) => {
      navigate(path);
      toast.success('Navigated to ' + path.replace('/', ''), { position: 'bottom-center' });
    };

    // Route keyword mapping
    const q = query;
    if (['dashboard', 'home'].some(k => q.includes(k))) return go('/dashboard');
    if (['analytics', 'analyze', 'data'].some(k => q.includes(k))) return go('/analytics');
    if (['charts', 'chart', 'visual'].some(k => q.includes(k))) return go('/charts');
    if (['files', 'excel', 'upload'].some(k => q.includes(k))) return go('/files');
    if (['settings', 'preference', 'theme'].some(k => q.includes(k))) return go('/settings');
    if (['profile', 'account', 'user'].some(k => q.includes(k))) return go('/profile');
    if (q.includes('admin')) {
      if (isAdmin) return go('/admin');
      return toast.error('Admin access required', { position: 'bottom-center' });
    }

    // Recent files fuzzy check
    const hasRecentMatch = (recentFiles || []).some(f => (f.name || '').toLowerCase().includes(q));
    if (hasRecentMatch) {
      navigate('/files');
      toast.success('Opening Files to locate recent file', { position: 'bottom-center' });
      return;
    }

    // Chart history titles
    const hasChartMatch = (chartHistory || []).some(c => (c.title || '').toLowerCase().includes(q));
    if (hasChartMatch) {
      navigate('/charts');
      toast.success('Opening Charts for related items', { position: 'bottom-center' });
      return;
    }

    toast.error('No matches. Try: dashboard, analytics, charts, files, settings, profile', { position: 'bottom-center' });
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
              if (isDesktop) {
                dispatch(toggleSidebarCollapsed());
              } else {
                dispatch(toggleSidebar());
              }
            }}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches ? (
              sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />
            ) : (
              sidebarOpen ? <X size={20} /> : <Menu size={20} />
            )}
          </button>
          
          <div className="relative w-full max-w-xs sm:max-w-sm lg:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search"
              aria-label="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              className="block w-full pl-10 pr-9 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Theme Toggle */}
          <button
            onClick={handleThemeToggle}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
              className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 bg-red-500 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-2 p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0">
                {user?.firstName?.charAt(0) || 'U'}
              </div>
              <span className="hidden sm:block text-sm font-medium truncate max-w-[100px] md:max-w-[120px] lg:max-w-[200px]">
                {user?.firstName} {user?.lastName}
              </span>
            </button>

            {/* User Dropdown */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-normal break-words">
                    {user?.email}
                  </p>
                  {isAdmin && (
                    <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded">
                      Admin
                    </span>
                  )}
                </div>
                
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <User size={16} />
                  <span>Profile</span>
                </Link>
                
                <Link
                  to="/settings"
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close user menu */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setUserMenuOpen(false)}
        />
      )}

      {/* Notification Panel */}
      <NotificationPanel 
        isOpen={notificationPanelOpen} 
        onClose={() => setNotificationPanelOpen(false)} 
      />

      {/* Click outside to close notification panel */}
      {notificationPanelOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setNotificationPanelOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;
