module.exports = (sequelize, DataTypes) => {
  const Route = sequelize.define(
    "Route",
    {
      // Primary key
      id: {
        // type: DataTypes.INTEGER,
        // autoIncrement: true,
        // primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      // Foreign key to User table
      userId: {
        // type: DataTypes.INTEGER,
        type: DataTypes.UUID,
        allowNull: false,
      },

      // Foreign key to Customer table
      customerId: {
        // type: DataTypes.INTEGER,
        type: DataTypes.UUID,
        allowNull: false,
      },

      // Route date
      date: {
        type: DataTypes.DATEONLY, // only date, no time
        allowNull: false,
      },

      // Optional additional fields
      notes: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "routes",
      timestamps: true, // createdAt & updatedAt
    }
  );

  // Associations
  Route.associate = (models) => {
    Route.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    Route.belongsTo(models.Customer, { foreignKey: "customerId", as: "customer" });
  };

  return Route;
};