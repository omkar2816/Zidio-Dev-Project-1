import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNotifications } from '../../contexts/NotificationContext';

const TabNotificationBadge = ({ 
  tabId, 
  category = null, 
  type = null, 
  priority = null,
  targetRoles = null,
  maxCount = 99 
}) => {
  const { user } = useSelector((state) => state.auth);
  const { getUnreadCountByCategory, lastUpdate } = useNotifications();
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (!tabId) return;

    // Get the notification count using the context
    const count = getUnreadCountByCategory(category, targetRoles);
    setNotificationCount(count);
  }, [tabId, category, targetRoles, getUnreadCountByCategory, lastUpdate]);

  // Don't render if no notifications
  if (notificationCount === 0) return null;

  return (
    <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full animate-pulse min-w-[1.25rem] h-5">
      {notificationCount > maxCount ? `${maxCount}+` : notificationCount}
    </span>
  );
};

export default TabNotificationBadge;
