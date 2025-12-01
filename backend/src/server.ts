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

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(cookieParser());

// Conditional body parsing - skip for multipart routes
app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';

  // Skip body parsing for multipart/form-data (let multer handle it)
  if (contentType.includes('multipart/form-data')) {
    console.log('⏭️  Skipping express.json() - multipart detected');
    return next();
  }

  // Parse JSON and URL-encoded for other requests
  express.json({ limit: '50mb' })(req, res, (err) => {
    if (err) return next(err);
    express.urlencoded({ extended: true, limit: '50mb' })(req, res, next);
  });
});

// Health checks (bypass site check and rate limit)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'AutoSecure API is running',
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
      name: mongoose.connection.name || 'N/A',
      host: mongoose.connection.host || 'N/A',
      port: mongoose.connection.port || 'N/A',
    });
  } catch (error) {
    console.error('❌ Database health check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/health/detailed', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.floor(uptime),
      formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
    },
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
    },
    nodejs: process.version,
    platform: process.platform,
    env: process.env.NODE_ENV || 'development',
  });
});

// Apply site kill-switch check to all /api routes
app.use('/api', checkSiteEnabled);

// Apply general rate limiting to all /api routes
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

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    console.log('\n🚀 Starting server...\n');

    // Connect to MongoDB
    await connectDatabase();

    // Start Express
    app.listen(PORT, () => {
      console.log(`\n🚀 Backend server running on http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`\n📍 API Endpoints:`);
      console.log(`   Auth:         /api/v1/auth/*`);
      console.log(`   Users:        /api/v1/users/*`);
      console.log(`   Audit Logs:   /api/v1/audit-logs/*`);
      console.log(`   Settings:     /api/v1/settings/*`);
      console.log(`   Meta:         /api/v1/meta/*`);
      console.log(`   Policies:     /api/v1/policies/*`);
      console.log(`   Exports:      /api/v1/exports/*`);
      console.log(`   Files:        /api/v1/files/*`);
      console.log(`\n`);
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
};

startServer();
