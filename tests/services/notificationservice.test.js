const Bull = require('bull');
const {
  queueNotification,
  getManagerNotifications,
  markNotificationAsRead
} = require('../../src/services/notificationService');
const {
  User,
  Facilitator,
  Manager,
  CourseOffering,
  Module
} = require('../../src/models');
const { sequelize } = require('../../src/config/database');
const { client: redisClient } = require('../../src/config/redis');

jest.mock('bull');

describe('NotificationService', () => {
  let mockQueue;
  let facilitator, manager, module;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    const managerUser = await User.create({
      email: 'chief.obafemi@lasu.edu.ng',
      password: 'StrongSecurePass1!',
      firstName: 'Obafemi',
      lastName: 'Balogun',
      role: 'manager'
    });

    const facilitatorUser = await User.create({
      email: 'eng.adanna@uniben.edu.ng',
      password: 'EngrPass987!',
      firstName: 'Adanna',
      lastName: 'Okoro',
      role: 'facilitator'
    });

    manager = await Manager.create({
      userId: managerUser.id,
      employeeId: 'MGR081',
      department: 'Engineering'
    });

    facilitator = await Facilitator.create({
      userId: facilitatorUser.id,
      employeeId: 'FAC204',
      specialization: 'Embedded Systems'
    });

    module = await Module.create({
      code: 'EE470',
      name: 'Real-Time Embedded Systems',
      description: 'Design and implementation of embedded systems',
      credits: 6,
      level: 'postgraduate'
    });
  });

  beforeEach(() => {
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-123' }),
      process: jest.fn(),
      on: jest.fn()
    };
    Bull.mockReturnValue(mockQueue);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('queueNotification', () => {
    it('should queue a notification successfully', async () => {
      const data = {
        type: 'activity_log_submitted',
        facilitatorId: facilitator.id,
        assignmentId: 'allocation-test-001',
        weekNumber: 1,
        isLate: false,
        submittedAt: new Date()
      };

      await queueNotification(data);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'process-notification',
        data,
        expect.objectContaining({
          attempts: 3,
          backoff: expect.objectContaining({
            type: 'exponential',
            delay: 2000
          })
        })
      );
    });

    it('should handle queue errors gracefully', async () => {
      mockQueue.add.mockRejectedValue(new Error('Queue failure'));

      const data = {
        type: 'activity_log_submitted',
        facilitatorId: facilitator.id,
        assignmentId: 'allocation-test-002',
        weekNumber: 2
      };

      await expect(queueNotification(data)).rejects.toThrow('Queue failure');
    });
  });

  describe('getManagerNotifications', () => {
    beforeEach(() => {
      redisClient.lRange = jest.fn();
    });

    it('should retrieve manager notifications', async () => {
      const mockNotifications = [
        JSON.stringify({
          id: 'notif-A1',
          type: 'activity_log_submitted',
          subject: 'Log Submitted',
          message: 'Weekly log submitted',
          facilitatorId: facilitator.id,
          weekNumber: 1,
          timestamp: new Date(),
          read: false
        })
      ];

      redisClient.lRange.mockResolvedValue(mockNotifications);

      const result = await getManagerNotifications(10, 0);

      expect(redisClient.lRange).toHaveBeenCalledWith('notifications:managers', 0, 9);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('activity_log_submitted');
      expect(result[0].read).toBe(false);
    });

    it('should return empty array for no notifications', async () => {
      redisClient.lRange.mockResolvedValue([]);
      const result = await getManagerNotifications();
      expect(result).toHaveLength(0);
    });

    it('should throw error on Redis failure', async () => {
      redisClient.lRange.mockRejectedValue(new Error('Redis failure'));
      await expect(getManagerNotifications()).rejects.toThrow('Redis failure');
    });
  });

  describe('markNotificationAsRead', () => {
    beforeEach(() => {
      redisClient.lRange = jest.fn();
      redisClient.lSet = jest.fn();
    });

    it('should mark a notification as read', async () => {
      const mockNotifications = [
        JSON.stringify({ id: 'notif-1', type: 'activity_log_submitted', read: false }),
        JSON.stringify({ id: 'notif-2', type: 'missing_submission_reminder', read: false })
      ];

      redisClient.lRange.mockResolvedValue(mockNotifications);
      redisClient.lSet.mockResolvedValue('OK');

      await markNotificationAsRead('notif-1');

      expect(redisClient.lRange).toHaveBeenCalledWith('notifications:managers', 0, -1);
      expect(redisClient.lSet).toHaveBeenCalledWith(
        'notifications:managers',
        0,
        expect.stringContaining('"read":true')
      );
    });

    it('should skip update if ID not found', async () => {
      const mockNotifications = [
        JSON.stringify({ id: 'notif-1', type: 'activity_log_submitted', read: false })
      ];

      redisClient.lRange.mockResolvedValue(mockNotifications);

      await expect(markNotificationAsRead('non-existent')).resolves.not.toThrow();
      expect(redisClient.lSet).not.toHaveBeenCalled();
    });
  });

  describe('Notification Processing', () => {
    it('should register process handler for activity log notification', async () => {
      expect(mockQueue.process).toHaveBeenCalledWith(
        'process-notification',
        expect.any(Function)
      );
    });

    it('should register process handler for submission reminder', async () => {
      expect(mockQueue.process).toHaveBeenCalled();
    });
  });

  describe('Queue Error Handling', () => {
    it('should handle failed jobs', () => {
      const failed = mockQueue.on.mock.calls.find(call => call[0] === 'failed');
      expect(failed).toBeDefined();
      expect(typeof failed[1]).toBe('function');
    });

    it('should handle completed jobs', () => {
      const completed = mockQueue.on.mock.calls.find(call => call[0] === 'completed');
      expect(completed).toBeDefined();
      expect(typeof completed[1]).toBe('function');
    });
  });
});
