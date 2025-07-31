const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Manager = sequelize.define('Manager', {
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
    department: {
      type: DataTypes.STRING,
      allowNull: false
    },
    employeeId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    accessLevel: {
      type: DataTypes.ENUM('basic', 'advanced', 'full'),
      defaultValue: 'basic'
    }
  }, {
    tableName: 'managers'
  });

  Manager.associate = (models) => {
    Manager.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return Manager;
};