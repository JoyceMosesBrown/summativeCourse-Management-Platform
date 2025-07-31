const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Student = sequelize.define('Student', {
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
    studentId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    cohortId: {
      type: DataTypes.UUID,
      references: {
        model: 'cohorts',
        key: 'id'
      }
    },
    enrollmentDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    graduationDate: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'students'
  });

  Student.associate = (models) => {
    Student.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Student.belongsTo(models.Cohort, { foreignKey: 'cohortId', as: 'cohort' });
  };

  return Student;
};