const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      Product.belongsTo(models.Store, { foreignKey: 'store_id', as: 'store' });
      Product.belongsTo(models.Category, { foreignKey: 'category_id', as: 'category' });
      Product.hasMany(models.OrderItem, { foreignKey: 'product_id', as: 'orderItems' });
      Product.hasMany(models.Review, { foreignKey: 'product_id', as: 'reviews' });
      Product.hasMany(models.Favorite, { foreignKey: 'product_id', as: 'favorites' });
    }
  }

  Product.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    storeId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    sku: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    images: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    weight: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    viewsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    averageRating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.00,
      allowNull: false
    },
    totalReviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    quality: {
      type: DataTypes.ENUM('new', 'neatly_used', 'old_used'),
      allowNull: true,
      defaultValue: null
    },
    status: {
      type: DataTypes.ENUM('draft', 'active', 'out_of_stock', 'suspended', 'deleted'),
      defaultValue: 'draft',
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    underscored: true,
    paranoid: true
  });

  return Product;
};
