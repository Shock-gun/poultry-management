import express from 'express';
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

app.use(express.json({ limit: '10kb' }));

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Poultry Management API is running!'
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    message: 'Server is healthy'
  });
});

// Mount the authentication module
app.use('/api/auth', authRoutes);

// Mount the flock module
app.use('/api/flocks', flockRoutes);

// Mount the production module
app.use('/api/production', productionRoutes);
  
// Mount the raw materials module
app.use('/api/raw-materials', rawMaterialRoutes);
  
// Mount the feed formulas module
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
    message: `Route ${req.method} ${req.originalUrl} not found`
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
        : 'Internal server error'
  });
});

export default app;
