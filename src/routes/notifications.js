const express = require('express');
const { authorize } = require('../middleware/auth');
const { getManagerNotifications, markNotificationAsRead } = require('../services/notificationService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         type:
 *           type: string
 *         subject:
 *           type: string
 *         message:
 *           type: string
 *         facilitatorId:
 *           type: string
 *         facilitatorName:
 *           type: string
 *         facilitatorEmail:
 *           type: string
 *         courseCode:
 *           type: string
 *         courseName:
 *           type: string
 *         weekNumber:
 *           type: integer
 *         isLate:
 *           type: boolean
 *         timestamp:
 *           type: string
 *           format: date-time
 *         read:
 *           type: boolean
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get notifications for managers
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *       403:
 *         description: Access denied
 */
router.get('/', authorize('manager'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const notifications = await getManagerNotifications(limit, offset);

    res.json({
      status: 'success',
      data: notifications,
      count: notifications.length
    });
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch notifications'
    });
  }
});

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 *       403:
 *         description: Access denied
 */
router.patch('/:id/read', authorize('manager'), async (req, res) => {
  try {
    const { id } = req.params;

    await markNotificationAsRead(id);

    res.json({
      status: 'success',
      message: 'Notification marked as read'
    });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark notification as read'
    });
  }
});

module.exports = router;