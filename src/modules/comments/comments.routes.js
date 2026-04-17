'use strict';

const { Router } = require('express');
const { verifyToken, verifyAdmin } = require('../../common/middleware/auth.middleware');
const { create, getAll } = require('./comments.controller');

const router = Router();

// POST /api/comments — público (o via mesa) para dejar feedback
router.post('/', create);

// GET /api/comments — solo administradores para ver el feedback
router.get('/', verifyToken, verifyAdmin, getAll);

module.exports = router;
