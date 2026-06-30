const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    static associate(models) {
      Transaction.belongsTo(models.Wallet, { foreignKey: 'wallet_id', as: 'wallet' });
      Transaction.belongsTo(models.Order, { foreignKey: 'order_id', as: 'order' });
      Transaction.belongsTo(models.Escrow, { foreignKey: 'escrow_id', as: 'escrow' });
    }
  }

  Transaction.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    walletId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    escrowId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    // senderAddress and receiverAddress are added by migration 20260630000001
    // Un-comment these after running: npx sequelize-cli db:migrate
    // senderAddress: { type: DataTypes.STRING(255), allowNull: true },
    // receiverAddress: { type: DataTypes.STRING(255), allowNull: true },
    type: {
      type: DataTypes.ENUM('deposit', 'purchase', 'escrow_release', 'withdrawal', 'refund', 'transfer'),
      allowNull: false
    },
    token: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false
    },
    txHash: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'success', 'failed'),
      defaultValue: 'pending',
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Transaction',
    tableName: 'transactions',
    underscored: true
  });

  return Transaction;
};
