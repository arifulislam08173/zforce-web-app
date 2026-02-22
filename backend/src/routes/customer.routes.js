const router = require('express').Router();
const controller = require('../controllers/customer.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Dropdown for all roles (used in visits/orders)
router.get('/dropdown', authenticate, controller.getDropdown);

// Admin / Manager can view customers list & details
router.get('/', authenticate, authorize('ADMIN', 'MANAGER'), controller.listCustomers);
router.get('/:id', authenticate, authorize('ADMIN', 'MANAGER'), controller.getCustomerById);

// Only ADMIN can create/update/delete customers
router.post('/', authenticate, authorize('ADMIN'), controller.createCustomer);
router.put('/:id', authenticate, authorize('ADMIN'), controller.updateCustomer);
router.delete('/:id', authenticate, authorize('ADMIN'), controller.deleteCustomer);

module.exports = router;
