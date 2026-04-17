'use strict';

const { Op } = require('sequelize');
const db = require('../../models');
const spotifyService = require('./spotify.service');

const SongRequest = () => db.SongRequest;
const User = () => db.User;

/* ─── CONSTANTES ─── */
const MAX_CREDITOS = 3;          // Máximo canciones por sesión
const PROXIMITY_WINDOW = 6;     // Ventana de duplicidad en la cola

/* ══════════════════════════════════════════════════════════════
   BÚSQUEDA DE CANCIONES
══════════════════════════════════════════════════════════════ */
const search = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'La búsqueda debe tener al menos 2 caracteres.' });
    }
    const tracks = await spotifyService.searchTracks(q.trim(), 20);
    res.json({ success: true, data: tracks });
  } catch (error) {
    console.error('Error buscando canciones:', error);
    res.status(500).json({ message: 'Error al buscar canciones en Spotify.' });
  }
};

/* ══════════════════════════════════════════════════════════════
   RECOMENDACIONES
══════════════════════════════════════════════════════════════ */
const recommendations = async (req, res) => {
  try {
    const tracks = await spotifyService.getRecommendations(20);
    res.json({ success: true, data: tracks });
  } catch (error) {
    console.error('Error obteniendo recomendaciones:', error);
    res.status(500).json({ message: 'Error al obtener recomendaciones.' });
  }
};

/* ══════════════════════════════════════════════════════════════
   SOLICITAR CANCIÓN (CLIENTE)
══════════════════════════════════════════════════════════════ */
const requestSong = async (req, res) => {
  try {
    const userId = req.user.id;
    const { spotifyTrackId, nombre, artista, album, imagenUrl, previewUrl, duracionMs } = req.body;

    if (!spotifyTrackId || !nombre || !artista) {
      return res.status(400).json({ message: 'Faltan datos de la canción.' });
    }

    // Obtener usuario para saber su mesa y sesión
    const user = await User().findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const sessionStart = user.dUltimoLogin || user.createdAt;

    // ── 1. Validar créditos (máx 3 por sesión) ──
    const myRequestsCount = await SongRequest().count({
      where: {
        iUsuarioId: userId,
        createdAt: { [Op.gte]: sessionStart },
        sEstado: { [Op.notIn]: ['descartada', 'cancelada'] },
        bStaffAdded: false,
      },
    });

    if (myRequestsCount >= MAX_CREDITOS) {
      return res.status(403).json({
        message: `Ya usaste tus ${MAX_CREDITOS} canciones para esta sesión.`,
        creditosUsados: myRequestsCount,
        creditosMaximos: MAX_CREDITOS,
      });
    }

    // ── 2. Validar duplicidad personal ──
    const alreadyRequested = await SongRequest().findOne({
      where: {
        iUsuarioId: userId,
        sSpotifyTrackId: spotifyTrackId,
        createdAt: { [Op.gte]: sessionStart },
        sEstado: { [Op.notIn]: ['descartada', 'cancelada'] },
      },
    });

    if (alreadyRequested) {
      return res.status(409).json({ message: 'Ya pediste esta canción en tu sesión actual.' });
    }

    // ── 3. Validar ventana de proximidad (6 posiciones en cola) ──
    const activeSongs = await SongRequest().findAll({
      where: { sEstado: { [Op.in]: ['en_cola', 'reproduciendo'] } },
      order: [['iPosicion', 'DESC']],
      limit: PROXIMITY_WINDOW,
    });

    const recentTrackIds = activeSongs.map(s => s.sSpotifyTrackId);
    if (recentTrackIds.includes(spotifyTrackId)) {
      return res.status(409).json({
        message: 'Esta canción ya está en la cola reciente. Intenta con otra.',
      });
    }

    // ── 4. Calcular posición ──
    const maxPos = await SongRequest().max('iPosicion', {
      where: { sEstado: { [Op.in]: ['en_cola', 'reproduciendo'] } },
    });
    const nuevaPosicion = (maxPos || 0) + 1;

    // ── 5. Crear solicitud ──
    const songRequest = await SongRequest().create({
      iMesaId: user.iMesaId || null,
      iUsuarioId: userId,
      sSpotifyTrackId: spotifyTrackId,
      sNombre: nombre,
      sArtista: artista,
      sAlbum: album || '',
      sImagenUrl: imagenUrl || '',
      sPreviewUrl: previewUrl || '',
      iDuracionMs: duracionMs || 0,
      sEstado: 'en_cola',
      iPosicion: nuevaPosicion,
      bStaffAdded: false,
    });

    const creditosRestantes = MAX_CREDITOS - (myRequestsCount + 1);

    res.status(201).json({
      success: true,
      message: '¡Canción agregada a la cola!',
      data: songRequest,
      creditosUsados: myRequestsCount + 1,
      creditosRestantes,
      creditosMaximos: MAX_CREDITOS,
    });
  } catch (error) {
    console.error('Error al solicitar canción:', error);
    res.status(500).json({ message: 'Error al agregar la canción a la cola.' });
  }
};

