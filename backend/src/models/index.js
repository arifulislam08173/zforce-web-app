// // const Sequelize = require('sequelize');
// // const sequelize = require('../config/database');

// const { DataTypes } = require('sequelize');
// const { sequelize } = require('../config/database');

// const User = require('./user.model')(sequelize, DataTypes);
// const Attendance = require('./attendance.model')(sequelize, DataTypes);
// const Order = require('./order.model')(sequelize, DataTypes);
// const OrderItem = require('./orderItem.model')(sequelize, DataTypes);
// const Customer = require("./customer.model")(sequelize, DataTypes);
// const Visit = require("./visit.model")(sequelize, DataTypes);
// const Product = require("./product.model")(sequelize, DataTypes);
// const Expense = require("./expense.model")(sequelize, DataTypes);
// const Collection = require("./collection.model")(sequelize, DataTypes);
// const RoutePlan = require("./route.model")(sequelize, DataTypes);

// Order.hasMany(OrderItem, { foreignKey: 'orderId' });
// OrderItem.belongsTo(Order, { foreignKey: 'orderId' });


// RoutePlan.belongsTo(User, { foreignKey: "userId", as: "user" });
// RoutePlan.belongsTo(Customer, { foreignKey: "customerId", as: "customer" });

// User.hasMany(RoutePlan, { foreignKey: "userId", as: "routes" });
// Customer.hasMany(RoutePlan, { foreignKey: "customerId", as: "routes" });

// module.exports = {
//   sequelize,
//   User,
//   Attendance,
//   Order,
//   OrderItem,
//   Customer,
//   RoutePlan,
//   Visit,
//   Product,
//   Order,
//   OrderItem,
//   Expense,
//   Collection,
// };







const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const User = require("./user.model")(sequelize, DataTypes);
const Attendance = require("./attendance.model")(sequelize, DataTypes);
const Order = require("./order.model")(sequelize, DataTypes);
const OrderItem = require("./orderItem.model")(sequelize, DataTypes);
const Customer = require("./customer.model")(sequelize, DataTypes);
const Visit = require("./visit.model")(sequelize, DataTypes);
const Product = require("./product.model")(sequelize, DataTypes);
const Expense = require("./expense.model")(sequelize, DataTypes);
const Collection = require("./collection.model")(sequelize, DataTypes);
const RoutePlan = require("./route.model")(sequelize, DataTypes);
const Company = require("./company.model")(sequelize, DataTypes);
const UserCompany = require("./userCompany.model")(sequelize, DataTypes);
const UserCustomerRole = require("./userCustomerRole.model")(sequelize, DataTypes);
const UserOrderRole = require("./userOrderRole.model")(sequelize, DataTypes);
const OrderCounter = require("./orderCounter.model")(sequelize, DataTypes);

const models = {
  sequelize,
  User,
  Attendance,
  Order,
  OrderItem,
  Customer,
  RoutePlan,
  Visit,
  Product,
  Expense,
  Collection,
  Company,
  UserCompany,
  UserCustomerRole,
  UserOrderRole,
  OrderCounter,
};

Object.values(models).forEach((model) => {
  if (model && typeof model.associate === "function") {
    model.associate(models);
  }
});

module.exports = models;