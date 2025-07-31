const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Cohort = sequelize.define('Cohort', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 2020,
        max: 2050
      }
    },
    program: {
      type: DataTypes.STRING,
      allowNull: false
    },
    intakePeriod: {
      type: DataTypes.ENUM('HT1', 'HT2', 'FT'),
      allowNull: false
    },
    maxStudents: {
      type: DataTypes.INTEGER,
      defaultValue: 30
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'cohorts'
  });

  Cohort.associate = (models) => {
    Cohort.hasMany(models.Student, { foreignKey: 'cohortId', as: 'students' });
    Cohort.hasMany(models.CourseOffering, { foreignKey: 'cohortId', as: 'courseOfferings' });
  };

  return Cohort;
};