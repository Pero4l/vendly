const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.User, { foreignKey: 'buyer_id', as: 'buyer' });
      Order.hasMany(models.OrderItem, { foreignKey: 'order_id', as: 'items' });
      Order.hasOne(models.Escrow, { foreignKey: 'order_id', as: 'escrow' });
      Order.hasOne(models.Tracking, { foreignKey: 'order_id', as: 'tracking' });
    }
  }

  Order.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    buyerId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    escrowId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    trackingId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    orderNumber: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false
    },
    shippingAddress: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    subtotal: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false
    },
    shippingFee: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false
    },
    tax: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false
    },
    totalAmount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'disputed', 'refunded'),
      defaultValue: 'pending',
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    underscored: true
  });

  return Order;
};
