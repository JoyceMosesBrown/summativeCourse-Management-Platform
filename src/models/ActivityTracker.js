const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ActivityTracker = sequelize.define('ActivityTracker', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    assignmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'course_offerings',
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
    weekNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 52
      }
    },
    attendance: {
      type: DataTypes.JSON, // Array of boolean values for each class session
      defaultValue: []
    },
    formativeOneGrading: {
      type: DataTypes.ENUM('Done', 'Pending', 'Not Started'),
      defaultValue: 'Not Started'
    },
    formativeTwoGrading: {
      type: DataTypes.ENUM('Done', 'Pending', 'Not Started'),
      defaultValue: 'Not Started'
    },
    summativeGrading: {
      type: DataTypes.ENUM('Done', 'Pending', 'Not Started'),
      defaultValue: 'Not Started'
    },
    courseModeration: {
      type: DataTypes.ENUM('Done', 'Pending', 'Not Started'),
      defaultValue: 'Not Started'
    },
    intranetSync: {
      type: DataTypes.ENUM('Done', 'Pending', 'Not Started'),
      defaultValue: 'Not Started'
    },
    gradeBookStatus: {
      type: DataTypes.ENUM('Done', 'Pending', 'Not Started'),
      defaultValue: 'Not Started'
    },
    notes: {
      type: DataTypes.TEXT
    },
    submittedAt: {
      type: DataTypes.DATE
    },
    isLate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'activity_tracker',
    indexes: [
      {
        unique: true,
        fields: ['assignmentId', 'weekNumber']
      },
      {
        fields: ['facilitatorId', 'weekNumber']
      }
    ]
  });

  ActivityTracker.associate = (models) => {
    ActivityTracker.belongsTo(models.CourseOffering, { foreignKey: 'assignmentId', as: 'courseOffering' });
    ActivityTracker.belongsTo(models.Facilitator, { foreignKey: 'facilitatorId', as: 'facilitator' });
  };

  return ActivityTracker;
};