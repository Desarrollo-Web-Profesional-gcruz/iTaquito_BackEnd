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
const ticketsController = require('./tickets.controller');

const router = Router();

// POST /api/orders — mesa crea su pedido
router.post('/', verifyToken, create);

// GET /api/orders — mesa ve sus pedidos (filtrado por mesa), staff ve todos
router.get('/', (req, res, next) => {
  // Hack: Permitir consulta si viene iMesaId o sTokenSesion (para el ticket visual)
  if (req.query.sTokenSesion || req.query.iMesaId) {
    return getAll(req, res);
  }
  return verifyToken(req, res, () => getAll(req, res));
});

// GET /api/orders/:id
router.get('/:id', verifyToken, getById);

// PATCH /api/orders/:id/status — staff (admin, taquero, mesero, cajero)
router.patch('/:id/status', verifyToken, verifyStaff, changeStatus);

// DELETE /api/orders/:id — staff
router.delete('/:id', verifyToken, verifyStaff, cancel);

// POST /api/orders/send-ticket-email — Cliente envía su ticket
router.post('/send-ticket-email', (req, res) => ticketsController.sendTicketEmail(req, res));

module.exports = router;

