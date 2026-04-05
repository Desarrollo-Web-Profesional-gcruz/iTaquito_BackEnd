'use strict';

const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const { Order, OrderItem, Product, Table, User } = require('../../models');
const { sequelize } = require('../../models');

/* ─── INCLUDE BASE ───────────────────────────────────────────── */
const ORDER_INCLUDE = [
  {
    model: OrderItem,
    as: 'items',
    include: [
      {
        model: Product,
        as: 'producto',
        attributes: ['id', 'sNombre', 'sImagenUrl', 'dPrecio', 'bDisponible'],
      },
    ],
  },
  {
    model: Table,
    as: 'mesa',
    attributes: ['id', 'sNombre', 'iCapacidad', 'sUbicacion', 'sEstado', 'sDescripcion'],
  },
  {
    model: User,
    as: 'usuario',
    attributes: ['id', 'nombre', 'email', 'rol'],
  },
];

/* ─── HELPER ─────────────────────────────────────────────────── */
const calcularTotalOrden = (order) =>
  order.items.reduce((sum, item) => sum + parseFloat(item.dSubtotal || 0), 0);

/* ══════════════════════════════════════════════════════════════
   GET /cajero/orders-by-table
══════════════════════════════════════════════════════════════ */
const getOrdersByTable = async (req, res) => {
  try {
    const { estado } = req.query;

    // FIX: lógica simplificada — armar el where por partes
    // evita el problema de Op.and con Op.eq en ciertas versiones de Sequelize
    const where = { bPagado: false };

    const estadosExcluidos = ['cancelado', 'pagado'];

    if (estado && estado !== 'todos') {
      // Filtrar por estado específico (ya excluye cancelado por definición del ENUM)
      where.sEstado = estado;
    } else {
      // Mostrar todos excepto cancelado y pagado
      where.sEstado = { [Op.notIn]: estadosExcluidos };
    }

    const orders = await Order.findAll({
      where,
      include: ORDER_INCLUDE,
      order: [['createdAt', 'ASC']],
    });

    const ordersBySession = {};

    orders.forEach(order => {
      const tokenSesion = order.sTokenSesion || `legacy-${order.iMesaId}`;
      const totalOrden = calcularTotalOrden(order);

      if (!ordersBySession[tokenSesion]) {
        ordersBySession[tokenSesion] = {
          mesa:        order.mesa,
          tokenSesion: tokenSesion,
          orders:      [],
          totalMesa:   0,
          ordersCount: 0,
        };
      }

      ordersBySession[tokenSesion].orders.push({
        ...order.toJSON(),
        totalCalculado: totalOrden,
      });
      ordersBySession[tokenSesion].totalMesa   += totalOrden;
      ordersBySession[tokenSesion].ordersCount += 1;
    });

    const result = Object.values(ordersBySession).sort((a, b) =>
      (a.mesa?.sNombre || '').localeCompare(b.mesa?.sNombre || '')
    );

    res.json({
      success: true,
      data: result,
      totalMesasConCuentas:  result.length,
      totalVentasPendientes: result.reduce((sum, t) => sum + t.totalMesa, 0),
    });

  } catch (error) {
    console.error('Error en getOrdersByTable:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las órdenes por mesa',
      error: error.message,
    });
  }
};

/* ══════════════════════════════════════════════════════════════
   GET /cajero/orders-by-table/:mesaId
══════════════════════════════════════════════════════════════ */
const getOrdersByMesaId = async (req, res) => {
  try {
    const { mesaId } = req.params;

    const orders = await Order.findAll({
      where: {
        iMesaId: mesaId,
        bPagado: false,
        sEstado: { [Op.notIn]: ['cancelado', 'pagado'] },
      },
      include: ORDER_INCLUDE,
      order: [['createdAt', 'ASC']],
    });

    const ordersConTotal = orders.map(order => ({
      ...order.toJSON(),
      totalCalculado: calcularTotalOrden(order),
    }));

    const totalMesa = ordersConTotal.reduce((sum, o) => sum + o.totalCalculado, 0);

    res.json({
      success: true,
      data: ordersConTotal,
      totalMesa,
      ordersCount: orders.length,
    });

  } catch (error) {
    console.error('Error en getOrdersByMesaId:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las órdenes de la mesa',
      error: error.message,
    });
  }
};

