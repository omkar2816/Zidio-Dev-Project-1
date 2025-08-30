import { EventEmitter } from 'events';

class NotificationEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100); // Increase max listeners for multiple components
  }

  // Emit when notification is created
  notificationCreated(notification) {
    this.emit('notification-created', notification);
  }

  // Emit when notification is marked as read
  notificationRead(notificationId, userId) {
    this.emit('notification-read', { notificationId, userId });
  }

  // Emit when notification is deleted
  notificationDeleted(notificationId, userId) {
    this.emit('notification-deleted', { notificationId, userId });
  }

  // Emit when multiple notifications are deleted
  notificationsDeleted(userId, deletedCount) {
    this.emit('notifications-deleted', { userId, deletedCount });
  }

  // Emit when all notifications are marked as read
  allNotificationsRead(userId) {
    this.emit('all-notifications-read', { userId });
  }

  // Emit when notifications are cleaned up
  notificationsCleanedUp(userId, deletedCount) {
    this.emit('notifications-cleaned-up', { userId, deletedCount });
  }
}

// Export singleton instance
export default new NotificationEventEmitter();