/* ══════════════════════════════════════════════════════════════
   VER COLA ACTIVA
══════════════════════════════════════════════════════════════ */
const getQueue = async (req, res) => {
  try {
    const queue = await SongRequest().findAll({
      where: { sEstado: { [Op.in]: ['en_cola', 'reproduciendo'] } },
      order: [['iPosicion', 'ASC']],
      include: [
        { model: db.Table, as: 'mesa', attributes: ['id', 'sNombre'] },
        { model: db.User, as: 'usuario', attributes: ['id', 'nombre'] },
      ],
    });

    res.json({ success: true, data: queue });
  } catch (error) {
    console.error('Error obteniendo cola:', error);
    res.status(500).json({ message: 'Error al obtener la cola de canciones.' });
  }
};

/* ══════════════════════════════════════════════════════════════
   MIS SOLICITUDES (CLIENTE)
══════════════════════════════════════════════════════════════ */
const myRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User().findByPk(userId);
    const sessionStart = user?.dUltimoLogin || user?.createdAt || new Date(0);

    const requests = await SongRequest().findAll({
      where: {
        iUsuarioId: userId,
        createdAt: { [Op.gte]: sessionStart },
      },
      order: [['createdAt', 'DESC']],
    });

    const creditosUsados = requests.filter(
      r => r.sEstado !== 'descartada' && r.sEstado !== 'cancelada' && !r.bStaffAdded
    ).length;

    res.json({
      success: true,
      data: requests,
      creditosUsados,
      creditosRestantes: Math.max(0, MAX_CREDITOS - creditosUsados),
      creditosMaximos: MAX_CREDITOS,
    });
  } catch (error) {
    console.error('Error obteniendo mis solicitudes:', error);
    res.status(500).json({ message: 'Error al obtener tus solicitudes.' });
  }
};

/* ══════════════════════════════════════════════════════════════
   CAMBIAR ESTADO (STAFF)
══════════════════════════════════════════════════════════════ */
const changeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { sEstado } = req.body;

    const validStates = ['en_cola', 'reproduciendo', 'completada', 'descartada', 'cancelada'];
    if (!validStates.includes(sEstado)) {
      return res.status(400).json({ message: `Estado inválido. Válidos: ${validStates.join(', ')}` });
    }

    const song = await SongRequest().findByPk(id);
    if (!song) {
      return res.status(404).json({ message: 'Canción no encontrada en la cola.' });
    }

    // Si se marca como "reproduciendo", pausar cualquier otra que esté reproduciéndose
    if (sEstado === 'reproduciendo') {
      await SongRequest().update(
        { sEstado: 'en_cola' },
        { where: { sEstado: 'reproduciendo', id: { [Op.ne]: id } } }
      );
    }

    song.sEstado = sEstado;
    await song.save();

    res.json({ success: true, message: 'Estado actualizado.', data: song });
  } catch (error) {
    console.error('Error cambiando estado:', error);
    res.status(500).json({ message: 'Error al cambiar el estado de la canción.' });
  }
};

