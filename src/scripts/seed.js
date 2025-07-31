const { sequelize } = require('../models');
const { seedDemoData } = require('../seeders/demo-data');
const { scheduleWeeklyReminders } = require('../services/notificationService');
const logger = require('../utils/logger');

const runSeeder = async () => {
  try {
    logger.info('Connecting to database...');
    await sequelize.authenticate();

    logger.info('Synchronizing database models...');
    await sequelize.sync({ force: true });

    logger.info('Seeding demo data...');
    await seedDemoData();

    logger.info('Setting up notification schedules...');
    scheduleWeeklyReminders();

    logger.info('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  runSeeder();
}

module.exports = { runSeeder };
