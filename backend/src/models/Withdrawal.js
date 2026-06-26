const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Withdrawal extends Model {
    static associate(models) {
      Withdrawal.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      Withdrawal.belongsTo(models.User, { foreignKey: 'approved_by', as: 'approver' });
    }
  }

  Withdrawal.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false
    },
    token: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    walletAddress: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'processing', 'completed', 'rejected'),
      defaultValue: 'pending',
      allowNull: false
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Withdrawal',
    tableName: 'withdrawals',
    underscored: true
  });

  return Withdrawal;
};
