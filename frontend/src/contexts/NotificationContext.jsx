import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { token, user, isAuthenticated } = useSelector((state) => state.auth);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Fetch all notifications
  const fetchNotifications = useCallback(async (filters = {}) => {
    if (!token || !isAuthenticated) return;

    try {
      setIsLoading(true);
      
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== 'all') {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, value);
          }
        }
      });

      const url = `/api/notifications${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data.notifications || []);
        setUnreadCount(data.data.unreadCount || 0);
        setLastUpdate(Date.now());
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token, isAuthenticated]);

  // Mark notification as read and remove from view
  const markAsRead = useCallback(async (notificationId) => {
    if (!token) return false;

    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Immediately update local state
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
        setLastUpdate(Date.now());
        return true;
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
    return false;
  }, [token]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!token) return false;

    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Clear all notifications from view
        setNotifications([]);
        setUnreadCount(0);
        setLastUpdate(Date.now());
        return true;
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
    return false;
  }, [token]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    if (!token) return false;

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Find notification and update counts accordingly
        const notification = notifications.find(n => n._id === notificationId);
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
        
        if (notification && !notification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        setLastUpdate(Date.now());
        return true;
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
    return false;
  }, [token, notifications]);

  // Clean up read notifications
  const cleanupReadNotifications = useCallback(async () => {
    if (!token) return false;

    try {
      const response = await fetch('/api/notifications/cleanup/all-read', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Remove all read notifications from local state
        setNotifications(prev => prev.filter(notif => !notif.isRead));
        setLastUpdate(Date.now());
        return true;
      }
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
    }
    return false;
  }, [token]);

  // Get notifications by category/tab
  const getNotificationsByCategory = useCallback((category, includeRead = false) => {
    return notifications.filter(notif => {
      const categoryMatch = !category || notif.category === category;
      const readFilter = includeRead || !notif.isRead;
      return categoryMatch && readFilter;
    });
  }, [notifications]);

  // Get unread count by category
  const getUnreadCountByCategory = useCallback((category, targetRoles = null) => {
    return notifications.filter(notif => {
      const categoryMatch = !category || notif.category === category;
      const unreadMatch = !notif.isRead;
      const roleMatch = !targetRoles || !notif.targetRoles || 
        notif.targetRoles.some(role => targetRoles.includes(role));
      return categoryMatch && unreadMatch && roleMatch;
    }).length;
  }, [notifications]);

  // Auto-refresh notifications
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Initial fetch
    fetchNotifications();

    // Set up periodic refresh (every 30 seconds)
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchNotifications]);

  // Auto-cleanup old notifications
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const autoCleanup = async () => {
      try {
        await fetch('/api/notifications/cleanup/read', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        // Silent cleanup
      }
    };

    // Run cleanup once when component mounts
    autoCleanup();
  }, [isAuthenticated, token]);

  const value = {
    notifications,
    unreadCount,
    isLoading,
    lastUpdate,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    cleanupReadNotifications,
    getNotificationsByCategory,
    getUnreadCountByCategory
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
