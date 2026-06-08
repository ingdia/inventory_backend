const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const medicineRoutes = require('./modules/medicines/medicine.routes');
const inventoryRoutes = require('./modules/inventory/inventory.routes');
const errorHandler = require('./middleware/error.middleware');
const { authLimiter, apiLimiter } = require('./middleware/rateLimiter');

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN,
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging (dev only)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/inventory', inventoryRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ success: true, message: 'Pharmacy API is running.' }));

// 404 handler
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));

// Global error handler
app.use(errorHandler);

module.exports = app;
