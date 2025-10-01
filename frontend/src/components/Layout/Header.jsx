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
  const searchInputRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Keyboard shortcut for search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Ensure scroll container is properly configured
  useEffect(() => {
    if (scrollContainerRef.current && showSuggestions) {
      const container = scrollContainerRef.current;
      
      // Force scrollbar to be visible and functional
      container.style.overflowY = 'auto';
      container.style.scrollbarWidth = 'thin';
      container.style.scrollbarColor = '#9CA3AF transparent';
      
      // Reset scroll position when suggestions change
      container.scrollTop = 0;
    }
  }, [showSuggestions, searchSuggestions]);

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = sessionStorage.getItem('token');
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
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border-b border-gray-200/30 dark:border-gray-700/30 shadow-lg shadow-gray-100/50 dark:shadow-gray-900/50">
      <div className="max-w-full mx-auto">
        {/* Main Navigation Container */}
        <div className="flex items-center justify-between h-18 px-4 sm:px-6 lg:px-8 py-2">
          {/* Left Section - Brand & Navigation */}
          <div className="flex items-center space-x-4 lg:space-x-6">
            {/* Hamburger Menu - Modern Design */}
            <button
              onClick={() => {
                const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
                if (isDesktop) {
                  dispatch(toggleSidebarCollapsed());
                } else {
                  dispatch(toggleSidebar());
                }
              }}
              className="group relative p-2.5 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 hover:from-emerald-50 hover:to-emerald-100 dark:hover:from-emerald-900/20 dark:hover:to-emerald-800/20 border border-gray-200/60 dark:border-gray-600/60 hover:border-emerald-300/60 dark:hover:border-emerald-600/60 transition-all duration-300 shadow-sm hover:shadow-md"
              aria-label="Toggle sidebar"
            >
              <div className="relative z-10">
                {typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches ? (
                  sidebarCollapsed ? <ChevronRight size={18} className="text-gray-600 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:scale-110 transition-all duration-200" /> : <ChevronLeft size={18} className="text-gray-600 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:scale-110 transition-all duration-200" />
                ) : (
                  sidebarOpen ? <X size={18} className="text-gray-600 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:scale-110 transition-all duration-200" /> : <Menu size={18} className="text-gray-600 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:scale-110 transition-all duration-200" />
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/0 to-teal-400/0 group-hover:from-emerald-400/10 group-hover:to-teal-400/10 rounded-2xl transition-all duration-300"></div>
            </button>

            {/* Logo/Brand Section - Enhanced */}
            <div className="hidden sm:flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></div>
              </div>
              <div className="hidden lg:block">
                <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-800 dark:from-white dark:via-emerald-200 dark:to-teal-200 bg-clip-text text-transparent">
                  Excel Analytics
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">Professional Dashboard</p>
              </div>
            </div>
          </div>
          {/* Center Section - Modern Search */}
          <div className="flex-1 max-w-2xl mx-4 lg:mx-8">
            <div className="relative" ref={searchDropdownRef}>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <Search className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors duration-200" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search anything... (pages, files, features)"
                  aria-label="Global search"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (searchQuery.trim() && searchSuggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  className="w-full h-12 pl-12 pr-12 bg-gray-50/80 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 rounded-2xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60 transition-all duration-300 backdrop-blur-sm shadow-inner hover:shadow-md focus:shadow-lg group"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 space-x-2">
                  {searchQuery && (
                    <button
                      type="button"
                      aria-label="Clear search"
                      onClick={() => {
                        setSearchQuery('');
                        setShowSuggestions(false);
                        setSearchSuggestions([]);
                      }}
                      className="flex items-center justify-center p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-600/50 transition-all duration-200"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <div className="hidden sm:flex items-center space-x-1 text-xs text-gray-400 bg-gray-100/60 dark:bg-gray-700/60 px-2 py-1 rounded-lg">
                    <span>Ctrl</span>
                    <span>K</span>
                  </div>
                </div>
              </div>

              {/* Enhanced Search Suggestions Dropdown */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl border border-gray-200/60 dark:border-gray-700/60 rounded-2xl shadow-2xl z-50">
                  <div className="relative">
                    <div 
                      ref={scrollContainerRef}
                      className="max-h-96 overflow-y-auto p-2"
                      style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#9CA3AF transparent',
                        WebkitOverflowScrolling: 'touch'
                      }}
                      onWheel={(e) => {
                        // Ensure wheel events work properly
                        const container = e.currentTarget;
                        const { scrollTop, scrollHeight, clientHeight } = container;
                        
                        // Allow normal scrolling
                        if (
                          (e.deltaY < 0 && scrollTop === 0) ||
                          (e.deltaY > 0 && scrollTop >= scrollHeight - clientHeight)
                        ) {
                          // At boundaries, prevent event bubbling to avoid page scroll
                          e.stopPropagation();
                        }
                      }}
                    >
                      {searchSuggestions.map((item, index) => (
                        <button
                          key={`${item.type}-${item.title}-${index}`}
                          onClick={() => navigateToItem(item)}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50/80 dark:hover:bg-gray-700/50 border border-transparent hover:border-gray-200/50 dark:hover:border-gray-600/50 transition-all duration-200 rounded-xl ${
                            selectedSuggestion === index ? 'bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-200/50 dark:border-emerald-700/50' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`p-2.5 rounded-xl ${
                              item.type === 'page' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                              item.type === 'file' ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' :
                              item.type === 'chart' ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400' :
                              'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}>
                              <item.icon size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
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
                    </div>
                  </div>
                  
                  {/* Enhanced Search Tips */}
                  <div className="px-4 py-3 bg-gray-50/50 dark:bg-gray-700/30 border-t border-gray-200/50 dark:border-gray-600/50 rounded-b-2xl">
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
                      <span>💡 Use ↑↓ to navigate, Enter to select</span>
                      <span className="text-gray-400">ESC to close</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Right Section - Modern Action Bar */}
          <div className="flex items-center space-x-2 lg:space-x-3">
            {/* Quick Actions */}
            <div className="hidden md:flex items-center space-x-2">
              {/* Theme Toggle - Enhanced */}
              <button
                onClick={handleThemeToggle}
                className="group relative p-2.5 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 hover:from-amber-50 hover:to-orange-100 dark:hover:from-amber-900/20 dark:hover:to-orange-800/20 border border-gray-200/60 dark:border-gray-600/60 hover:border-amber-300/60 dark:hover:border-amber-600/60 transition-all duration-300 shadow-sm hover:shadow-md flex items-center justify-center"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                <div className="relative z-10 flex items-center justify-center">
                  {theme === 'light' ? 
                    <Moon size={18} className="text-gray-600 dark:text-gray-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:scale-110 transition-all duration-200" /> : 
                    <Sun size={18} className="text-gray-600 dark:text-gray-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:scale-110 transition-all duration-200" />
                  }
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/0 to-orange-400/0 group-hover:from-amber-400/10 group-hover:to-orange-400/10 rounded-2xl transition-all duration-300"></div>
              </button>
            </div>

            {/* Notifications - Modern Badge Design */}
            <div className="relative">
              <button 
                onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
                className="group relative p-2.5 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 hover:from-emerald-50 hover:to-emerald-100 dark:hover:from-emerald-900/20 dark:hover:to-emerald-800/20 border border-gray-200/60 dark:border-gray-600/60 hover:border-emerald-300/60 dark:hover:border-emerald-600/60 transition-all duration-300 shadow-sm hover:shadow-md flex items-center justify-center"
                title="View notifications"
              >
                <div className="relative z-10 flex items-center justify-center">
                  <Bell size={18} className="text-gray-600 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:scale-110 transition-all duration-200" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 h-5 w-5 bg-gradient-to-r from-red-500 via-red-600 to-pink-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse border-2 border-white dark:border-gray-800">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/0 to-teal-400/0 group-hover:from-emerald-400/10 group-hover:to-teal-400/10 rounded-2xl transition-all duration-300"></div>
              </button>
            </div>

            {/* User Profile - Modern Card Design */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="group flex items-center space-x-3 p-2 pr-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 hover:from-emerald-50 hover:to-emerald-100 dark:hover:from-emerald-900/20 dark:hover:to-emerald-800/20 border border-gray-200/60 dark:border-gray-600/60 hover:border-emerald-300/60 dark:hover:border-emerald-600/60 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform duration-200">
                    {user?.firstName?.charAt(0) || 'U'}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[120px] lg:max-w-[150px] group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px] lg:max-w-[150px]">
                    {isAdmin ? (isSuperAdmin ? 'Super Admin' : 'Admin') : 'User'}
                  </p>
                </div>
                <div className="hidden sm:block text-gray-400 group-hover:text-emerald-500 transition-colors">
                  <ArrowRight size={14} className="transform group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>

              {/* Enhanced User Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-200/60 dark:border-gray-700/60 z-50 overflow-hidden">
                  {/* User Info Header */}
                  <div className="px-6 py-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-b border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {user?.firstName?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user?.email}
                        </p>
                        {isAdmin && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg shadow-sm">
                            {isSuperAdmin ? 'Super Admin' : 'Admin'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Menu Items */}
                  <div className="py-2">
                    <Link
                      to="/profile"
                      className="flex items-center space-x-3 px-6 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-emerald-50/80 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all duration-200 group"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/40 transition-colors">
                        <User size={16} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="font-medium">My Profile</span>
                      <ArrowRight size={14} className="ml-auto text-gray-400 group-hover:text-emerald-500 transform group-hover:translate-x-0.5 transition-all" />
                    </Link>
                    
                    <Link
                      to="/settings"
                      className="flex items-center space-x-3 px-6 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200 group"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-xl group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
                        <Settings size={16} className="text-gray-600 dark:text-gray-400" />
                      </div>
                      <span className="font-medium">Settings</span>
                      <ArrowRight size={14} className="ml-auto text-gray-400 group-hover:text-gray-500 transform group-hover:translate-x-0.5 transition-all" />
                    </Link>
                    
                    {/* Mobile Theme Toggle */}
                    <div className="md:hidden">
                      <button
                        onClick={handleThemeToggle}
                        className="flex items-center space-x-3 w-full px-6 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-amber-50/80 dark:hover:bg-amber-900/20 hover:text-amber-700 dark:hover:text-amber-300 transition-all duration-200 group"
                      >
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl group-hover:bg-amber-200 dark:group-hover:bg-amber-800/40 transition-colors">
                          {theme === 'light' ? 
                            <Moon size={16} className="text-amber-600 dark:text-amber-400" /> : 
                            <Sun size={16} className="text-amber-600 dark:text-amber-400" />
                          }
                        </div>
                        <span className="font-medium">
                          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                        </span>
                        <ArrowRight size={14} className="ml-auto text-gray-400 group-hover:text-amber-500 transform group-hover:translate-x-0.5 transition-all" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Logout Section */}
                  <div className="border-t border-gray-200/50 dark:border-gray-700/50 p-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 w-full px-6 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50/80 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 transition-all duration-200 rounded-xl group"
                    >
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl group-hover:bg-red-200 dark:group-hover:bg-red-800/40 transition-colors">
                        <LogOut size={16} className="text-red-600 dark:text-red-400" />
                      </div>
                      <span className="font-medium">Sign Out</span>
                      <ArrowRight size={14} className="ml-auto text-red-400 group-hover:text-red-500 transform group-hover:translate-x-0.5 transition-all" />
                    </button>
                  </div>
                </div>
              )}
            </div>
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
