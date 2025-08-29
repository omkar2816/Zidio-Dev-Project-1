import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

const TabNotificationBadge = ({ 
  tabId, 
  category = null, 
  type = null, 
  priority = null,
  targetRoles = null,
  refreshInterval = 30000, // 30 seconds
  maxCount = 99 
}) => {
  const { token, user } = useSelector((state) => state.auth);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (!token || !tabId) return;

    const fetchTabNotifications = async () => {
      try {
        // Build query parameters for filtering notifications
        const params = new URLSearchParams();
        
        if (category) params.append('category', category);
        if (type) params.append('type', type);
        if (priority) params.append('priority', priority);
        if (targetRoles) {
          targetRoles.forEach(role => params.append('targetRoles', role));
        }
        
        // Only count unread notifications
        params.append('isRead', 'false');
        params.append('limit', '100'); // Get a reasonable number to count
        
        const response = await fetch(`/api/notifications?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setNotificationCount(data.data.unreadCount || 0);
        }
      } catch (error) {
        console.error(`Error fetching tab notifications for ${tabId}:`, error);
      }
    };

    // Fetch immediately
    fetchTabNotifications();
    
    // Set up polling
    const interval = setInterval(fetchTabNotifications, refreshInterval);
    
    return () => clearInterval(interval);
  }, [token, tabId, category, type, priority, targetRoles, refreshInterval]);

  // Don't render if no notifications
  if (notificationCount === 0) return null;

  return (
    <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full animate-pulse min-w-[1.25rem] h-5">
      {notificationCount > maxCount ? `${maxCount}+` : notificationCount}
    </span>
  );
};

export default TabNotificationBadge;
