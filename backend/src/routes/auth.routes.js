const router = require('express').Router();
const controller = require('../controllers/auth.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.post('/login', controller.login);
router.post('/users', authenticate, authorize('ADMIN'), controller.createUser);
router.get('/profile', authenticate, controller.profile);
router.post('/logout', authenticate, controller.logout);

module.exports = router;
