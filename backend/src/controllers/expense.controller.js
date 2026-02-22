const expenseService = require('../services/expense.service');

const normalizeError = (err) => {
  const msg = err?.message || "Something went wrong";
  return msg;
};

/**
 * Create Expense
 */

exports.createExpense = async (req, res, next) => {
  try {
    const expense = await expenseService.createExpense(req.user.id, req.body);
    res.status(201).json({ message: "Expense submitted", data: expense });
  } catch (err) {
    err.message = normalizeError(err);
    next(err);
  }
};

/**
 * Get logged-in user's expenses
 */

exports.getMyExpenses = async (req, res, next) => {
  try {
    const result = await expenseService.getMyExpenses(req.user.id, req.query);
    res.status(200).json(result);
  } catch (err) {
    err.message = normalizeError(err);
    next(err);
  }
};

/**
 * Approve / Reject Expense (Admin / Manager)
 */

exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const expense = await expenseService.updateExpenseStatus(id, status);

    res.status(200).json({
      message: `Expense ${String(expense.status).toLowerCase()}`,
      data: expense,
    });
  } catch (err) {
    err.message = normalizeError(err);
    next(err);
  }
};


/**
 * Expense Report (Admin / Manager)
 */

exports.getReport = async (req, res, next) => {
  try {
    const result = await expenseService.getExpenseReport(req.query);
    res.status(200).json(result);
  } catch (err) {
    err.message = normalizeError(err);
    next(err);
  }
};
