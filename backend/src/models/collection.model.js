module.exports = (sequelize, DataTypes) => {
  const Collection = sequelize.define(
    "Collection",
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false },
      orderId: { type: DataTypes.UUID, allowNull: false },
      amount: { type: DataTypes.DECIMAL, allowNull: false },
      paymentType: { type: DataTypes.ENUM("CASH", "UPI", "CHEQUE"), allowNull: false },
      receiptUrl: DataTypes.STRING,
      collectedAt: DataTypes.DATE,
      status: {
        type: DataTypes.ENUM("PENDING", "APPROVED", "REJECTED"),
        defaultValue: "PENDING",
      },
    },
    {
      paranoid: true,
      indexes: [
        { fields: ["userId", "orderId"] },
        { fields: ["orderId", "status"] },
        { fields: ["collectedAt"] },
      ],
    }
  );

  Collection.associate = (models) => {
    Collection.belongsTo(models.Order, { foreignKey: "orderId", as: "order" });
    Collection.belongsTo(models.User, { foreignKey: "userId", as: "user" });
  };

  return Collection;
};
