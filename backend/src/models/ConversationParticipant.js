const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ConversationParticipant extends Model {
    static associate(models) {
      ConversationParticipant.belongsTo(models.Conversation, { foreignKey: 'conversation_id', as: 'conversation' });
      ConversationParticipant.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  }

  ConversationParticipant.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    conversationId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'ConversationParticipant',
    tableName: 'conversation_participants',
    underscored: true,
    timestamps: false
  });

  return ConversationParticipant;
};
