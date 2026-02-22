module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define(
    "Order",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      orderNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      customerId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      totalAmount: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },
      paidAmount: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },
      paymentStatus: {
        type: DataTypes.ENUM("UNPAID", "PARTIAL", "PAID"),
        defaultValue: "UNPAID",
      },

      status: {
        type: DataTypes.ENUM("PENDING", "COMPLETED", "CANCELLED"),
        defaultValue: "PENDING",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "orders",
      timestamps: true,
    },
  );

  Order.associate = (models) => {
    Order.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    Order.belongsTo(models.Customer, {
      foreignKey: "customerId",
      as: "customer",
    });
    Order.hasMany(models.OrderItem, {
      foreignKey: "orderId",
      as: "items",
      onDelete: "CASCADE",
    });

    Order.hasOne(models.UserOrderRole, {
      foreignKey: "orderId",
      as: "orderRole",
      onDelete: "CASCADE",
    });

    Order.hasMany(models.Collection, {
      foreignKey: "orderId",
      as: "collections",
      onDelete: "CASCADE",
    });
  };

  return Order;
};
