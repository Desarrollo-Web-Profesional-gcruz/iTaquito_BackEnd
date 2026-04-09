const { Router } = require('express');
const {
  getAll,
  getById,
  create,
  update,
  remove,
  changeStatus,
} = require('./tables.controller');
const { verifyToken, verifyAdmin } = require('../../common/middleware/auth.middleware');

const router = Router();

// Rutas públicas (accesibles con token de empleado)
router.get('/', verifyToken, getAll);
router.get('/:id', verifyToken, getById);

// Rutas protegidas (solo admin)
router.post('/', verifyToken, verifyAdmin, create);
router.put('/:id', verifyToken, verifyAdmin, update);
router.delete('/:id', verifyToken, verifyAdmin, remove);
router.patch('/:id/estado', verifyToken, changeStatus);

module.exports = router;
