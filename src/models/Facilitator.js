const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Facilitator = sequelize.define('Facilitator', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    employeeId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    specialization: {
      type: DataTypes.TEXT
    },
    experienceYears: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    qualifications: {
      type: DataTypes.JSON
    }
  }, {
    tableName: 'facilitators'
  });

  Facilitator.associate = (models) => {
    Facilitator.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Facilitator.hasMany(models.CourseOffering, { foreignKey: 'facilitatorId', as: 'courseOfferings' });
    Facilitator.hasMany(models.ActivityTracker, { foreignKey: 'facilitatorId', as: 'facilitatorReports' });
  };

  return Facilitator;
};