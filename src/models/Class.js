const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Class = sequelize.define('Class', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        is: /^[0-9]{4}[SJ]$/i // Format: 2024S or 2025J
      }
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    semester: {
      type: DataTypes.ENUM('S', 'J'), // S for Spring, J for January
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'classes',
    validate: {
      endDateAfterStartDate() {
        if (this.endDate <= this.startDate) {
          throw new Error('End date must be after start date');
        }
      }
    }
  });

  Class.associate = (models) => {
    Class.hasMany(models.CourseOffering, { foreignKey: 'classId', as: 'courseOfferings' });
  };

  return Class;
};