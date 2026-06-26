const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AdminAction extends Model {
    static associate(models) {
      AdminAction.belongsTo(models.User, { foreignKey: 'admin_id', as: 'admin' });
    }
  }

  AdminAction.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    adminId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    action: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    targetType: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    targetId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'AdminAction',
    tableName: 'admin_actions',
    underscored: true,
    updatedAt: false
  });

  return AdminAction;
};
