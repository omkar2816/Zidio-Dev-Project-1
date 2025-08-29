import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import UserActivity from '../models/UserActivity.js';
import AdminRequest from '../models/AdminRequest.js';
import Notification from '../models/Notification.js';
import NotificationService from '../services/NotificationService.js';
import { protect, requireSuperAdmin, requireAdmin } from '../middleware/auth.js';
import crypto from 'crypto';
import { sendMail } from '../utils/mailer.js';

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

// Validation middleware
const validateRegistration = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .isString()
    .isLength({ min: 5 })
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

const validateLogin = [
  body('email')
    .trim()
    .isString()
    .isLength({ min: 5 })
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Register user
router.post('/register', validateRegistration, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { firstName, lastName, email, password, isAdmin = false } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        error: 'Registration failed',
        message: 'User with this email already exists'
      });
    }

    // If registering as admin, create an admin request instead
    if (isAdmin) {
      // Prevent superadmin registration through normal flow
      // Only one superadmin should exist and it should be created manually
      
      // Create user with pending admin status (for regular admin only)
      const user = new User({
        firstName,
        lastName,
        email,
        password,
        role: 'user', // Start as user until approved
        adminStatus: 'pending'
      });

      await user.save();

      // Create admin request
      const adminRequest = new AdminRequest({
        user: user._id,
        status: 'pending'
      });

      await adminRequest.save();

      // Notify superadmins about new admin request
      await NotificationService.notifyAdminRequest(user);

      // Log activity
      await logActivity(user._id, 'registration', 'User registered with admin request', { 
        action: 'admin_registration',
        adminRequestId: adminRequest._id 
      }, req);

      res.status(201).json({
        success: true,
        message: 'Admin request submitted successfully. You will be notified once your request is reviewed.',
        data: {
          user: user.getProfile(),
          adminRequestStatus: 'pending'
        }
      });
    } else {
      // Normal user registration
      const user = new User({
        firstName,
        lastName,
        email,
        password
      });

      await user.save();

      // Notify superadmins about new user registration
      await NotificationService.notifyNewUserRegistration(user);

      // Send welcome notification to the new user
      await NotificationService.notifyWelcomeUser(user);

      // Generate token
      const token = user.generateAuthToken();

      // Update last login
      await user.updateLastLogin();

      // Log activity
      await logActivity(user._id, 'login', 'User registered and logged in', { action: 'registration' }, req);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: user.getProfile(),
          token
        }
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'Internal server error'
    });
  }
});

// Login user
router.post('/login', validateLogin, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        error: 'Login failed',
        message: 'Account not found'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account deactivated',
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Login failed',
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = user.generateAuthToken();

    // Update last login
    await user.updateLastLogin();

    // Log activity
    await logActivity(user._id, 'login', 'User logged in successfully', {}, req);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.getProfile(),
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'Internal server error'
    });
  }
});

// Admin login
router.post('/admin/login', validateLogin, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ 
      email, 
      role: { $in: ['admin', 'superadmin'] } 
    }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        error: 'Admin login failed',
        message: 'Account not found'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account deactivated',
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Admin login failed',
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = user.generateAuthToken();

    // Update last login
    await user.updateLastLogin();

    // Log activity
    await logActivity(user._id, 'login', 'Admin logged in successfully', { role: 'admin' }, req);

    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        user: user.getProfile(),
        token
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      error: 'Admin login failed',
      message: 'Internal server error'
    });
  }
});

// Get current user profile
router.get('/me', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.getProfile()
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Failed to get profile',
      message: 'Internal server error'
    });
  }
});

// Logout (client-side token removal)
router.post('/logout', protect, async (req, res) => {
  try {
    // Log activity
    await logActivity(req.user._id, 'logout', 'User logged out', {}, req);

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: 'Internal server error'
    });
  }
});

// Refresh token
router.post('/refresh', protect, async (req, res) => {
  try {
    const token = req.user.generateAuthToken();
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      message: 'Internal server error'
    });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Invalid request', message: 'Email is required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // Do not reveal whether user exists
      return res.json({ success: true, message: 'If an account exists, a reset link has been sent' });
    }

    // Generate OTP code (6 digits) and hash it
    const otpCode = (Math.floor(100000 + Math.random() * 900000)).toString();
    const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');
    user.otpCodeHash = otpHash;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.otpAttempts = 0;
    await user.save({ validateBeforeSave: false });

    // Send OTP via email (with Ethereal fallback in dev)
    const { info, previewUrl } = await sendMail({
      to: user.email,
      subject: 'Your Excel Analytics password reset OTP',
      text: `Your OTP is ${otpCode}. It expires in 10 minutes.`,
      html: `<p>Your OTP is <strong>${otpCode}</strong>.</p><p>It expires in 10 minutes.</p>`,
    });
    console.log('OTP email queued:', info?.messageId || 'n/a');
    if (previewUrl) {
      console.log(`Preview email at: ${previewUrl}`);
    }

    return res.json({ success: true, message: 'If an account exists, an OTP has been sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request', message: 'Internal server error' });
  }
});

