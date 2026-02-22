module.exports = (sequelize, DataTypes) => {
  const UserCompany = sequelize.define(
    "UserCompany",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false },
      companyId: { type: DataTypes.UUID, allowNull: false },
      departmentId: { type: DataTypes.UUID, allowNull: true },
      designationId: { type: DataTypes.UUID, allowNull: true },
      effectiveFrom: { type: DataTypes.DATEONLY, allowNull: false },
      effectiveTo: { type: DataTypes.DATEONLY, allowNull: true },
    },
    {
      paranoid: true,
      indexes: [
        { fields: ["userId", "companyId", "effectiveFrom"] },
        { fields: ["userId", "effectiveTo"] },
      ],
    },
  );

  UserCompany.associate = (models) => {
    UserCompany.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    UserCompany.belongsTo(models.Company, {
      foreignKey: "companyId",
      as: "company",
    });
  };

  return UserCompany;
};
