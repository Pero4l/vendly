const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Conversation extends Model {
    static associate(models) {
      Conversation.hasMany(models.Message, { foreignKey: 'conversation_id', as: 'messages' });
      Conversation.hasMany(models.ConversationParticipant, { foreignKey: 'conversation_id', as: 'participants' });
      Conversation.belongsTo(models.Order, { foreignKey: 'order_id', as: 'order' });
      Conversation.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
      Conversation.belongsTo(models.User, { foreignKey: 'buyer_id', as: 'buyer' });
      Conversation.belongsTo(models.User, { foreignKey: 'seller_id', as: 'seller' });
      Conversation.belongsTo(models.User, { foreignKey: 'support_agent_id', as: 'supportAgent' });
    }
  }

  Conversation.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('buyer_seller', 'support'),
      defaultValue: 'buyer_seller',
      allowNull: false
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    buyerId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    supportAgentId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Conversation',
    tableName: 'conversations',
    underscored: true
  });

  return Conversation;
};
