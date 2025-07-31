const express = require('express');
const { Op } = require('sequelize');
const { CourseOffering, Module, Facilitator, Cohort, Class, Mode, User } = require('../models');
const { authorize } = require('../middleware/auth');
const { validateCourseOffering, validateUUID } = require('../middleware/validation');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CourseOffering:
 *       type: object
 *       required:
 *         - moduleId
 *         - facilitatorId
 *         - cohortId
 *         - classId
 *         - modeId
 *         - trimester
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         moduleId:
 *           type: string
 *           format: uuid
 *         facilitatorId:
 *           type: string
 *           format: uuid
 *         cohortId:
 *           type: string
 *           format: uuid
 *         classId:
 *           type: string
 *           format: uuid
 *         modeId:
 *           type: string
 *           format: uuid
 *         trimester:
 *           type: string
 *           enum: [T1, T2, T3]
 *         maxEnrollment:
 *           type: integer
 *         currentEnrollment:
 *           type: integer
 *         location:
 *           type: string
 *         schedule:
 *           type: object
 *         isActive:
 *           type: boolean
 */

/**
 * @swagger
 * /api/course-allocations:
 *   get:
 *     summary: Get course allocations with filtering
 *     tags: [Course Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: trimester
 *         schema:
 *           type: string
 *           enum: [T1, T2, T3]
 *       - in: query
 *         name: cohortId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: facilitatorId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: modeId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Course allocations retrieved successfully
 */
router.get('/', async (req, res) => {
  try {
    const { trimester, cohortId, facilitatorId, modeId, classId } = req.query;
    const where = { isActive: true };

    // Build filter conditions
    if (trimester) where.trimester = trimester;
    if (cohortId) where.cohortId = cohortId;
    if (facilitatorId) where.facilitatorId = facilitatorId;
    if (modeId) where.modeId = modeId;
    if (classId) where.classId = classId;

    // If user is facilitator, only show their allocations
    if (req.user.role === 'facilitator') {
      const facilitator = req.user.facilitatorProfile;
      if (facilitator) {
        where.facilitatorId = facilitator.id;
      }
    }

    const courseOfferings = await CourseOffering.findAll({
      where,
      include: [
        {
          model: Module,
          as: 'module',
          attributes: ['id', 'code', 'name', 'description', 'credits', 'level']
        },
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
          model: Cohort,
          as: 'cohort',
          attributes: ['id', 'name', 'year', 'program', 'intakePeriod']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'code', 'year', 'semester', 'startDate', 'endDate']
        },
        {
          model: Mode,
          as: 'mode',
          attributes: ['id', 'name', 'description']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      status: 'success',
      data: courseOfferings,
      count: courseOfferings.length
    });
  } catch (error) {
    logger.error('Error fetching course allocations:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch course allocations'
    });
  }
});

/**
 * @swagger
 * /api/course-allocations/{id}:
 *   get:
 *     summary: Get course allocation by ID
 *     tags: [Course Assignments]
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
 *         description: Course allocation retrieved successfully
 *       404:
 *         description: Course allocation not found
 */
router.get('/:id', validateUUID('id'), async (req, res) => {
  try {
    const { id } = req.params;
    const where = { id, isActive: true };

    // If user is facilitator, only show their allocations
    if (req.user.role === 'facilitator') {
      const facilitator = req.user.facilitatorProfile;
      if (facilitator) {
        where.facilitatorId = facilitator.id;
      }
    }

    const courseOffering = await CourseOffering.findOne({
      where,
      include: [
        {
          model: Module,
          as: 'module',
          attributes: ['id', 'code', 'name', 'description', 'credits', 'level']
        },
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
          model: Cohort,
          as: 'cohort',
          attributes: ['id', 'name', 'year', 'program', 'intakePeriod']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'code', 'year', 'semester', 'startDate', 'endDate']
        },
        {
          model: Mode,
          as: 'mode',
          attributes: ['id', 'name', 'description']
        }
      ]
    });

    if (!courseOffering) {
      return res.status(404).json({
        status: 'error',
        message: 'Course allocation not found'
      });
    }

    res.json({
      status: 'success',
      data: courseOffering
    });
  } catch (error) {
    logger.error('Error fetching course allocation:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch course allocation'
    });
  }
});

/**
 * @swagger
 * /api/course-allocations:
 *   post:
 *     summary: Create new course allocation (Manager only)
 *     tags: [Course Assignments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CourseOffering'
 *     responses:
 *       201:
 *         description: Course allocation created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 */
