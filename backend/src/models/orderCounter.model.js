module.exports = (sequelize, DataTypes) => {
  const OrderCounter = sequelize.define(
    "OrderCounter",
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      year: { type: DataTypes.INTEGER, allowNull: false },
      lastNumber: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    {
      indexes: [{ unique: true, fields: ["year"] }],
    }
  );

  return OrderCounter;
};
