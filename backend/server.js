import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import analyticsRoutes from './routes/analytics.js';
import User from './models/User.js';
import { getTransporter } from './utils/mailer.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database connection
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/excelAnalytics')
  .then(async () => {
    console.log('Connected to MongoDB');
    // Ensure default admin exists
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@excel-analytics.local';
      const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
      const adminForceReset = (process.env.ADMIN_FORCE_RESET || 'false').toLowerCase() === 'true';
      const firstName = process.env.ADMIN_FIRST_NAME || 'Admin';
      const lastName = process.env.ADMIN_LAST_NAME || 'User';

      const existingAdmin = await User.findOne({ email: adminEmail }).select('+password');
      if (!existingAdmin) {
        const adminUser = new User({
          firstName,
          lastName,
          email: adminEmail,
          password: adminPassword,
          role: 'admin',
        });
        await adminUser.save();
        console.log(`Default admin created: ${adminEmail}`);
      } else {
        let changed = false;
        if (existingAdmin.role !== 'admin') {
          existingAdmin.role = 'admin';
          changed = true;
          console.log(`Existing user promoted to admin: ${adminEmail}`);
        }
        if (adminForceReset && process.env.ADMIN_PASSWORD) {
          existingAdmin.password = adminPassword; // will be hashed by pre-save hook
          changed = true;
          console.log(`Admin password reset as ADMIN_FORCE_RESET=true for: ${adminEmail}`);
        }
        if (changed) {
          await existingAdmin.save();
        }
      }
    } catch (seedErr) {
      console.error('Failed to ensure default admin exists:', seedErr);
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Excel Analytics API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Warm up SMTP transporter on boot so failures are visible early
  getTransporter().catch(() => {});
});
