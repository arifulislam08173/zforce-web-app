const customerService = require('../services/customer.service');

// exports.getDropdown = async (req, res, next) => {
//   try {
//     const customers = await customerService.getDropdown();
//     res.status(200).json(customers);
//   } catch (err) {
//     next(err);
//   }
// };


exports.getDropdown = async (req, res, next) => {
  try {
    const customers = await customerService.getDropdown(req.user, req.query);
    res.status(200).json(customers);
  } catch (err) {
    next(err);
  }
};

/**
 * List customers
 */

exports.listCustomers = async (req, res, next) => {
  try {
    const result = await customerService.listCustomers(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * Get single customer
 */
exports.getCustomerById = async (req, res, next) => {
  try {
    const customer = await customerService.getCustomerById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.status(200).json({ data: customer });
  } catch (err) {
    next(err);
  }
};

/**
 * Create new customer
 */

exports.createCustomer = async (req, res, next) => {
  try {
    const customer = await customerService.createCustomer(req.body);
    res.status(201).json({ message: 'Customer created', data: customer });
  } catch (err) {
    next(err);
  }
};

/**
 * Update customer
 */
exports.updateCustomer = async (req, res, next) => {
  try {
    const customer = await customerService.updateCustomer(req.params.id, req.body);
    res.status(200).json({ message: 'Customer updated', data: customer });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete customer
 */
exports.deleteCustomer = async (req, res, next) => {
  try {
    await customerService.deleteCustomer(req.params.id);
    res.status(200).json({ message: 'Customer deleted' });
  } catch (err) {
    next(err);
  }
};


// exports.getCustomerDropdown = async (req, res, next) => {
//   try {
//     const customers = await customerService.getCustomerDropdown();
//     res.json(customers);
//   } catch (err) {
//     next(err);
//   }
// };