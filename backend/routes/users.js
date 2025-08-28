import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import UserActivity from '../models/UserActivity.js';
import UploadedFile from '../models/UploadedFile.js';
import { protect, requireAdmin, requireOwnerOrAdmin } from '../middleware/auth.js';

const router = express.Router();

// Helper function to log activity
const logActivity = async (userId, activityType, description, metadata = {}, req) => {
  try {
    await UserActivity.logActivity({
      user: userId,
      activityType,
      description,
      metadata,
      ipAddress: req?.ip,
      userAgent: req?.get('User-Agent')
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

// Get all users (admin and superadmin only)
router.get('/', protect, requireAdmin, async (req, res) => {
  try {
    // Regular admins can only see users and other admins
    // Superadmins can see everyone including other superadmins
    let query = {};
    
    if (req.user.role === 'admin') {
      // Regular admins cannot see superadmins
      query.role = { $in: ['user', 'admin'] };
    }
    // Superadmins can see all users (no query restriction)

    const users = await User.find(query).select('-password');
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Failed to get users',
      message: 'Internal server error'
    });
  }
});

// Update user profile
router.put('/profile', protect, [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { firstName, lastName, email } = req.body;

    // Check if email is being changed and if it already exists
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          error: 'Update failed',
          message: 'Email already in use'
        });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, email },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser.getProfile()
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      message: 'Internal server error'
    });
  }
});

// Update user preferences
router.put('/preferences', protect, async (req, res) => {
  try {
    const { theme, chartPreferences } = req.body;

    const updateData = {};
    if (theme) updateData['preferences.theme'] = theme;
    if (chartPreferences) updateData['preferences.chartPreferences'] = chartPreferences;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        user: updatedUser.getProfile()
      }
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      error: 'Failed to update preferences',
      message: 'Internal server error'
    });
  }
});

// Change password
router.put('/change-password', protect, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: 'Password change failed',
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: 'Failed to change password',
      message: 'Internal server error'
    });
  }
});

// Admin: Update user role
router.put('/:userId/role', protect, requireAdmin, [
  body('role')
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { role } = req.body;
    const { userId } = req.params;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User with the specified ID does not exist'
      });
    }

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: {
        user: updatedUser.getProfile()
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      error: 'Failed to update user role',
      message: 'Internal server error'
    });
  }
});

// Admin: Deactivate/Activate user
router.put('/:userId/status', protect, requireAdmin, [
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean value')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { isActive } = req.body;
    const { userId } = req.params;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User with the specified ID does not exist'
      });
    }

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        user: updatedUser.getProfile()
      }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      error: 'Failed to update user status',
      message: 'Internal server error'
    });
  }
});

// Admin: Delete user
router.delete('/:userId', protect, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        error: 'Cannot delete self',
        message: 'You cannot delete your own account'
      });
    }

    // Find the user to be deleted
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User with the specified ID does not exist'
      });
    }

    // Role-based deletion restrictions
    if (req.user.role === 'admin') {
      // Regular admins can only delete users, not other admins or superadmins
      if (userToDelete.role === 'admin' || userToDelete.role === 'superadmin') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Regular admins cannot delete other admins or superadmins'
        });
      }
    } else if (req.user.role === 'superadmin') {
      // Superadmin cannot delete other superadmins (maintain single superadmin)
      if (userToDelete.role === 'superadmin') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Cannot delete superadmin accounts'
        });
      }
    }
    if (userToDelete.role === 'admin') {
      return res.status(403).json({
        error: 'Cannot delete admin',
        message: 'Cannot delete another admin user'
      });
    }

    // Get user info for activity logging
    const userInfo = {
      id: userToDelete._id,
      email: userToDelete.email,
      firstName: userToDelete.firstName,
      lastName: userToDelete.lastName
    };

    // Delete all files associated with the user
    const deletedFiles = await UploadedFile.deleteMany({ user: userId });
    
    // Delete all activities associated with the user
    const deletedActivities = await UserActivity.deleteMany({ user: userId });

    // Delete the user
    await User.findByIdAndDelete(userId);

    // Log the deletion activity
    await logActivity(
      req.user._id,
      'user_management',
      `Deleted user: ${userInfo.email} (${userInfo.firstName} ${userInfo.lastName})`,
      {
        deletedUserId: userInfo.id,
        deletedUserEmail: userInfo.email,
        deletedFilesCount: deletedFiles.deletedCount,
        deletedActivitiesCount: deletedActivities.deletedCount
      },
      req
    );

    res.json({
      success: true,
      message: 'User deleted successfully',
      data: {
        deletedUser: {
          id: userInfo.id,
          email: userInfo.email,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName
        },
        deletedFiles: deletedFiles.deletedCount,
        deletedActivities: deletedActivities.deletedCount
      }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      error: 'Failed to delete user',
      message: 'Internal server error'
    });
  }
});

export default router;
