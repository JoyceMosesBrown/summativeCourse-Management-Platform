const express = require('express');
const jwt = require('jsonwebtoken');
const { User, Manager, Facilitator, Student } = require('../models');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - firstName
 *         - lastName
 *         - role
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         email:
 *           type: string
 *           format: email
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         role:
 *           type: string
 *           enum: [manager, facilitator, student]
 *         isActive:
 *           type: boolean
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *     AuthResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             token:
 *               type: string
 *             user:
 *               $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/User'
 *               - type: object
 *                 properties:
 *                   password:
 *                     type: string
 *                     minLength: 8
 *                   employeeId:
 *                     type: string
 *                     description: Required for manager and facilitator roles
 *                   studentId:
 *                     type: string
 *                     description: Required for student role
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *       409:
 *         description: User already exists
 */
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, employeeId, studentId, department, specialization } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role
    });

    // Create role-specific profile
    let profile;
    switch (role) {
      case 'manager':
        if (!employeeId || !department) {
          return res.status(400).json({
            status: 'error',
            message: 'Employee ID and department are required for managers'
          });
        }
        profile = await Manager.create({
          userId: user.id,
          employeeId,
          department
        });
        break;

      case 'facilitator':
        if (!employeeId) {
          return res.status(400).json({
            status: 'error',
            message: 'Employee ID is required for facilitators'
          });
        }
        profile = await Facilitator.create({
          userId: user.id,
          employeeId,
          specialization: specialization || null
        });
        break;

      case 'student':
        if (!studentId) {
          return res.status(400).json({
            status: 'error',
            message: 'Student ID is required for students'
          });
        }
        profile = await Student.create({
          userId: user.id,
          studentId
        });
        break;
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    logger.info(`New user registered: ${email} (${role})`);

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        token,
        user: {
          ...user.toJSON(),
          profile
        }
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Registration failed'
    });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validateUserLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with profile
    const user = await User.findOne({
      where: { email },
      include: [
        { model: Manager, as: 'managerProfile' },
        { model: Facilitator, as: 'facilitatorProfile' },
        { model: Student, as: 'studentProfile' }
      ]
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials or account inactive'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    logger.info(`User logged in: ${email}`);

    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        token,
        user
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Login failed'
    });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/User'
 */
router.get('/me', require('../middleware/auth').authenticate, async (req, res) => {
  res.json({
    status: 'success',
    data: req.user
  });
});

module.exports = router;