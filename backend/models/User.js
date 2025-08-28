import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    // Allow TLDs longer than 3 characters (e.g., .local) and be less restrictive
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'superadmin'],
    default: 'user'
  },
  adminStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: function() {
      return this.role === 'admin' ? 'pending' : undefined;
    }
  },
  adminRequestedAt: {
    type: Date,
    default: function() {
      return this.role === 'admin' ? new Date() : undefined;
    }
  },
  adminApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  adminApprovedAt: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  profilePicture: {
    type: String,
    default: null
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    chartPreferences: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }
}, {
  timestamps: true
});

// Password reset fields
userSchema.add({
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  otpCodeHash: { type: String, default: null },
  otpExpires: { type: Date, default: null },
  otpAttempts: { type: Number, default: 0 },
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id, 
      email: this.email, 
      role: this.role 
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

// Get user profile (without password)
userSchema.methods.getProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

const User = mongoose.model('User', userSchema);

export default User;
