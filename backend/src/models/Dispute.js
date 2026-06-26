const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Dispute extends Model {
    static associate(models) {
      Dispute.belongsTo(models.Order, { foreignKey: 'order_id', as: 'order' });
      Dispute.belongsTo(models.User, { foreignKey: 'buyer_id', as: 'buyer' });
      Dispute.belongsTo(models.User, { foreignKey: 'seller_id', as: 'seller' });
      Dispute.belongsTo(models.User, { foreignKey: 'resolved_by', as: 'resolver' });
    }
  }

  Dispute.init({
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
    reason: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    evidence: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    resolution: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    resolvedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('open', 'under_review', 'resolved', 'rejected'),
      defaultValue: 'open',
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Dispute',
    tableName: 'disputes',
    underscored: true
  });

  return Dispute;
};
