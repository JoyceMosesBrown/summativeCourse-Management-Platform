const express = require('express');
const { User, Manager, Facilitator, Student } = require('../models');
const { authorize } = require('../middleware/auth');
const { validateUUID } = require('../middleware/validation');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (Manager only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [manager, facilitator, student]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/', authorize('manager'), async (req, res) => {
  try {
    const { role, isActive } = req.query;
    const where = {};

    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const users = await User.findAll({
      where,
      include: [
        { model: Manager, as: 'managerProfile' },
        { model: Facilitator, as: 'facilitatorProfile' },
        { model: Student, as: 'studentProfile' }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      status: 'success',
      data: users,
      count: users.length
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch users'
    });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       404:
 *         description: User not found
 *       403:
 *         description: Access denied
 */
router.get('/:id', validateUUID('id'), async (req, res) => {
  try {
    const { id } = req.params;

    // Users can only view their own profile unless they're a manager
    if (req.user.role !== 'manager' && req.user.id !== id) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only view your own profile.'
      });
    }

    const user = await User.findByPk(id, {
      include: [
        { model: Manager, as: 'managerProfile' },
        { model: Facilitator, as: 'facilitatorProfile' },
        { model: Student, as: 'studentProfile' }
      ]
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      data: user
    });
  } catch (error) {
    logger.error('Error fetching user:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user'
    });
  }
});

/**
 * @swagger
 * /api/users/{id}/activate:
 *   patch:
 *     summary: Activate/deactivate user (Manager only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User status updated successfully
 *       404:
 *         description: User not found
 *       403:
 *         description: Access denied
 */
router.patch('/:id/activate', authorize('manager'), validateUUID('id'), async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        status: 'error',
        message: 'isActive must be a boolean value'
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    await user.update({ isActive });

    logger.info(`User ${id} ${isActive ? 'activated' : 'deactivated'} by manager ${req.user.id}`);

    res.json({
      status: 'success',
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: user
    });
  } catch (error) {
    logger.error('Error updating user status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update user status'
    });
  }
});

module.exports = router;