// Reset password with OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Invalid request', message: 'Email, OTP and new password are required' });
    }

    // Optional: basic password policy (must match registration rules)
    const strongPw = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!strongPw.test(newPassword)) {
      return res.status(400).json({
        error: 'Weak password',
        message: 'Password must be at least 6 chars and include upper, lower, and a number'
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(400).json({ error: 'Invalid request', message: 'Invalid email or OTP' });
    }

    // Validate OTP
    if (!user.otpCodeHash || !user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired OTP', message: 'Please request a new OTP' });
    }
    if (user.otpAttempts >= 5) {
      return res.status(429).json({ error: 'Too many attempts', message: 'Please request a new OTP' });
    }
    const providedHash = crypto.createHash('sha256').update(String(otp)).digest('hex');
    if (providedHash !== user.otpCodeHash) {
      user.otpAttempts += 1;
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({ error: 'Invalid OTP', message: 'Please check the OTP and try again' });
    }

    // Success: reset password and clear OTP fields
    user.password = newPassword; // hashed by pre-save hook
    user.otpCodeHash = null;
    user.otpExpires = null;
    user.otpAttempts = 0;
    await user.save();

    res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password', message: 'Internal server error' });
  }
});

// Admin management routes

// Get all admin requests (superadmin only)
router.get('/admin-requests', protect, requireSuperAdmin, async (req, res) => {
  try {
    const adminRequests = await AdminRequest.find()
      .populate('user', 'firstName lastName email createdAt')
      .populate('reviewedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: adminRequests
    });
  } catch (error) {
    console.error('Get admin requests error:', error);
    res.status(500).json({
      error: 'Failed to fetch admin requests',
      message: 'Internal server error'
    });
  }
});

// Approve admin request (superadmin only)
router.post('/admin-requests/:id/approve', protect, requireSuperAdmin, async (req, res) => {
  try {
    const adminRequest = await AdminRequest.findById(req.params.id).populate('user');
    if (!adminRequest) {
      return res.status(404).json({
        error: 'Admin request not found'
      });
    }

    if (adminRequest.status !== 'pending') {
      return res.status(400).json({
        error: 'Request already processed',
        message: 'This admin request has already been approved or rejected'
      });
    }

    // Update admin request
    adminRequest.status = 'approved';
    adminRequest.reviewedBy = req.user._id;
    adminRequest.reviewedAt = new Date();
    await adminRequest.save();

    // Update user role and admin status (make them regular admin, not superadmin)
    const user = await User.findById(adminRequest.user._id);
    user.role = 'admin'; // Regular admin only - superadmin is unique
    user.adminStatus = 'approved';
    await user.save();

    // Create notification for the user
    await NotificationService.notifyAdminApproved(user);

    // Notify superadmins about admin privileges being granted
    await NotificationService.notifyAdminPrivilegesGranted(user, req.user);

    // Log activity
    await logActivity(req.user._id, 'admin_management', 'Approved admin request', {
      action: 'approve_admin',
      targetUserId: user._id,
      adminRequestId: adminRequest._id
    }, req);

    res.json({
      success: true,
      message: 'Admin request approved successfully',
      data: adminRequest
    });
  } catch (error) {
    console.error('Approve admin request error:', error);
    res.status(500).json({
      error: 'Failed to approve admin request',
      message: 'Internal server error'
    });
  }
});

// Reject admin request (superadmin only)
router.post('/admin-requests/:id/reject', protect, requireSuperAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const adminRequest = await AdminRequest.findById(req.params.id).populate('user');
    
    if (!adminRequest) {
      return res.status(404).json({
        error: 'Admin request not found'
      });
    }

    if (adminRequest.status !== 'pending') {
      return res.status(400).json({
        error: 'Request already processed',
        message: 'This admin request has already been approved or rejected'
      });
    }

    // Update admin request
    adminRequest.status = 'rejected';
    adminRequest.reviewedBy = req.user._id;
    adminRequest.reviewedAt = new Date();
    adminRequest.rejectionReason = reason;
    await adminRequest.save();

    // Update user admin status
    const user = await User.findById(adminRequest.user._id);
    user.adminStatus = 'rejected';
    await user.save();

    // Create notification for the user
    await NotificationService.notifyAdminRejected(user, reason);

    // Log activity
    await logActivity(req.user._id, 'admin_management', 'Rejected admin request', {
      action: 'reject_admin',
      targetUserId: user._id,
      adminRequestId: adminRequest._id,
      reason
    }, req);

    res.json({
      success: true,
      message: 'Admin request rejected successfully',
      data: adminRequest
    });
  } catch (error) {
    console.error('Reject admin request error:', error);
    res.status(500).json({
      error: 'Failed to reject admin request',
      message: 'Internal server error'
    });
  }
});

// Get user's admin request status
router.get('/admin-request-status', protect, async (req, res) => {
  try {
    const adminRequest = await AdminRequest.findOne({ user: req.user._id })
      .populate('reviewedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    if (!adminRequest) {
      return res.json({
        success: true,
        data: {
          hasRequest: false,
          status: null
        }
      });
    }

    res.json({
      success: true,
      data: {
        hasRequest: true,
        status: adminRequest.status,
        requestDate: adminRequest.createdAt,
        reviewDate: adminRequest.reviewedAt,
        reviewedBy: adminRequest.reviewedBy,
        rejectionReason: adminRequest.rejectionReason
      }
    });
  } catch (error) {
    console.error('Get admin request status error:', error);
    res.status(500).json({
      error: 'Failed to fetch admin request status',
      message: 'Internal server error'
    });
  }
});

// Get user notifications
router.get('/notifications', protect, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        hasMore: notifications.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      error: 'Failed to fetch notifications',
      message: 'Internal server error'
    });
  }
});

// Mark notification as read
router.patch('/notifications/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      error: 'Failed to mark notification as read',
      message: 'Internal server error'
    });
  }
});

// Mark all notifications as read
router.patch('/notifications/mark-all-read', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      error: 'Failed to mark all notifications as read',
      message: 'Internal server error'
    });
  }
});

export default router;
