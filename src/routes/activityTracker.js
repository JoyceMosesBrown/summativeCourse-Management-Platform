const express = require('express');
const { Op } = require('sequelize');
const { ActivityTracker, CourseOffering, Module, Facilitator, User, Cohort, Class } = require('../models');
const { authorize } = require('../middleware/auth');
const { validateActivityTracker, validateUUID } = require('../middleware/validation');
const { queueNotification } = require('../services/notificationService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ActivityTracker:
 *       type: object
 *       required:
 *         - assignmentId
 *         - weekNumber
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         assignmentId:
 *           type: string
 *           format: uuid
 *         facilitatorId:
 *           type: string
 *           format: uuid
 *         weekNumber:
 *           type: integer
 *           minimum: 1
 *           maximum: 52
 *         attendance:
 *           type: array
 *           items:
 *             type: boolean
 *         formativeOneGrading:
 *           type: string
 *           enum: [Done, Pending, Not Started]
 *         formativeTwoGrading:
 *           type: string
 *           enum: [Done, Pending, Not Started]
 *         summativeGrading:
 *           type: string
 *           enum: [Done, Pending, Not Started]
 *         courseModeration:
 *           type: string
 *           enum: [Done, Pending, Not Started]
 *         intranetSync:
 *           type: string
 *           enum: [Done, Pending, Not Started]
 *         gradeBookStatus:
 *           type: string
 *           enum: [Done, Pending, Not Started]
 *         notes:
 *           type: string
 *         isLate:
 *           type: boolean
 */

/**
 * @swagger
 * /api/activity-tracker:
 *   get:
 *     summary: Get activity tracker logs with filtering
 *     tags: [Activity Tracker]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: facilitatorId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: assignmentId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: weekNumber
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Done, Pending, Not Started]
 *     responses:
 *       200:
 *         description: Activity logs retrieved successfully
 */
router.get('/', async (req, res) => {
  try {
    const { facilitatorId, assignmentId, weekNumber, status } = req.query;
    const where = {};

    if (facilitatorId) where.facilitatorId = facilitatorId;
    if (assignmentId) where.assignmentId = assignmentId;
    if (weekNumber) where.weekNumber = parseInt(weekNumber);

    if (req.user.role === 'facilitator') {
      const facilitator = req.user.facilitatorProfile;
      if (facilitator) {
        where.facilitatorId = facilitator.id;
      }
    }

    if (status) {
      where[Op.or] = [
        { formativeOneGrading: status },
        { formativeTwoGrading: status },
        { summativeGrading: status },
        { courseModeration: status },
        { intranetSync: status },
        { gradeBookStatus: status }
      ];
    }

    const facilitatorReports = await ActivityTracker.findAll({
      where,
      include: [
        {
          model: CourseOffering,
          as: 'courseOffering',
          include: [
            {
              model: Module,
              as: 'module',
              attributes: ['id', 'code', 'name']
            },
            {
              model: Cohort,
              as: 'cohort',
              attributes: ['id', 'name', 'year', 'program']
            },
            {
              model: Class,
              as: 'class',
              attributes: ['id', 'code', 'year', 'semester']
            }
          ]
        },
        {
          model: Facilitator,
          as: 'facilitator',
          include: [{
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName', 'email']
          }]
        }
      ],
      order: [['weekNumber', 'DESC'], ['createdAt', 'DESC']]
    });

    res.json({
      status: 'success',
      data: facilitatorReports,
      count: facilitatorReports.length
    });
  } catch (error) {
    logger.error('Error fetching activity logs:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch activity logs'
    });
  }
});

/**
 * @swagger
 * /api/activity-tracker/{id}:
 *   get:
 *     summary: Get activity log by ID
 *     tags: [Activity Tracker]
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
 *         description: Activity log retrieved successfully
 *       404:
 *         description: Activity log not found
 */
