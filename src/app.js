const express = require('express');
const cors = require('cors');

const app = express();

// Orígenes base siempre permitidos
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://itaquitof.netlify.app',
];

// Si hay orígenes extra en .env los agrega (útil para Railway preview URLs)
if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS
    .split(',')
    .map(o => o.trim())
    .filter(Boolean)
    .forEach(o => {
      if (!allowedOrigins.includes(o)) allowedOrigins.push(o);
    });
}

const corsOptions = {
  origin: function (origin, callback) {
    // Sin origin → Postman, apps móviles, Railway health checks
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error('🚫 CORS bloqueado para origen:', origin);
      console.error('✅ Orígenes permitidos:', allowedOrigins);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Preflight explícito — necesario para requests con Authorization header
app.options(/(.*)/, cors(corsOptions));

// Middlewares globales
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
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

app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

module.exports = app;