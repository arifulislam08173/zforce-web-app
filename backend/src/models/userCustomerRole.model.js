module.exports = (sequelize, DataTypes) => {
  const UserCustomerRole = sequelize.define(
    "UserCustomerRole",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false },
      region: { type: DataTypes.STRING, allowNull: true },
      area: { type: DataTypes.STRING, allowNull: true },
      territory: { type: DataTypes.STRING, allowNull: true },
      customerId: { type: DataTypes.UUID, allowNull: false },
      companyId: { type: DataTypes.UUID, allowNull: false },
      parentId: { type: DataTypes.UUID, allowNull: true },
      role: { type: DataTypes.STRING, allowNull: true },
      effectiveFrom: { type: DataTypes.DATEONLY, allowNull: false },
      effectiveTo: { type: DataTypes.DATEONLY, allowNull: true },
    },
    {
      paranoid: true,
      indexes: [
        { fields: ["userId", "customerId", "effectiveTo"] },
        { fields: ["companyId", "region", "area", "territory"] },
        { fields: ["customerId", "effectiveTo"] },
        { fields: ["parentId"] },
      ],
    },
  );

  UserCustomerRole.associate = (models) => {
    UserCustomerRole.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
    UserCustomerRole.belongsTo(models.User, {
      foreignKey: "parentId",
      as: "parent",
    });
    UserCustomerRole.belongsTo(models.Customer, {
      foreignKey: "customerId",
      as: "customer",
    });
    UserCustomerRole.belongsTo(models.Company, {
      foreignKey: "companyId",
      as: "company",
    });
    UserCustomerRole.hasMany(models.UserOrderRole, {
      foreignKey: "userCustomerRoleId",
      as: "orderRoles",
    });
  };

  return UserCustomerRole;
};