router.get('/:id', validateUUID('id'), async (req, res) => {
  try {
    const { id } = req.params;
    const where = { id };

    // If user is facilitator, only show their logs
    if (req.user.role === 'facilitator') {
      const facilitator = req.user.facilitatorProfile;
      if (facilitator) {
        where.facilitatorId = facilitator.id;
      }
    }

    const facilitatorReport = await ActivityTracker.findOne({
      where,
      include: [
        {
          model: CourseOffering,
          as: 'courseOffering',
          include: [
            {
              model: Module,
              as: 'module',
              attributes: ['id', 'code', 'name']
            },
            {
              model: Cohort,
              as: 'cohort',
              attributes: ['id', 'name', 'year', 'program']
            },
            {
              model: Class,
              as: 'class',
              attributes: ['id', 'code', 'year', 'semester']
            }
          ]
        },
        {
          model: Facilitator,
          as: 'facilitator',
          include: [{
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName', 'email']
          }]
        }
      ]
    });

    if (!facilitatorReport) {
      return res.status(404).json({
        status: 'error',
        message: 'Activity log not found'
      });
    }

    res.json({
      status: 'success',
      data: facilitatorReport
    });
  } catch (error) {
    logger.error('Error fetching activity log:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch activity log'
    });
  }
});

/**
 * @swagger
 * /api/activity-tracker:
 *   post:
 *     summary: Create new activity log (Facilitator only)
 *     tags: [Activity Tracker]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ActivityTracker'
 *     responses:
 *       201:
 *         description: Activity log created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 */
router.post('/', authorize('facilitator'), validateActivityTracker, async (req, res) => {
  try {
    const facilitator = req.user.facilitatorProfile;
    if (!facilitator) {
      return res.status(403).json({
        status: 'error',
        message: 'Facilitator profile not found'
      });
    }

    const {
      assignmentId,
      weekNumber,
      attendance,
      formativeOneGrading,
      formativeTwoGrading,
      summativeGrading,
      courseModeration,
      intranetSync,
      gradeBookStatus,
      notes
    } = req.body;

    // Verify the allocation belongs to this facilitator
    const courseOffering = await CourseOffering.findOne({
      where: { id: assignmentId, facilitatorId: facilitator.id, isActive: true }
    });

    if (!courseOffering) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only create logs for your assigned courses'
      });
    }

    const existingLog = await ActivityTracker.findOne({
      where: { assignmentId, weekNumber }
    });

    if (existingLog) {
      return res.status(409).json({
        status: 'error',
        message: 'Activity log already exists for this week and course'
      });
    }

    // Calculate if submission is late (assuming deadline is Sunday of each week)
    const currentDate = new Date();
    const weekStartDate = new Date(currentDate.getFullYear(), 0, 1 + (weekNumber - 1) * 7);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6); // Sunday
    const isLate = currentDate > weekEndDate;

    const facilitatorReport = await ActivityTracker.create({
      assignmentId,
      facilitatorId: facilitator.id,
      weekNumber,
      attendance: attendance || [],
      formativeOneGrading: formativeOneGrading || 'Not Started',
      formativeTwoGrading: formativeTwoGrading || 'Not Started',
      summativeGrading: summativeGrading || 'Not Started',
      courseModeration: courseModeration || 'Not Started',
      intranetSync: intranetSync || 'Not Started',
      gradeBookStatus: gradeBookStatus || 'Not Started',
      notes,
      submittedAt: new Date(),
      isLate
    });

    await queueNotification({
      type: 'activity_log_submitted',
      facilitatorId: facilitator.id,
      assignmentId,
      weekNumber,
      isLate,
      submittedAt: new Date()
    });

    const createdLog = await ActivityTracker.findByPk(facilitatorReport.id, {
      include: [
        {
          model: CourseOffering,
          as: 'courseOffering',
          include: [
            {
              model: Module,
              as: 'module',
              attributes: ['id', 'code', 'name']
            },
            {
              model: Cohort,
              as: 'cohort',
              attributes: ['id', 'name', 'year', 'program']
            },
            {
              model: Class,
              as: 'class',
              attributes: ['id', 'code', 'year', 'semester']
            }
          ]
        },
        {
          model: Facilitator,
          as: 'facilitator',
          include: [{
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName', 'email']
          }]
        }
      ]
    });

    logger.info(`Activity log created: ${facilitatorReport.id} by facilitator ${facilitator.id} for week ${weekNumber}`);

    res.status(201).json({
      status: 'success',
      message: 'Activity log created successfully',
      data: createdLog
    });
  } catch (error) {
    logger.error('Error creating activity log:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create activity log'
    });
  }
});

