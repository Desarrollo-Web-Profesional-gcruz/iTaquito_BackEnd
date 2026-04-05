const { Router } = require('express');
const { getAllUsers, getMe, getMesasDisponibles, createUser, updateUser, deleteUser } = require('./users.controller');
const { verifyToken, verifyAdmin } = require('../../common/middleware/auth.middleware');

const router = Router();

router.get('/me',                verifyToken,              getMe);
router.get('/mesas-disponibles', verifyToken, verifyAdmin, getMesasDisponibles);
router.get('/',                  verifyToken, verifyAdmin, getAllUsers);
router.post('/',                 verifyToken, verifyAdmin, createUser);
router.put('/:id',               verifyToken, verifyAdmin, updateUser);
router.delete('/:id',            verifyToken, verifyAdmin, deleteUser);

module.exports = router;
