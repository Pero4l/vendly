const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Category extends Model {
    static associate(models) {
      Category.hasMany(models.Product, { foreignKey: 'category_id', as: 'products' });
      Category.hasMany(models.Category, { foreignKey: 'parent_id', as: 'subcategories' });
      Category.belongsTo(models.Category, { foreignKey: 'parent_id', as: 'parent' });
    }
  }

  Category.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: false
    },
    image: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Category',
    tableName: 'categories',
    underscored: true
  });

  return Category;
};
