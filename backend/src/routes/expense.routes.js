const router = require('express').Router();
const controller = require('../controllers/expense.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Field user routes
router.post('/', authenticate, authorize('FIELD'), controller.createExpense);
router.get('/my', authenticate, authorize('FIELD'), controller.getMyExpenses);

// Admin / Manager routes
router.get('/report', authenticate, authorize('ADMIN', 'MANAGER'), controller.getReport);
router.patch('/:id/status', authenticate, authorize('ADMIN', 'MANAGER'), controller.updateStatus);

module.exports = router;
