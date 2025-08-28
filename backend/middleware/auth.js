import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protect routes - require authentication
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ 
        error: 'Not authorized to access this route',
        message: 'No token provided'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      // Get user from token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({ 
          error: 'Not authorized to access this route',
          message: 'User not found'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({ 
          error: 'Account deactivated',
          message: 'Your account has been deactivated'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ 
        error: 'Not authorized to access this route',
        message: 'Invalid token'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      error: 'Authentication error',
      message: 'Internal server error'
    });
  }
};

// Admin authorization middleware
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Not authorized',
        message: 'User not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }

    next();
  };
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.id).select('-password');
        
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Token is invalid, but we don't fail the request
        console.log('Invalid token in optional auth:', error.message);
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

// Require superadmin role
export const requireSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    next();
  } else {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Super admin access required'
    });
  }
};

// Require admin or superadmin role
export const requireAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
    next();
  } else {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Admin access required'
    });
  }
};

// Require user to be the owner of the resource or admin/superadmin
export const requireOwnerOrAdmin = (req, res, next) => {
  if (req.user && (
    req.user._id.toString() === req.params.id || 
    req.user.role === 'admin' || 
    req.user.role === 'superadmin'
  )) {
    next();
  } else {
    return res.status(403).json({
      error: 'Access denied',
      message: 'You can only access your own resources'
    });
  }
};
