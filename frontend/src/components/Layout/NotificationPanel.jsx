import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  X, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Info, 
  User, 
  FileText, 
  BarChart3, 
  Shield, 
  AlertTriangle, 
  Trash2, 
  Settings, 
  Activity,
  ExternalLink,
  Filter,
  MoreVertical,
  Check,
  LayoutDashboard,
  PieChart
} from 'lucide-react';

const NotificationPanel = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Re-fetch notifications when filters change and auto-cleanup old read notifications
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      // Auto-cleanup old read notifications when panel opens
      autoCleanupOldNotifications();
    }
  }, [isOpen, selectedCategory, selectedPriority]);

  const autoCleanupOldNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/notifications/cleanup/read', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      // Silent cleanup - no need to update UI as fresh data will be fetched
    } catch (error) {
      // Silent fail for auto-cleanup
      console.debug('Auto-cleanup completed');
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      let url = '/api/notifications';
      
      // Add filter parameters
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedPriority !== 'all') params.append('priority', selectedPriority);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Remove the notification from the panel after marking as read
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Remove all notifications from the panel after marking all as read
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      markAsRead(notification._id);
    }

    // Navigate to the action URL if available
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      onClose(); // Close the notification panel
    }
  };

  const deleteNotification = async (notificationId, event) => {
    event.stopPropagation(); // Prevent navigation when deleting
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
        // Update unread count if the deleted notification was unread
        const deletedNotification = notifications.find(n => n._id === notificationId);
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const cleanupReadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications/cleanup/all-read', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Remove read notifications from the current view
        setNotifications(prev => prev.filter(notif => !notif.isRead));
        console.log(`Cleaned up ${data.deletedCount} read notifications`);
      }
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const iconMap = {
      // Superadmin notifications
      new_user_registration: User,
      admin_request_pending: Clock,
      admin_request_approved: CheckCircle,
      admin_request_rejected: XCircle,
      file_upload_activity: FileText,
      data_analysis_completed: BarChart3,
      user_activity_alert: Activity,
      system_milestone: Shield,
      bulk_operation_completed: Settings,
      login_alert: Shield,
      user_deletion: Trash2,
      admin_privileges_granted: Shield,
      admin_privileges_revoked: Shield,
      security_alert: AlertTriangle,
      system_update: Settings,
      
      // User notifications
      welcome_user: User,
      file_processed: FileText,
      analysis_ready: BarChart3,
      account_updated: User,
      password_changed: Shield,
      login_success: CheckCircle,
      suspicious_activity: AlertTriangle,
      quota_warning: AlertTriangle,
      feature_announcement: Info,
      
      // Admin notifications
      new_user_assigned: User,
      user_support_request: Info,
      system_maintenance: Settings,
      performance_report: BarChart3,
      
      // Tab-specific notifications
      dashboard_update: LayoutDashboard,
      analytics_report_ready: BarChart3,
      analytics_data_ready: BarChart3,
      charts_template_added: PieChart,
      chart_generation_complete: PieChart,
      files_processing_complete: FileText,
      admin_user_action_required: User,
      admin_request_action_required: Clock
    };

    const IconComponent = iconMap[type] || Info;
    
    const getIconColor = () => {
      switch (type) {
        case 'admin_request_approved':
        case 'admin_privileges_granted':
        case 'login_success':
        case 'file_processed':
        case 'analysis_ready':
          return 'text-green-500';
        case 'admin_request_rejected':
        case 'user_deletion':
        case 'admin_privileges_revoked':
        case 'suspicious_activity':
          return 'text-red-500';
        case 'admin_request_pending':
        case 'user_activity_alert':
        case 'quota_warning':
        case 'system_maintenance':
          return 'text-yellow-500';
        case 'security_alert':
        case 'password_changed':
          return 'text-red-600';
        case 'system_milestone':
        case 'data_analysis_completed':
        case 'performance_report':
        case 'analytics_report_ready':
        case 'analytics_data_ready':
          return 'text-blue-500';
        case 'new_user_registration':
        case 'file_upload_activity':
        case 'welcome_user':
        case 'feature_announcement':
          return 'text-purple-500';
        case 'account_updated':
        case 'new_user_assigned':
        case 'user_support_request':
        case 'admin_user_action_required':
          return 'text-indigo-500';
        // Tab-specific notification colors
        case 'dashboard_update':
          return 'text-blue-600';
        case 'charts_template_added':
        case 'chart_generation_complete':
          return 'text-green-500';
        case 'files_processing_complete':
          return 'text-orange-500';
        case 'admin_request_action_required':
          return 'text-red-500';
        default:
          return 'text-gray-500';
      }
    };

    return <IconComponent className={`w-5 h-5 ${getIconColor()}`} />;
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[priority] || colors.medium}`}>
        {priority}
      </span>
    );
  };

  const getCategoryBadge = (category) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      system: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      user: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      security: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      analytics: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[category] || colors.system}`}>
        {category}
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed right-4 top-20 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 flex flex-col"
      style={{ 
        maxHeight: '80vh',
        overflow: 'hidden' // Prevent scroll on main container
      }}
      onWheel={(e) => {
        // Allow wheel events to bubble to the scrollable content
        if (!scrollRef.current?.contains(e.target)) {
          e.preventDefault();
        }
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-1 rounded text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Filter notifications"
          >
            <Filter className="w-4 h-4" />
          </button>
          
          {/* Mark All Read Button */}
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="p-1 rounded text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="Mark all as read"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
          
          {/* Cleanup Read Notifications Button */}
          {notifications.some(n => n.isRead) && (
            <button
              onClick={cleanupReadNotifications}
              className="p-1 rounded text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
              title="Remove all read notifications"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-1 rounded text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex-shrink-0">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Categories</option>
                <option value="admin">Admin</option>
                <option value="system">System</option>
                <option value="user">User</option>
                <option value="security">Security</option>
                <option value="analytics">Analytics</option>
                <optgroup label="Tab Categories">
                  <option value="dashboard_tab">Dashboard</option>
                  <option value="analytics_tab">Analytics Tab</option>
                  <option value="charts_tab">Charts Tab</option>
                  <option value="files_tab">Files Tab</option>
                  <option value="admin_users_tab">Admin Users</option>
                  <option value="admin_requests_tab">Admin Requests</option>
                </optgroup>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto min-h-0 notification-scroll"
        style={{ 
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch'
        }}
        onWheel={(e) => {
          // Ensure wheel events are handled properly within the scroll area
          e.stopPropagation();
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">
              No notifications yet
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map((notification) => (
              <motion.div
                key={notification._id}
                layout
                className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group ${
                  !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          !notification.isRead 
                            ? 'text-gray-900 dark:text-white' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {notification.title}
                        </p>
                        <p className={`text-sm mt-1 ${
                          !notification.isRead 
                            ? 'text-gray-800 dark:text-gray-200' 
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {notification.message}
                        </p>
                        
                        {/* Badges */}
                        <div className="flex items-center space-x-2 mt-2">
                          {getCategoryBadge(notification.category)}
                          {getPriorityBadge(notification.priority)}
                          {notification.actionUrl && (
                            <span className="inline-flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400">
                              <ExternalLink className="w-3 h-3" />
                              <span>View</span>
                            </span>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.isRead && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification._id);
                              }}
                              className="p-1 rounded text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                              title="Mark as read and hide"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification._id);
                              }}
                              className="p-1 rounded text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                              title="Ignore (mark as read and hide)"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={(e) => deleteNotification(notification._id, e)}
                          className="p-1 rounded text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          title="Delete notification"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default NotificationPanel;
