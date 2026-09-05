// routes/auth.js
const express = require('express');
const router = express.Router();
const { register, login, adminLogin, me } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/admin/login', adminLogin);
router.get('/me', requireAuth, me);

module.exports = router;
