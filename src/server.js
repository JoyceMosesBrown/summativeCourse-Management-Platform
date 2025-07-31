require('dotenv').config();
const app = require('./app');
const logger = require('./utils/logger'); // make sure this exists
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    app.listen(PORT, () => {
      logger.info(`Reflection Page: http://localhost:${PORT}/reflection`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }

  ['SIGTERM', 'SIGINT'].forEach(signal => {
    process.on(signal, async () => {
      logger.info(`${signal} received, shutting down`);
      process.exit(0);
    });
  });
}

startServer();