/* ══════════════════════════════════════════════════════════════
   POST /cajero/approve-payment/:mesaId
══════════════════════════════════════════════════════════════ */
const approvePayment = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { mesaId }     = req.params;
    const { metodoPago, sTokenSesion } = req.body;

    const metodosValidos = ['efectivo', 'tarjeta', 'transferencia'];
    if (!metodoPago || !metodosValidos.includes(metodoPago)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Método de pago inválido. Opciones: ${metodosValidos.join(', ')}`,
      });
    }

    const orderWhere = {
      iMesaId: mesaId,
      bPagado: false,
      sEstado: { [Op.notIn]: ['cancelado', 'pagado'] },
    };
    if (sTokenSesion && !sTokenSesion.startsWith('legacy-')) {
      orderWhere.sTokenSesion = sTokenSesion;
    }

    const mesa = await Table.findByPk(mesaId, { transaction });
    if (!mesa) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Mesa no encontrada' });
    }

    const orders = await Order.findAll({
      where: orderWhere,
      include: ORDER_INCLUDE,
      transaction,
    });

    if (orders.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'No hay órdenes pendientes de pago en esta mesa',
      });
    }

    const totalPagar = orders.reduce((sum, o) => sum + calcularTotalOrden(o), 0);

    await Order.update(
      {
        bPagado:     true,
        dFechaPago:  new Date(),
        sMetodoPago: metodoPago,
        sEstado:     'pagado',
      },
      {
        where: orderWhere,
        transaction,
      }
    );

    await Table.update(
      { sEstado: 'disponible' },
      { where: { id: mesaId }, transaction }
    );

    await transaction.commit();

    const usuarioDeMesa = orders[0]?.usuario;
    let nuevoToken = null;

    if (usuarioDeMesa) {
      nuevoToken = jwt.sign(
        {
          id:      usuarioDeMesa.id,
          rol:     usuarioDeMesa.rol,
          iMesaId: parseInt(mesaId, 10),
          loginAt: new Date().toISOString(),
        },
        process.env.JWT_SECRET,
        { expiresIn: '12h' }
      );
    }

    res.json({
      success: true,
      message: 'Pago aprobado exitosamente',
      data: {
        mesa:              mesa.sNombre,
        totalPagado:       totalPagar,
        metodoPago,
        ordersProcesadas:  orders.length,
        nuevoTokenCliente: nuevoToken,
      },
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error en approvePayment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar el pago',
      error: error.message,
    });
  }
};

/* ══════════════════════════════════════════════════════════════
   PUT /cajero/change-table-status/:mesaId
══════════════════════════════════════════════════════════════ */
const changeTableAvailability = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { mesaId }  = req.params;
    const { sEstado } = req.body;

    const estadosValidos = ['disponible', 'ocupada', 'reservada', 'inactiva', 'en_pago'];
    if (!sEstado || !estadosValidos.includes(sEstado)) {
      return res.status(400).json({
        success: false,
        message: `Estado no válido. Estados permitidos: ${estadosValidos.join(', ')}`,
      });
    }

    const mesa = await Table.findByPk(mesaId, { transaction });
    if (!mesa) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Mesa no encontrada' });
    }

    if (sEstado === 'disponible') {
      // Cancelar todos los pedidos huérfanos que no estén ya pagados o cancelados
      await Order.update(
        { sEstado: 'cancelado' },
        { 
          where: {
            iMesaId: mesaId,
            bPagado: false,
            sEstado: { [Op.notIn]: ['cancelado', 'pagado'] },
          },
          transaction
        }
      );
    }

    await mesa.update({ sEstado }, { transaction });
    await transaction.commit();

    res.json({
      success: true,
      message: `Estado de mesa actualizado a "${sEstado}"`,
      data: mesa,
    });

  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Error en changeTableAvailability:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar disponibilidad de la mesa',
      error: error.message,
    });
  }
};

/* ══════════════════════════════════════════════════════════════
   GET /cajero/sales-summary
══════════════════════════════════════════════════════════════ */
const getSalesSummary = async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const ordersPagadas = await Order.findAll({
      where: {
        bPagado:    true,
        dFechaPago: { [Op.gte]: hoy, [Op.lt]: manana },
      },
      include: [
        { model: Table, as: 'mesa', attributes: ['id', 'sNombre'] },
      ],
    });

    const totalVentas = ordersPagadas.reduce(
      (sum, o) => sum + parseFloat(o.dTotal || 0), 0
    );

    const porMetodoPago = ordersPagadas.reduce((acc, o) => {
      const metodo = o.sMetodoPago || 'no_registrado';
      if (!acc[metodo]) acc[metodo] = { total: 0, cantidad: 0 };
      acc[metodo].total    += parseFloat(o.dTotal || 0);
      acc[metodo].cantidad += 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        fecha:        hoy.toISOString().split('T')[0],
        totalVentas,
        totalOrdenes: ordersPagadas.length,
        porMetodoPago,
        ordenes: ordersPagadas.map(o => ({
          id:         o.id,
          mesa:       o.mesa?.sNombre || `Mesa ${o.iMesaId}`,
          total:      o.dTotal,
          metodoPago: o.sMetodoPago,
          fechaPago:  o.dFechaPago,
        })),
      },
    });

  } catch (error) {
    console.error('Error en getSalesSummary:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen de ventas',
      error: error.message,
    });
  }
};

module.exports = {
  getOrdersByTable,
  getOrdersByMesaId,
  approvePayment,
  changeTableAvailability,
  getSalesSummary,
};
