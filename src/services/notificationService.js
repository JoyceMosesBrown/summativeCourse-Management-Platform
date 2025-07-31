const Bull = require('bull');
const { client: redisClient } = require('../config/redis');
const { User, Facilitator, Manager, ActivityTracker, CourseOffering, Module } = require('../models');
const logger = require('../utils/logger');

// Create notification queue
const notificationQueue = new Bull('notification queue', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined
  }
});

// Create reminder queue for deadline notifications
const reminderQueue = new Bull('reminder queue', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined
  }
});

/**
 * Queue a notification
 * @param {Object} notificationData - The notification data
 * @param {string} notificationData.type - Type of notification
 * @param {string} notificationData.facilitatorId - Facilitator ID
 * @param {string} notificationData.assignmentId - Course allocation ID
 * @param {number} notificationData.weekNumber - Week number
 * @param {boolean} notificationData.isLate - Whether submission is late
 * @param {Date} notificationData.submittedAt - Submission timestamp
 */
const queueNotification = async (notificationData) => {
  try {
    await notificationQueue.add('process-notification', notificationData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });
    logger.info('Notification queued successfully', notificationData);
  } catch (error) {
    logger.error('Error queuing notification:', error);
    throw error;
  }
};

/**
 * Queue reminder notifications for missing submissions
 * @param {number} weekNumber - Current week number
 */
const queueMissingSubmissionReminders = async (weekNumber) => {
  try {
    await reminderQueue.add('check-missing-submissions', { weekNumber }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });
    logger.info(`Reminder check queued for week ${weekNumber}`);
  } catch (error) {
    logger.error('Error queuing reminder check:', error);
    throw error;
  }
};

// Process notification queue
notificationQueue.process('process-notification', async (job) => {
  const { type, facilitatorId, assignmentId, weekNumber, isLate, submittedAt } = job.data;
  
  try {
    // Get facilitator and course details
    const facilitator = await Facilitator.findByPk(facilitatorId, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['firstName', 'lastName', 'email']
      }]
    });

    const courseOffering = await CourseOffering.findByPk(assignmentId, {
      include: [{
        model: Module,
        as: 'module',
        attributes: ['code', 'name']
      }]
    });

    if (!facilitator || !courseOffering) {
      throw new Error('Facilitator or course offering not found');
    }

    // Create notification message
    let message = '';
    let subject = '';

    switch (type) {
      case 'activity_log_submitted':
        subject = `Activity Log Submitted - Week ${weekNumber}`;
        message = `Facilitator ${facilitator.user.firstName} ${facilitator.user.lastName} has submitted their activity log for ${courseOffering.module.code} - ${courseOffering.module.name}, Week ${weekNumber}.`;
        if (isLate) {
          message += ' This submission was made after the deadline.';
        }
        break;
      
      case 'missing_submission_reminder':
        subject = `Missing Activity Log - Week ${weekNumber}`;
        message = `Reminder: Facilitator ${facilitator.user.firstName} ${facilitator.user.lastName} has not submitted their activity log for ${courseOffering.module.code} - ${courseOffering.module.name}, Week ${weekNumber}.`;
        break;
      
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    // Store notification in Redis for managers to retrieve
    const notificationKey = `notifications:managers`;
    const notification = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      subject,
      message,
      facilitatorId,
      facilitatorName: `${facilitator.user.firstName} ${facilitator.user.lastName}`,
      facilitatorEmail: facilitator.user.email,
      courseCode: courseOffering.module.code,
      courseName: courseOffering.module.name,
      weekNumber,
      isLate: isLate || false,
      timestamp: submittedAt || new Date(),
      read: false
    };

    await redisClient.lPush(notificationKey, JSON.stringify(notification));
    
    // Keep only last 100 notifications
    await redisClient.lTrim(notificationKey, 0, 99);

    // Log notification delivery
    logger.info('Notification processed and stored:', {
      type,
      facilitatorId,
      weekNumber,
      subject
    });

    // In a real application, you might also send emails here
    // await sendEmailNotification(managerEmail, subject, message);

    return { success: true, notificationId: notification.id };
  } catch (error) {
    logger.error('Error processing notification:', error);
    throw error;
  }
});

// Process reminder queue
reminderQueue.process('check-missing-submissions', async (job) => {
  const { weekNumber } = job.data;
  
  try {
    // Get all active course offerings
    const courseOfferings = await CourseOffering.findAll({
      where: { isActive: true },
      include: [
        {
          model: Facilitator,
          as: 'facilitator',
          include: [{
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName', 'email']
          }]
        },
        {
          model: Module,
          as: 'module',
          attributes: ['code', 'name']
        }
      ]
    });

    // Check for missing submissions
    for (const offering of courseOfferings) {
      const existingLog = await ActivityTracker.findOne({
        where: {
          assignmentId: offering.id,
          weekNumber
        }
      });

      // If no log exists, queue a reminder notification
      if (!existingLog) {
        await queueNotification({
          type: 'missing_submission_reminder',
          facilitatorId: offering.facilitatorId,
          assignmentId: offering.id,
          weekNumber
        });
      }
    }

    logger.info(`Missing submission check completed for week ${weekNumber}`);
    return { success: true, weekNumber };
  } catch (error) {
    logger.error('Error checking missing submissions:', error);
    throw error;
  }
});

// Queue error handlers
notificationQueue.on('failed', (job, err) => {
  logger.error(`Notification job ${job.id} failed:`, err);
});

reminderQueue.on('failed', (job, err) => {
  logger.error(`Reminder job ${job.id} failed:`, err);
});

// Queue completed handlers
notificationQueue.on('completed', (job, result) => {
  logger.info(`Notification job ${job.id} completed:`, result);
});

reminderQueue.on('completed', (job, result) => {
  logger.info(`Reminder job ${job.id} completed:`, result);
});

/**
 * Get notifications for managers
 * @param {number} limit - Number of notifications to retrieve
 * @param {number} offset - Offset for pagination
 */
const getManagerNotifications = async (limit = 20, offset = 0) => {
  try {
    const notificationKey = 'notifications:managers';
    const notifications = await redisClient.lRange(notificationKey, offset, offset + limit - 1);
    
    return notifications.map(notification => JSON.parse(notification));
  } catch (error) {
    logger.error('Error retrieving manager notifications:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 */
const markNotificationAsRead = async (notificationId) => {
  try {
    const notificationKey = 'notifications:managers';
    const notifications = await redisClient.lRange(notificationKey, 0, -1);
    
    for (let i = 0; i < notifications.length; i++) {
      const notification = JSON.parse(notifications[i]);
      if (notification.id === notificationId) {
        notification.read = true;
        await redisClient.lSet(notificationKey, i, JSON.stringify(notification));
        break;
      }
    }
    
    logger.info(`Notification ${notificationId} marked as read`);
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    throw error;
  }
};

// Schedule weekly reminder checks (in a real application, you'd use a cron job)
const scheduleWeeklyReminders = () => {
  const currentWeek = Math.ceil((new Date() - new Date(new Date().getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000));
  
  // Schedule reminder check for current week (runs every day at 9 AM)
  reminderQueue.add('check-missing-submissions', { weekNumber: currentWeek }, {
    repeat: { cron: '0 9 * * *' }, // Daily at 9 AM
    attempts: 3
  });
  
  logger.info(`Scheduled weekly reminder checks for week ${currentWeek}`);
};

module.exports = {
  queueNotification,
  queueMissingSubmissionReminders,
  getManagerNotifications,
  markNotificationAsRead,
  scheduleWeeklyReminders,
  notificationQueue,
  reminderQueue
};