/**
 * @swagger
 * /api/activity-tracker/{id}:
 *   put:
 *     summary: Update activity log (Facilitator can update own logs, Manager can update any)
 *     tags: [Activity Tracker]
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
 *             $ref: '#/components/schemas/ActivityTracker'
 *     responses:
 *       200:
 *         description: Activity log updated successfully
 *       404:
 *         description: Activity log not found
 *       403:
 *         description: Access denied
 */
router.put('/:id', validateUUID('id'), validateActivityTracker, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const where = { id };

    // If user is facilitator, only allow updating their own logs
    if (req.user.role === 'facilitator') {
      const facilitator = req.user.facilitatorProfile;
      if (facilitator) {
        where.facilitatorId = facilitator.id;
      }
    }

    const facilitatorReport = await ActivityTracker.findOne({ where });

    if (!facilitatorReport) {
      return res.status(404).json({
        status: 'error',
        message: 'Activity log not found or access denied'
      });
    }

    // Update submission timestamp and late status
    updateData.submittedAt = new Date();
    
    // Recalculate if submission is late
    const currentDate = new Date();
    const weekStartDate = new Date(currentDate.getFullYear(), 0, 1 + (facilitatorReport.weekNumber - 1) * 7);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    updateData.isLate = currentDate > weekEndDate;

    await facilitatorReport.update(updateData);

    // Fetch updated log with associations
    const updatedLog = await ActivityTracker.findByPk(id, {
      include: [
        {
          model: CourseOffering,
          as: 'courseOffering',
          include: [
            {
              model: Module,
              as: 'module',
              attributes: ['id', 'code', 'name']
            },
            {
              model: Cohort,
              as: 'cohort',
              attributes: ['id', 'name', 'year', 'program']
            },
            {
              model: Class,
              as: 'class',
              attributes: ['id', 'code', 'year', 'semester']
            }
          ]
        },
        {
          model: Facilitator,
          as: 'facilitator',
          include: [{
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName', 'email']
          }]
        }
      ]
    });

    logger.info(`Activity log updated: ${id} by user ${req.user.id}`);

    res.json({
      status: 'success',
      message: 'Activity log updated successfully',
      data: updatedLog
    });
  } catch (error) {
    logger.error('Error updating activity log:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update activity log'
    });
  }
});

/**
 * @swagger
 * /api/activity-tracker/{id}:
 *   delete:
 *     summary: Delete activity log (Manager only)
 *     tags: [Activity Tracker]
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
 *         description: Activity log deleted successfully
 *       404:
 *         description: Activity log not found
 *       403:
 *         description: Access denied
 */
router.delete('/:id', authorize('manager'), validateUUID('id'), async (req, res) => {
  try {
    const { id } = req.params;

    const facilitatorReport = await ActivityTracker.findByPk(id);

    if (!facilitatorReport) {
      return res.status(404).json({
        status: 'error',
        message: 'Activity log not found'
      });
    }

    await facilitatorReport.destroy();

    logger.info(`Activity log deleted: ${id} by manager ${req.user.id}`);

    res.json({
      status: 'success',
      message: 'Activity log deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting activity log:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete activity log'
    });
  }
});

module.exports = router;