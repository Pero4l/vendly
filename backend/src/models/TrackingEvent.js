const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TrackingEvent extends Model {
    static associate(models) {
      TrackingEvent.belongsTo(models.Tracking, { foreignKey: 'tracking_id', as: 'tracking' });
    }
  }

  TrackingEvent.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    trackingId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'TrackingEvent',
    tableName: 'tracking_events',
    underscored: true,
    updatedAt: false
  });

  return TrackingEvent;
};
