import express from 'express';
import cors from 'cors';

import authRoutes from './modules/auth/auth.routes.js';
import flockRoutes from './modules/flocks/flocks.routes.js';
import productionRoutes from './modules/production/production.routes.js';
import rawMaterialRoutes from './modules/raw-materials/raw-materials.routes.js';
import feedFormulaRoutes from './modules/feed-formulas/feed-formulas.routes.js';
import feedProductionRoutes from './modules/feed-production/feed-production.routes.js';
import feedConsumptionRoutes from './modules/feed-consumption/feed-consumption.routes.js';
import expensesRoutes from './modules/expenses/expenses.routes.js';
import inventoryRoutes from './modules/inventory/inventory.routes.js';
import eggSalesRoutes from './modules/egg-sales/egg-sales.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';

const app = express();

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  https://dincom-poultry-frontend.onrender.com
  // Add the deployed frontend URL here when available.
];

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without an Origin header, such as server-to-server
      // requests and command-line API tools.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Origin not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10kb' }));

// API root
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Poultry Management API is running!',
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    message: 'Server is healthy',
  });
});

// Authentication
app.use('/api/auth', authRoutes);

// Farm management modules
app.use('/api/flocks', flockRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/raw-materials', rawMaterialRoutes);
app.use('/api/feed-formulas', feedFormulaRoutes);
app.use('/api/feed-production', feedProductionRoutes);
app.use('/api/feed-consumption', feedConsumptionRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/egg-sales', eggSalesRoutes);
app.use('/api/reports', reportsRoutes);

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Central error handler
app.use((error, req, res, next) => {
  console.error(error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message:
      error.statusCode && error.statusCode < 500
        ? error.message
        : 'Internal server error',
  });
});

export default app;
