module.exports = (sequelize, DataTypes) => {
  const Visit = sequelize.define(
    'Visit',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      routeId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      customerId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      plannedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      checkInAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      checkInLat: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      checkInLng: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      checkOutAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      checkOutLat: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      checkOutLng: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'MISSED'),
        defaultValue: 'PLANNED',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      paranoid: true,
      indexes: [
        { fields: ['routeId'] },
        { fields: ['userId'] },
        { fields: ['customerId'] },
        { fields: ['plannedAt'] },
      ],
    }
  );

  Visit.associate = (models) => {
    Visit.belongsTo(models.User, { foreignKey: 'userId', as: 'fieldUser' });
    Visit.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
    Visit.belongsTo(models.RoutePlan, { foreignKey: "routeId", as: "route", constraints: false,});
  };

  return Visit;
};