/* ══════════════════════════════════════════════════════════════
   STAFF AGREGA CANCIÓN MANUALMENTE
══════════════════════════════════════════════════════════════ */
const staffAddSong = async (req, res) => {
  try {
    const { spotifyTrackId, nombre, artista, album, imagenUrl, previewUrl, duracionMs } = req.body;

    if (!spotifyTrackId || !nombre || !artista) {
      return res.status(400).json({ message: 'Faltan datos de la canción.' });
    }

    const maxPos = await SongRequest().max('iPosicion', {
      where: { sEstado: { [Op.in]: ['en_cola', 'reproduciendo'] } },
    });

    const song = await SongRequest().create({
      iMesaId: null,
      iUsuarioId: req.user.id,
      sSpotifyTrackId: spotifyTrackId,
      sNombre: nombre,
      sArtista: artista,
      sAlbum: album || '',
      sImagenUrl: imagenUrl || '',
      sPreviewUrl: previewUrl || '',
      iDuracionMs: duracionMs || 0,
      sEstado: 'en_cola',
      iPosicion: (maxPos || 0) + 1,
      bStaffAdded: true,
    });

    res.status(201).json({ success: true, message: 'Canción agregada por staff.', data: song });
  } catch (error) {
    console.error('Error al agregar canción (staff):', error);
    res.status(500).json({ message: 'Error al agregar la canción.' });
  }
};

/* ══════════════════════════════════════════════════════════════
   ELIMINAR DE LA COLA (STAFF)
══════════════════════════════════════════════════════════════ */
const removeSong = async (req, res) => {
  try {
    const { id } = req.params;
    const song = await SongRequest().findByPk(id);

    if (!song) {
      return res.status(404).json({ message: 'Canción no encontrada.' });
    }

    song.sEstado = 'descartada';
    await song.save();

    res.json({ success: true, message: 'Canción descartada.' });
  } catch (error) {
    console.error('Error al eliminar canción:', error);
    res.status(500).json({ message: 'Error al eliminar la canción.' });
  }
};

/* ══════════════════════════════════════════════════════════════
   CLIENTE CANCELA SU PROPIA CANCIÓN
══════════════════════════════════════════════════════════════ */
const cancelMySong = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const song = await SongRequest().findByPk(id);

    if (!song) {
      return res.status(404).json({ message: 'Canción no encontrada.' });
    }

    // Solo el dueño puede cancelar su propia canción
    if (song.iUsuarioId !== userId) {
      return res.status(403).json({ message: 'No puedes cancelar una canción que no pediste.' });
    }

    // Solo se puede cancelar si está en cola (no si ya está reproduciéndose)
    if (song.sEstado !== 'en_cola') {
      return res.status(400).json({ message: 'Solo puedes cancelar canciones que estén en cola, no las que ya están en curso.' });
    }

    song.sEstado = 'cancelada';
    await song.save();

    // Recalcular créditos
    const user = await User().findByPk(userId);
    const sessionStart = user?.dUltimoLogin || user?.createdAt || new Date(0);
    const activeRequests = await SongRequest().count({
      where: {
        iUsuarioId: userId,
        createdAt: { [Op.gte]: sessionStart },
        sEstado: { [Op.notIn]: ['descartada', 'cancelada'] },
        bStaffAdded: false,
      },
    });

    res.json({
      success: true,
      message: '¡Canción cancelada! Se recuperó 1 crédito.',
      creditosUsados: activeRequests,
      creditosRestantes: Math.max(0, MAX_CREDITOS - activeRequests),
      creditosMaximos: MAX_CREDITOS,
    });
  } catch (error) {
    console.error('Error al cancelar canción:', error);
    res.status(500).json({ message: 'Error al cancelar la canción.' });
  }
};

module.exports = {
  search,
  recommendations,
  requestSong,
  getQueue,
  myRequests,
  changeStatus,
  staffAddSong,
  removeSong,
  cancelMySong,
};
