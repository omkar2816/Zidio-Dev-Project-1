import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  ChevronRight,
  FileText,
  BarChart3,
  Clock,
  ArrowRight
} from 'lucide-react';
import { toggleTheme, toggleSidebar, toggleSidebarCollapsed } from '../../store/slices/uiSlice';
import { logoutUser } from '../../store/slices/authSlice';
import NotificationPanel from './NotificationPanel';
import toast from 'react-hot-toast';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAdmin, isSuperAdmin } = useSelector((state) => state.auth);
  const { theme, sidebarOpen, sidebarCollapsed, notifications } = useSelector((state) => state.ui);
  const { recentFiles, chartHistory } = useSelector((state) => state.analytics);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const searchTimeoutRef = useRef(null);
  const searchDropdownRef = useRef(null);

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/notifications?limit=1', {
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
    
    // Refresh every 30 seconds for all authenticated users
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]); // Depend on user to refetch when user changes

  // Define all searchable items
  const getSearchableItems = () => {
    const baseItems = [
      { type: 'page', title: 'Dashboard', description: 'Overview and quick actions', path: '/dashboard', icon: BarChart3, keywords: ['dashboard', 'home', 'overview'] },
      { type: 'page', title: 'Analytics', description: 'Upload and analyze data', path: '/analytics', icon: BarChart3, keywords: ['analytics', 'analyze', 'data', 'upload', 'excel'] },
      { type: 'page', title: 'Profile', description: 'Manage your account settings', path: '/profile', icon: User, keywords: ['profile', 'account', 'user', 'settings', 'personal'] },
      { type: 'feature', title: 'Upload File', description: 'Upload Excel or CSV files', path: '/analytics', icon: FileText, keywords: ['upload', 'file', 'excel', 'csv', 'import'] },
      { type: 'feature', title: 'Generate Charts', description: 'Create visualizations', path: '/analytics', icon: BarChart3, keywords: ['charts', 'chart', 'visual', 'graph', 'plot'] },
    ];

    // Add admin items if user is admin
    if (isAdmin) {
      baseItems.push(
        { type: 'page', title: 'Admin Panel', description: 'Manage users and system', path: '/admin', icon: Settings, keywords: ['admin', 'manage', 'users', 'system'] }
      );
    }

    // Add recent files if available
    if (recentFiles && recentFiles.length > 0) {
      recentFiles.slice(0, 5).forEach(file => {
        baseItems.push({
          type: 'file',
          title: file.name,
          description: `Recent file • ${new Date(file.uploadedAt).toLocaleDateString()}`,
          path: '/analytics',
          icon: FileText,
          keywords: [file.name.toLowerCase(), 'file', 'recent']
        });
      });
    }

    // Add chart history if available
    if (chartHistory && chartHistory.length > 0) {
      chartHistory.slice(0, 3).forEach(chart => {
        baseItems.push({
          type: 'chart',
          title: chart.title,
          description: `Chart • ${new Date(chart.createdAt).toLocaleDateString()}`,
          path: '/analytics',
          icon: BarChart3,
          keywords: [chart.title.toLowerCase(), 'chart', 'visualization']
        });
      });
    }

    return baseItems;
  };

  // Debounced search function
  const debouncedSearch = useCallback((query) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (!query.trim()) {
        setSearchSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      const searchableItems = getSearchableItems();
      const filtered = searchableItems.filter(item => {
        const searchTerm = query.toLowerCase();
        return item.title.toLowerCase().includes(searchTerm) ||
               item.description.toLowerCase().includes(searchTerm) ||
               item.keywords.some(keyword => keyword.includes(searchTerm));
      });

      setSearchSuggestions(filtered.slice(0, 8)); // Show max 8 suggestions
      setShowSuggestions(filtered.length > 0);
      setSelectedSuggestion(-1);
    }, 150); // 150ms debounce
  }, [isAdmin, recentFiles, chartHistory]);

  // Handle real-time search
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    debouncedSearch(value);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
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

  // Navigate to selected item
  const navigateToItem = (item) => {
    navigate(item.path);
    setSearchQuery('');
    setShowSuggestions(false);
    toast.success(`Navigated to ${item.title}`, { position: 'bottom-center' });
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions) {
      if (e.key === 'Enter') {
        handleLegacySearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestion(prev => 
          prev < searchSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestion(prev => 
          prev > 0 ? prev - 1 : searchSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestion >= 0 && searchSuggestions[selectedSuggestion]) {
          navigateToItem(searchSuggestions[selectedSuggestion]);
        } else if (searchSuggestions.length > 0) {
          navigateToItem(searchSuggestions[0]);
        } else {
          handleLegacySearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestion(-1);
        break;
    }
  };

  // Handle clicks outside search dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedSuggestion(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Legacy search function (fallback)
  const handleLegacySearch = () => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      toast.error('Type something to search', { position: 'bottom-center' });
      return;
    }

    const go = (path) => {
      navigate(path);
      setSearchQuery('');
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
          
          <div className="relative w-full max-w-xs sm:max-w-sm lg:max-w-md" ref={searchDropdownRef}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search pages, files, features..."
              aria-label="Search"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (searchQuery.trim() && searchSuggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              className="block w-full pl-10 pr-9 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setSearchQuery('');
                  setShowSuggestions(false);
                  setSearchSuggestions([]);
                }}
                className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={16} />
              </button>
            )}

            {/* Search Suggestions Dropdown */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                {searchSuggestions.map((item, index) => (
                  <button
                    key={`${item.type}-${item.title}-${index}`}
                    onClick={() => navigateToItem(item)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors ${
                      selectedSuggestion === index ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        item.type === 'page' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                        item.type === 'file' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                        item.type === 'chart' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        <item.icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {item.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {item.description}
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-gray-400 flex-shrink-0" />
                    </div>
                  </button>
                ))}
                
                {/* Search Tips */}
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    💡 Tip: Use ↑↓ arrows to navigate, Enter to select, Esc to close
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Theme Toggle */}
          <button
            onClick={handleThemeToggle}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* Notifications - For all authenticated users */}
          <div className="relative">
            <button 
              onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
              className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative flex items-center justify-center"
              title="View notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 bg-red-500 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center animate-pulse">
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
