const { Router } = require('express');
const { getAll } = require('./categories.controller');

const router = Router();

router.get('/', getAll);

module.exports = router;
