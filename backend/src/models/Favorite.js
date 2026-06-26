const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Favorite extends Model {
    static associate(models) {
      Favorite.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      Favorite.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
    }
  }

  Favorite.init({
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
    productId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Favorite',
    tableName: 'favorites',
    underscored: true,
    updatedAt: false
  });

  return Favorite;
};
