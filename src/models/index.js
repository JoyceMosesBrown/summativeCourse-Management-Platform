const { sequelize } = require('../config/database');

// Import all models
const User = require('./User');
const Manager = require('./Manager');
const Facilitator = require('./Facilitator');
const Student = require('./Student');
const Module = require('./Module');
const Cohort = require('./Cohort');
const Class = require('./Class');
const Mode = require('./Mode');
const CourseOffering = require('./CourseOffering');
const ActivityTracker = require('./ActivityTracker');

// Initialize models
const models = {
  User: User(sequelize),
  Manager: Manager(sequelize),
  Facilitator: Facilitator(sequelize),
  Student: Student(sequelize),
  Module: Module(sequelize),
  Cohort: Cohort(sequelize),
  Class: Class(sequelize),
  Mode: Mode(sequelize),
  CourseOffering: CourseOffering(sequelize),
  ActivityTracker: ActivityTracker(sequelize)
};

// Define associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = {
  sequelize,
  ...models
};