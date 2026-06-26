const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasOne(models.Wallet, { foreignKey: 'user_id', as: 'wallet' });
      User.hasOne(models.StoreProfile, { foreignKey: 'user_id', as: 'storeProfile' });
      User.hasMany(models.Address, { foreignKey: 'user_id', as: 'addresses' });
      User.hasMany(models.Order, { foreignKey: 'buyer_id', as: 'orders' });
      User.hasMany(models.Review, { foreignKey: 'reviewer_id', as: 'reviews' });
      User.hasMany(models.Notification, { foreignKey: 'user_id', as: 'notifications' });
      User.hasMany(models.Favorite, { foreignKey: 'user_id', as: 'favorites' });
      User.hasMany(models.Message, { foreignKey: 'sender_id', as: 'messages' });
      User.hasMany(models.ConversationParticipant, { foreignKey: 'user_id', as: 'participants' });
      User.hasMany(models.AdminAction, { foreignKey: 'admin_id', as: 'adminActions' });
    }
  }

  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    fullName: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    username: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: true
    },
    passwordHash: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    profileImage: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('buyer', 'seller', 'admin'),
      defaultValue: 'buyer',
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'suspended', 'banned'),
      defaultValue: 'active',
      allowNull: false
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    phoneVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    storeProfileId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    isOnline: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    lastSeenAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    underscored: true,
    paranoid: true
  });

  return User;
};
