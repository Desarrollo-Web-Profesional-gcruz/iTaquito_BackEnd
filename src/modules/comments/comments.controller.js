'use strict';

const { Comment, Table } = require('../../models');

/* ══════════════════════════════════════════════════════════════
   POST /comments
   iMesaId: integer (opcional)
   sEmoji: string (requerido)
   sCalificacion: string (requerido)
   sComentario: string (opcional)
══════════════════════════════════════════════════════════════ */
const create = async (req, res) => {
  try {
    const { iMesaId, sEmoji, sCalificacion, sComentario } = req.body;

    if (!sEmoji || !sCalificacion) {
      return res.status(400).json({
        success: false,
        message: 'Emoji y calificación son requeridos.',
      });
    }

    // Opcional: Verificar que la mesa existe si se proporciona
    if (iMesaId) {
      const mesa = await Table.findByPk(iMesaId);
      if (!mesa) {
        return res.status(404).json({
          success: false,
          message: 'Mesa no encontrada.',
        });
      }
    }

    const comment = await Comment.create({
      iMesaId,
      sEmoji,
      sCalificacion,
      sComentario,
    });

    return res.status(201).json({
      success: true,
      message: 'Comentario guardado exitosamente.',
      data: comment,
    });
  } catch (error) {
    console.error('Error en create comment:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al guardar el comentario.',
      error: error.message,
    });
  }
};

/* ══════════════════════════════════════════════════════════════
   GET /comments (Para admin)
══════════════════════════════════════════════════════════════ */
const getAll = async (req, res) => {
  try {
    const comments = await Comment.findAll({
      include: [
        {
          model: Table,
          as: 'mesa',
          attributes: ['id', 'sNombre'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    console.error('Error en getAll comments:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener comentarios.',
      error: error.message,
    });
  }
};

module.exports = { create, getAll };
