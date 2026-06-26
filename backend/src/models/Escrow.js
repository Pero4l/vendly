const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Escrow extends Model {
    static associate(models) {
      Escrow.belongsTo(models.Order, { foreignKey: 'order_id', as: 'order' });
      Escrow.belongsTo(models.User, { foreignKey: 'buyer_id', as: 'buyer' });
      Escrow.belongsTo(models.User, { foreignKey: 'seller_id', as: 'seller' });
    }
  }

  Escrow.init({
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
    buyerId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false
    },
    releasedAmount: {
      type: DataTypes.DECIMAL(18, 2),
      defaultValue: 0.00,
      allowNull: false
    },
    remainingAmount: {
      type: DataTypes.DECIMAL(18, 2),
      defaultValue: 0.00,
      allowNull: false
    },
    stage: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'released', 'completed', 'refunded', 'disputed'),
      defaultValue: 'active',
      allowNull: false
    },
    contractTxHash: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Escrow',
    tableName: 'escrows',
    underscored: true
  });

  return Escrow;
};