router.post('/', authorize('manager'), validateCourseOffering, async (req, res) => {
  try {
    const {
      moduleId,
      facilitatorId,
      cohortId,
      classId,
      modeId,
      trimester,
      maxEnrollment,
      location,
      schedule
    } = req.body;

    // Check for existing allocation
    const existingAllocation = await CourseOffering.findOne({
      where: {
        moduleId,
        cohortId,
        classId,
        trimester,
        isActive: true
      }
    });

    if (existingAllocation) {
      return res.status(409).json({
        status: 'error',
        message: 'Course allocation already exists for this module, cohort, class, and trimester'
      });
    }

    const courseOffering = await CourseOffering.create({
      moduleId,
      facilitatorId,
      cohortId,
      classId,
      modeId,
      trimester,
      maxEnrollment: maxEnrollment || 30,
      location,
      schedule
    });

    // Fetch the created allocation with associations
    const createdAllocation = await CourseOffering.findByPk(courseOffering.id, {
      include: [
        {
          model: Module,
          as: 'module',
          attributes: ['id', 'code', 'name', 'description', 'credits', 'level']
        },
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
          model: Cohort,
          as: 'cohort',
          attributes: ['id', 'name', 'year', 'program', 'intakePeriod']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'code', 'year', 'semester', 'startDate', 'endDate']
        },
        {
          model: Mode,
          as: 'mode',
          attributes: ['id', 'name', 'description']
        }
      ]
    });

    logger.info(`Course allocation created: ${courseOffering.id} by manager ${req.user.id}`);

    res.status(201).json({
      status: 'success',
      message: 'Course allocation created successfully',
      data: createdAllocation
    });
  } catch (error) {
    logger.error('Error creating course allocation:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create course allocation'
    });
  }
});

/**
 * @swagger
 * /api/course-allocations/{id}:
 *   put:
 *     summary: Update course allocation (Manager only)
 *     tags: [Course Assignments]
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
 *             $ref: '#/components/schemas/CourseOffering'
 *     responses:
 *       200:
 *         description: Course allocation updated successfully
 *       404:
 *         description: Course allocation not found
 *       403:
 *         description: Access denied
 */
router.put('/:id', authorize('manager'), validateUUID('id'), validateCourseOffering, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const courseOffering = await CourseOffering.findOne({
      where: { id, isActive: true }
    });

    if (!courseOffering) {
      return res.status(404).json({
        status: 'error',
        message: 'Course allocation not found'
      });
    }

    await courseOffering.update(updateData);

    // Fetch updated allocation with associations
    const updatedAllocation = await CourseOffering.findByPk(id, {
      include: [
        {
          model: Module,
          as: 'module',
          attributes: ['id', 'code', 'name', 'description', 'credits', 'level']
        },
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
          model: Cohort,
          as: 'cohort',
          attributes: ['id', 'name', 'year', 'program', 'intakePeriod']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'code', 'year', 'semester', 'startDate', 'endDate']
        },
        {
          model: Mode,
          as: 'mode',
          attributes: ['id', 'name', 'description']
        }
      ]
    });

    logger.info(`Course allocation updated: ${id} by manager ${req.user.id}`);

    res.json({
      status: 'success',
      message: 'Course allocation updated successfully',
      data: updatedAllocation
    });
  } catch (error) {
    logger.error('Error updating course allocation:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update course allocation'
    });
  }
});

/**
 * @swagger
 * /api/course-allocations/{id}:
 *   delete:
 *     summary: Delete course allocation (Manager only)
 *     tags: [Course Assignments]
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
 *         description: Course allocation deleted successfully
 *       404:
 *         description: Course allocation not found
 *       403:
 *         description: Access denied
 */
router.delete('/:id', authorize('manager'), validateUUID('id'), async (req, res) => {
  try {
    const { id } = req.params;

    const courseOffering = await CourseOffering.findOne({
      where: { id, isActive: true }
    });

    if (!courseOffering) {
      return res.status(404).json({
        status: 'error',
        message: 'Course allocation not found'
      });
    }

    // Soft delete
    await courseOffering.update({ isActive: false });

    logger.info(`Course allocation deleted: ${id} by manager ${req.user.id}`);

    res.json({
      status: 'success',
      message: 'Course allocation deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting course allocation:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete course allocation'
    });
  }
});

module.exports = router;