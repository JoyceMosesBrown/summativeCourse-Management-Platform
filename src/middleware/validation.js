const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('role')
    .isIn(['manager', 'facilitator', 'student'])
    .withMessage('Role must be manager, facilitator, or student'),
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

const validateCourseOffering = [
  body('moduleId')
    .isUUID()
    .withMessage('Valid module ID is required'),
  body('facilitatorId')
    .isUUID()
    .withMessage('Valid facilitator ID is required'),
  body('cohortId')
    .isUUID()
    .withMessage('Valid cohort ID is required'),
  body('classId')
    .isUUID()
    .withMessage('Valid class ID is required'),
  body('modeId')
    .isUUID()
    .withMessage('Valid mode ID is required'),
  body('trimester')
    .isIn(['T1', 'T2', 'T3'])
    .withMessage('Trimester must be T1, T2, or T3'),
  body('maxEnrollment')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Max enrollment must be between 1 and 100'),
  handleValidationErrors
];

const validateActivityTracker = [
  body('assignmentId')
    .isUUID()
    .withMessage('Valid allocation ID is required'),
  body('weekNumber')
    .isInt({ min: 1, max: 52 })
    .withMessage('Week number must be between 1 and 52'),
  body('attendance')
    .optional()
    .isArray()
    .withMessage('Attendance must be an array'),
  body('formativeOneGrading')
    .optional()
    .isIn(['Done', 'Pending', 'Not Started'])
    .withMessage('Invalid formative one grading status'),
  body('formativeTwoGrading')
    .optional()
    .isIn(['Done', 'Pending', 'Not Started'])
    .withMessage('Invalid formative two grading status'),
  body('summativeGrading')
    .optional()
    .isIn(['Done', 'Pending', 'Not Started'])
    .withMessage('Invalid summative grading status'),
  body('courseModeration')
    .optional()
    .isIn(['Done', 'Pending', 'Not Started'])
    .withMessage('Invalid course moderation status'),
  body('intranetSync')
    .optional()
    .isIn(['Done', 'Pending', 'Not Started'])
    .withMessage('Invalid intranet sync status'),
  body('gradeBookStatus')
    .optional()
    .isIn(['Done', 'Pending', 'Not Started'])
    .withMessage('Invalid grade book status'),
  handleValidationErrors
];

const validateUUID = (paramName) => [
  param(paramName)
    .isUUID()
    .withMessage(`Valid ${paramName} is required`),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateCourseOffering,
  validateActivityTracker,
  validateUUID
};