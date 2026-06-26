const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Address extends Model {
    static associate(models) {
      Address.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  }

  Address.init({
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
    label: {
      type: DataTypes.ENUM('HOME', 'OFFICE', 'FAMILY', 'FRIEND', 'OTHER'),
      defaultValue: 'HOME',
      allowNull: false
    },
    fullName: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    addressLine1: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    addressLine2: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    postalCode: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Address',
    tableName: 'addresses',
    underscored: true
  });

  return Address;
};
