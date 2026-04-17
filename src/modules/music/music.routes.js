'use strict';

const { Router } = require('express');
const { verifyToken } = require('../../common/middleware/auth.middleware');
const {
  search,
  recommendations,
  requestSong,
  getQueue,
  myRequests,
  changeStatus,
  staffAddSong,
  removeSong,
  cancelMySong,
} = require('./music.controller');

const router = Router();

// ── Rutas para clientes (mesa) y staff ──

// GET /api/music/search?q=texto — buscar canciones en Spotify
router.get('/search', verifyToken, search);

// GET /api/music/recommendations — obtener recomendaciones
router.get('/recommendations', verifyToken, recommendations);

// POST /api/music/request — cliente solicita una canción
router.post('/request', verifyToken, requestSong);

// GET /api/music/queue — ver la cola activa
router.get('/queue', verifyToken, getQueue);

// GET /api/music/my-requests — ver mis solicitudes de la sesión
router.get('/my-requests', verifyToken, myRequests);

// PATCH /api/music/queue/:id/status — staff cambia estado
router.patch('/queue/:id/status', verifyToken, changeStatus);

// POST /api/music/queue/staff-add — staff agrega canción manualmente
router.post('/queue/staff-add', verifyToken, staffAddSong);

// DELETE /api/music/queue/:id — staff elimina de la cola
router.delete('/queue/:id', verifyToken, removeSong);

// PATCH /api/music/my-requests/:id/cancel — cliente cancela su propia canción
router.patch('/my-requests/:id/cancel', verifyToken, cancelMySong);

module.exports = router;
