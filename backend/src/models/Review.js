const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Review extends Model {
    static associate(models) {
      Review.belongsTo(models.Order, { foreignKey: 'order_id', as: 'order' });
      Review.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
      Review.belongsTo(models.User, { foreignKey: 'reviewer_id', as: 'reviewer' });
      Review.belongsTo(models.User, { foreignKey: 'seller_id', as: 'seller' });
    }
  }

  Review.init({
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
    productId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    reviewerId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Review',
    tableName: 'reviews',
    underscored: true
  });

  return Review;
};
