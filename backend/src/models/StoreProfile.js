const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class StoreProfile extends Model {
    static associate(models) {
      StoreProfile.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      StoreProfile.hasOne(models.Store, { foreignKey: 'store_profile_id', as: 'store' });
    }
  }

  StoreProfile.init({
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
    displayName: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    logo: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    banner: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.00,
      allowNull: false
    },
    totalSales: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      allowNull: false
    },
    totalProducts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    totalReviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'StoreProfile',
    tableName: 'store_profiles',
    underscored: true,
    paranoid: true
  });

  return StoreProfile;
};
