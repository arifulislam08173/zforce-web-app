const router = require('express').Router();
const controller = require('../controllers/user.controller');
const { authorize } = require('../middlewares/auth.middleware');

// Dropdown - Admin/Manager only
router.get('/dropdown', authorize('ADMIN', 'MANAGER'), controller.dropdown);

// Admin-only user management
router.get('/', authorize('ADMIN'), controller.list);
router.get('/:id', authorize('ADMIN'), controller.getOne);
router.post('/', authorize('ADMIN'), controller.create);
router.patch('/:id', authorize('ADMIN'), controller.update);
router.delete('/:id', authorize('ADMIN'), controller.remove);

module.exports = router;
