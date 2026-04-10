const { Router } = require('express');
const { 
  register, 
  login, 
  verify2FA,
  logout, 
  requestPasswordReset, 
  adminResetPassword 
} = require('./auth.controller');
const { 
  enable2FAForUser, 
  disable2FAForUser, 
  getBackupCodes 
} = require('./twoFactor.controller');
const verifyToken = require('../../common/middleware/auth.middleware').verifyToken;
const router = Router();

// Auth endpoints
router.post('/register', register);
router.post('/login', login);
router.post('/verify-2fa', verify2FA);  
router.post('/logout', verifyToken, logout);

// Recuperación de contraseña
router.post('/request-reset', requestPasswordReset);
router.post('/admin/reset-password/:userId', verifyToken, adminResetPassword);

// 2FA endpoints (solo admin para activar/desactivar)
router.post('/admin/enable-2fa/:userId', verifyToken, enable2FAForUser);
router.post('/admin/disable-2fa/:userId', verifyToken, disable2FAForUser);
router.get('/my-backup-codes', verifyToken, getBackupCodes);

module.exports = router;