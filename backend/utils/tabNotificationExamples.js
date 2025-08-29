// Tab-specific notification examples for different application sections

import NotificationService from '../services/NotificationService.js';

// Example usage patterns for tab-specific notifications

// 1. Dashboard notifications
export const notifyDashboardUpdate = async (user, updateType) => {
  await NotificationService.notifyDashboardUpdate(user, updateType, {
    timestamp: new Date().toISOString()
  });
};

// 2. Analytics section notifications
export const notifyFileAnalysisComplete = async (user, fileName) => {
  await NotificationService.notifyAnalyticsEvent(user, 'File Analysis Complete', fileName);
};

// 3. Chart creation notifications
export const notifyNewChartCreated = async (user, chartType, fileName) => {
  await NotificationService.notifyChartCreated(user, chartType, fileName);
};

// 4. File management notifications
export const notifyFileUploaded = async (user, fileName) => {
  await NotificationService.notifyFileUploaded(user, fileName);
};

// 5. Admin panel notifications with sub-sections
export const notifyAdminUserEvent = async (eventType, data) => {
  await NotificationService.notifyAdminEvent(eventType, {
    message: data.message,
    priority: data.priority || 'medium'
  }, 'users'); // sub-section: users
};

export const notifyAdminRequestEvent = async (eventType, data) => {
  await NotificationService.notifyAdminEvent(eventType, {
    message: data.message,
    priority: data.priority || 'high'
  }, 'requests'); // sub-section: requests
};

// 6. Profile notifications
export const notifyProfileUpdate = async (user, updateType) => {
  await NotificationService.notifyProfileEvent(
    user, 
    'profile_update', 
    `Your ${updateType} has been updated successfully`
  );
};

// 7. Settings notifications
export const notifySettingsChange = async (user, settingType, change) => {
  await NotificationService.notifySettingsChange(user, settingType, change);
};

// 8. Bulk tab-specific notifications
export const notifyTabEvent = async (tabSection, subSection, eventData) => {
  await NotificationService.notifyTabSpecificEvent(tabSection, subSection, eventData);
};

// Usage examples:

/*

// When a file is uploaded in the Analytics section:
await notifyFileUploaded(user, 'sales_data.xlsx');

// When analysis completes in the Analytics section:
await notifyFileAnalysisComplete(user, 'sales_data.xlsx');

// When a new chart is created in the Charts section:
await notifyNewChartCreated(user, 'Bar Chart', 'sales_data.xlsx');

// When a user is added in Admin > User Management:
await notifyAdminUserEvent('user_added', {
  message: 'New user John Doe has been added to the system',
  priority: 'medium'
});

// When an admin request is received in Admin > Requests:
await notifyAdminRequestEvent('new_request', {
  message: 'Jane Smith has requested admin privileges',
  priority: 'high'
});

// When profile is updated in Profile section:
await notifyProfileUpdate(user, 'email address');

// When system settings change in Settings section:
await notifySettingsChange(user, 'notification preferences', 'updated');

// Generic tab-specific notification:
await notifyTabEvent('analytics', null, {
  title: 'Analytics System Update',
  message: 'New analytics features are now available',
  priority: 'medium',
  category: 'analytics',
  targetRoles: ['user', 'admin', 'superadmin']
});

*/
