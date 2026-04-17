const express = require('express');
const cors = require('cors');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://itaquito.netlify.app',
];

if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS
    .split(',')
    .map(o => o.trim())
    .filter(Boolean)
    .forEach(o => { if (!allowedOrigins.includes(o)) allowedOrigins.push(o); });
}

console.log('✅ CORS orígenes permitidos:', allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.error('🚫 CORS bloqueado para origen:', origin);
    return callback(new Error('No permitido por CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Express v5 — wildcard con nombre obligatorio
app.options('/{*splat}', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRoutes      = require('./modules/auth/auth.routes');
const userRoutes      = require('./modules/users/users.routes');
const productRoutes   = require('./modules/products/products.routes');
const categoryRoutes  = require('./modules/categories/categories.routes');
const tableRoutes     = require('./modules/tables/tables.routes');
const orderRoutes     = require('./modules/orders/orders.routes');
const cajeroRoutes    = require('./modules/cajero/cajero.routes');
const commentRoutes   = require('./modules/comments/comments.routes');
const musicRoutes     = require('./modules/music/music.routes');

app.use('/api/auth',       authRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tables',     tableRoutes);
app.use('/api/orders',     orderRoutes);
app.use('/api/cajero',     cajeroRoutes);
app.use('/api/comments',   commentRoutes);
app.use('/api/music',      musicRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'iTaquito API corriendo correctamente' });
});

// Express v5 — 404 con wildcard nombrado
app.use('/{*splat}', (req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

module.exports = app;