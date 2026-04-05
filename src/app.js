const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/users.routes');
const productRoutes = require('./modules/products/products.routes');
const categoryRoutes = require('./modules/categories/categories.routes');
const tableRoutes = require('./modules/tables/tables.routes'); 
const orderRoutes = require('./modules/orders/orders.routes');
const cajeroRoutes = require('./modules/cajero/cajero.routes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cajero', cajeroRoutes);



// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'iTaquito API corriendo correctamente' });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

module.exports = app;
