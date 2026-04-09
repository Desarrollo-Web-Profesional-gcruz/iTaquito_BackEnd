const { Router } = require('express');
const { register, login, logout } = require('./auth.controller');
const verifyToken = require('../../common/middleware/auth.middleware').verifyToken;
const router = Router();

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

router.post('/logout',   verifyToken, logout);

module.exports = router;
