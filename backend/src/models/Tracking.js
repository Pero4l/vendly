const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Tracking extends Model {
    static associate(models) {
      Tracking.belongsTo(models.Order, { foreignKey: 'order_id', as: 'order' });
      Tracking.belongsTo(models.User, { foreignKey: 'seller_id', as: 'seller' });
      Tracking.hasMany(models.TrackingEvent, { foreignKey: 'tracking_id', as: 'events' });
    }
  }

  Tracking.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    trackingNumber: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    courierName: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    currentStatus: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    estimatedDeliveryDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Tracking',
    tableName: 'tracking',
    underscored: true
  });

  return Tracking;
};
