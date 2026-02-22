const { User, Customer, Visit, Order, Collection, Expense } = require('../models');

exports.getStats = async (req, res, next) => {
  try {
    const totalUsers = await User.count();
    const totalCustomers = await Customer.count();
    const totalVisits = await Visit.count();
    const totalOrders = await Order.count();
    const totalCollections = await Collection.count();
    const totalExpenses = await Expense.count();

    res.status(200).json({
      totalUsers,
      totalCustomers,
      totalVisits,
      totalOrders,
      totalCollections,
      totalExpenses,
    });
  } catch (err) {
    next(err);
  }
};
