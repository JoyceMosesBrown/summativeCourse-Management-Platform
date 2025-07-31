const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const requestLanguage = require('express-request-language');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const mongoose = require('mongoose');
require('dotenv').config();

// const { connectRedis } = require('./config/redis'); // 🔴 DISABLED TEMPORARILY
const logger = require('./utils/logger');

const authRoutes = require('./routes/auth');
const courseAllocationRoutes = require('./routes/courseAllocations'); // ✅ CORRECTED
const activityTrackerRoutes = require('./routes/activityTracker');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');

const errorHandler = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://yourdomain.com']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(requestLanguage({
  languages: ['en', 'fr', 'es'],
  defaultLanguage: 'en'
}));

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Course Management Platform API',
      version: '1.0.0',
      description: 'RESTful API with role-based access control'
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/course-allocations', authenticate, courseAllocationRoutes); // ✅ Correct path
app.use('/api/activity-tracker', authenticate, activityTrackerRoutes);
app.use('/api/users', authenticate, userRoutes);
app.use('/api/notifications', authenticate, notificationRoutes);

app.use('/reflection', express.static('public'));

app.use('*', (req, res) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

app.use(errorHandler);

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    logger.info('MongoDB connected');

    // await connectRedis(); // 🔴 DISABLED TEMPORARILY
    // logger.info('Redis connected');

    app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
      logger.info(`API Docs: http://localhost:${PORT}/api-docs`);
      logger.info(`Reflection Page: http://localhost:${PORT}/reflection`);
    });
  } catch (error) {
    logger.error('Server startup error:', error);
    process.exit(1);
  }
}

['SIGTERM', 'SIGINT'].forEach(signal => {
  process.on(signal, async () => {
    logger.info(`${signal} received. Closing server...`);
    await mongoose.disconnect();
    process.exit(0);
  });
});

if (require.main === module) {
  startServer();
}

module.exports = app;
