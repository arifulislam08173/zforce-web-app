module.exports = (sequelize, DataTypes) => {
  const UserOrderRole = sequelize.define(
    "UserOrderRole",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      orderId: { type: DataTypes.UUID, allowNull: false },
      userId: { type: DataTypes.UUID, allowNull: false },
      customerId: { type: DataTypes.UUID, allowNull: false },
      companyId: { type: DataTypes.UUID, allowNull: false },
      region: { type: DataTypes.STRING, allowNull: true },
      area: { type: DataTypes.STRING, allowNull: true },
      territory: { type: DataTypes.STRING, allowNull: true },
      parentId: { type: DataTypes.UUID, allowNull: true },
      role: { type: DataTypes.STRING, allowNull: true },
      userCustomerRoleId: { type: DataTypes.UUID, allowNull: true },
      snapshotAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      paranoid: true,
      indexes: [
        { unique: true, fields: ["orderId"] },
        { fields: ["userId", "snapshotAt"] },
        { fields: ["companyId", "area", "snapshotAt"] },
        { fields: ["customerId", "snapshotAt"] },
      ],
    },
  );

  UserOrderRole.associate = (models) => {
    UserOrderRole.belongsTo(models.Order, {
      foreignKey: "orderId",
      as: "order",
    });
    UserOrderRole.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    UserOrderRole.belongsTo(models.Customer, {
      foreignKey: "customerId",
      as: "customer",
    });
    UserOrderRole.belongsTo(models.Company, {
      foreignKey: "companyId",
      as: "company",
    });
    UserOrderRole.belongsTo(models.UserCustomerRole, {
      foreignKey: "userCustomerRoleId",
      as: "userCustomerRole",
    });
  };

  return UserOrderRole;
};
