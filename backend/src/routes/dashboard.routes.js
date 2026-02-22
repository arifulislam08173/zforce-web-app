const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middlewares/auth.middleware');
// const { authorize } = require('../middlewares/role.middleware'); // role-based access

// GET /api/dashboard/stats
router.get(
  '/stats',
  authenticate, 
  // authorize('ADMIN', 'MANAGER'), 
  dashboardController.getStats
);

module.exports = router;
