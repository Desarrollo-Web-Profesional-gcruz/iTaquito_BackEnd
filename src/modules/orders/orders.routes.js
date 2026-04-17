'use strict';

const { Router } = require('express');
const { verifyToken, verifyStaff } = require('../../common/middleware/auth.middleware');
const {
  getAll,
  getById,
  create,
  changeStatus,
  cancel,
} = require('./orders.controller');

const router = Router();

// POST /api/orders — mesa crea su pedido
router.post('/', verifyToken, create);

// GET /api/orders — mesa ve sus pedidos (filtrado por mesa), staff ve todos
router.get('/', verifyToken, getAll);

// GET /api/orders/:id
router.get('/:id', verifyToken, getById);

// PATCH /api/orders/:id/status — staff (admin, taquero, mesero, cajero)
router.patch('/:id/status', verifyToken, verifyStaff, changeStatus);

// DELETE /api/orders/:id — staff
router.delete('/:id', verifyToken, verifyStaff, cancel);

module.exports = router;

