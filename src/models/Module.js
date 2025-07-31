const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Module = sequelize.define('Module', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    credits: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 10
      }
    },
    level: {
      type: DataTypes.ENUM('undergraduate', 'postgraduate', 'diploma', 'certificate'),
      allowNull: false
    },
    prerequisites: {
      type: DataTypes.JSON
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'modules'
  });

  Module.associate = (models) => {
    Module.hasMany(models.CourseOffering, { foreignKey: 'moduleId', as: 'courseOfferings' });
  };

  return Module;
};