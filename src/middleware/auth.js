const jwt = require('jsonwebtoken');
const { User, Manager, Facilitator, Student } = require('../models');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      include: [
        { model: Manager, as: 'managerProfile' },
        { model: Facilitator, as: 'facilitatorProfile' },
        { model: Student, as: 'studentProfile' }
      ]
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token or user not active.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      status: 'error',
      message: 'Invalid token.'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

const authorizeOwnershipOrManager = (getUserIdFromRequest) => {
  return async (req, res, next) => {
    try {
      if (req.user.role === 'manager') {
        return next();
      }

      const resourceUserId = await getUserIdFromRequest(req);
      if (req.user.id === resourceUserId) {
        return next();
      }

      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only access your own resources.'
      });
    } catch (error) {
      logger.error('Authorization error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Authorization check failed.'
      });
    }
  };
};

module.exports = {
  authenticate,
  authorize,
  authorizeOwnershipOrManager
};