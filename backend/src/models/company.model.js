module.exports = (sequelize, DataTypes) => {
  const Company = sequelize.define(
    "Company",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: { type: DataTypes.STRING, allowNull: false },
      address: { type: DataTypes.TEXT, allowNull: true },
      contactNo: { type: DataTypes.STRING, allowNull: true },
      email: { type: DataTypes.STRING, allowNull: true },
      binNo: { type: DataTypes.STRING, allowNull: true },
      tiinNo: { type: DataTypes.STRING, allowNull: true },
    },
    { paranoid: true },
  );

  Company.associate = (models) => {
    Company.hasMany(models.UserCompany, {
      foreignKey: "companyId",
      as: "userCompanies",
    });
    Company.hasMany(models.UserCustomerRole, {
      foreignKey: "companyId",
      as: "customerRoles",
    });
    Company.hasMany(models.UserOrderRole, {
      foreignKey: "companyId",
      as: "orderRoles",
    });
  };

  return Company;
};
