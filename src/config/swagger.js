const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PharmaManager API',
      version: '1.0.0',
      description: 'Full API documentation for PharmaManager inventory backend',
    },
    servers: [{ url: 'http://localhost:5000/api', description: 'Development server' }],
    components: {
      securitySchemes: {
        BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
          },
        },
        Metrics: {
          type: 'object',
          properties: {
            totalRevenue:      { type: 'number', example: 500000 },
            todayRevenue:      { type: 'number', example: 25000 },
            totalTransactions: { type: 'number', example: 120 },
            todayTransactions: { type: 'number', example: 8 },
            totalProfit:       { type: 'number', example: 150000 },
            totalMedicines:    { type: 'number', example: 45 },
            lowStockCount:     { type: 'number', example: 5 },
            expiringCount:     { type: 'number', example: 3 },
            trends: {
              type: 'object',
              properties: {
                revenueTrend:      { type: 'number', example: 12.5 },
                transactionsTrend: { type: 'number', example: 8.3 },
              },
            },
          },
        },
        ProfitSummary: {
          type: 'object',
          properties: {
            totalRevenue: { type: 'number', example: 500000 },
            totalCOGS:    { type: 'number', example: 300000 },
            grossProfit:  { type: 'number', example: 200000 },
            grossMargin:  { type: 'number', example: 40.0 },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: [
    './src/routes/auth.routes.js',
    './src/routes/user.routes.js',
    './src/modules/medicines/medicine.routes.js',
    './src/modules/inventory/inventory.routes.js',
    './src/modules/dashboard/dashboard.routes.js',
    './src/modules/reports/reports.routes.js',
  ],
};

module.exports = swaggerJsdoc(options);
