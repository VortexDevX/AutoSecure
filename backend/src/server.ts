import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { connectDatabase } from './config/database';
import { checkSiteEnabled } from './middleware/siteMiddleware';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware';
import { apiRateLimiter } from './middleware/rateLimitMiddleware';

// Routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import auditLogRoutes from './routes/auditLogRoutes';
import siteSettingsRoutes from './routes/siteSettingsRoutes';
import metaRoutes from './routes/metaRoutes';
import policyRoutes from './routes/policyRoutes';
import exportRoutes from './routes/exportRoutes';
import fileRoutes from './routes/fileRoutes';
import emailTemplateRoutes from './routes/emailTemplateRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import emailRoutes from './routes/emailRoutes';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

const app = express();
app.set('trust proxy', 1);

// CORS first
app.use(
  cors({
    origin: ['http://localhost:3000', 'https://autosecure.vercel.app'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Helmet second (configured to not break CORS)
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  })
);

app.use(cookieParser());

// Conditional body parsing (skip multipart)
app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';

  if (contentType.includes('multipart/form-data')) {
    return next();
  }

  express.json({ limit: '50mb' })(req, res, (err) => {
    if (err) return next(err);
    express.urlencoded({ extended: true, limit: '50mb' })(req, res, next);
  });
});

// Health checks
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'AutoSecure API running',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health/db', (req, res) => {
  try {
    const state = mongoose.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];

    res.json({
      status: state === 1 ? 'ok' : 'error',
      database: states[state],
      readyState: state,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database check failed',
    });
  }
});

// Apply site kill-switch + rate limiter
app.use('/api', checkSiteEnabled);
app.use('/api', apiRateLimiter);

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/audit-logs', auditLogRoutes);
app.use('/api/v1/settings', siteSettingsRoutes);
app.use('/api/v1/meta', metaRoutes);
app.use('/api/v1/policies', policyRoutes);
app.use('/api/v1/exports', exportRoutes);
app.use('/api/v1/files', fileRoutes);
app.use('/api/v1/email-templates', emailTemplateRoutes);
app.use('/api/v1/emails', emailRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      const env = process.env.NODE_ENV || 'development';
      const backendUrl = process.env.BACKEND_URL || `http://localhost:${PORT}`;

      console.log(`🚀 AutoSecure backend running at: ${backendUrl}`);
      console.log(`🌍 Environment: ${env}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
