const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CourseOffering = sequelize.define('CourseOffering', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    moduleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'modules',
        key: 'id'
      }
    },
    facilitatorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'facilitators',
        key: 'id'
      }
    },
    cohortId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'cohorts',
        key: 'id'
      }
    },
    classId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'classes',
        key: 'id'
      }
    },
    modeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'modes',
        key: 'id'
      }
    },
    trimester: {
      type: DataTypes.ENUM('T1', 'T2', 'T3'),
      allowNull: false
    },
    maxEnrollment: {
      type: DataTypes.INTEGER,
      defaultValue: 30
    },
    currentEnrollment: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    location: {
      type: DataTypes.STRING
    },
    schedule: {
      type: DataTypes.JSON // Store weekly schedule as JSON
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'course_offerings',
    indexes: [
      {
        unique: true,
        fields: ['moduleId', 'cohortId', 'classId', 'trimester']
      }
    ]
  });

  CourseOffering.associate = (models) => {
    CourseOffering.belongsTo(models.Module, { foreignKey: 'moduleId', as: 'module' });
    CourseOffering.belongsTo(models.Facilitator, { foreignKey: 'facilitatorId', as: 'facilitator' });
    CourseOffering.belongsTo(models.Cohort, { foreignKey: 'cohortId', as: 'cohort' });
    CourseOffering.belongsTo(models.Class, { foreignKey: 'classId', as: 'class' });
    CourseOffering.belongsTo(models.Mode, { foreignKey: 'modeId', as: 'mode' });
    CourseOffering.hasMany(models.ActivityTracker, { foreignKey: 'assignmentId', as: 'facilitatorReports' });
  };

  return CourseOffering;
};