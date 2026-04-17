'use strict';

/**
 * Music Service — iTaquito
 * Powered by Deezer API (reemplazo de Spotify por restricciones feb 2026)
 * Sin API key requerida — completamente gratuito
 */

async function searchTracks(query, limit = 20) {
  const safeQuery = String(query || '').trim();
  const safeLimit = Math.max(1, Math.min(50, parseInt(limit, 10) || 20));

  if (!safeQuery) return [];

  const url =
    'https://api.deezer.com/search?q=' +
    encodeURIComponent(safeQuery) +
    '&limit=' + safeLimit +
    '&output=json';

  console.log('--- iTaquito Debug ---');
  console.log('Buscando:', safeQuery);
  console.log('URL Final:', url);

  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error('Error en búsqueda de Deezer: ' + response.status + ' — ' + errorText);
  }

  const data = await response.json();
  return (data.data || [])
    .filter(track => !track.explicit_lyrics)
    .map(formatTrack);
}

async function getTrackById(trackId) {
  if (!trackId) return null;

  const url = 'https://api.deezer.com/track/' + String(trackId).trim();
  const response = await fetch(url);

  if (!response.ok) return null;

  const track = await response.json();
  if (track.explicit_lyrics) return null;

  return formatTrack(track);
}

async function getRecommendations(limit = 20) {
  const safeLimit = Math.max(1, Math.min(50, parseInt(limit, 10) || 20));

  // chart/0 = top tracks del país detectado por IP (México desde tu red)
  const url = 'https://api.deezer.com/chart/0/tracks?limit=' + safeLimit;

  console.log('--- iTaquito Recomendaciones ---');
  console.log('URL:', url);

  const response = await fetch(url);

  if (!response.ok) {
    console.error('Error en recomendaciones Deezer:', response.status);
    return [];
  }

  const data = await response.json();
  const tracks = data.data || data.tracks?.data || [];

  console.log('Tracks recibidos:', tracks.length);

  return tracks
    .filter(track => !track.explicit_lyrics)
    .map(formatTrack);
}

function formatTrack(track) {
  return {
    spotifyTrackId: String(track.id),
    nombre: track.title || track.title_short || '',
    artista: track.artist?.name || 'Desconocido',
    album: track.album?.title || '',
    imagenUrl: track.album?.cover_big || track.album?.cover || '',
    imagenUrlSmall: track.album?.cover_small || track.album?.cover || '',
    previewUrl: track.preview || '',
    duracionMs: (track.duration || 0) * 1000,
    explicit: track.explicit_lyrics || false,
  };
}

module.exports = {
  getAccessToken: async () => 'deezer-no-token-required',
  searchTracks,
  getTrackById,
  getRecommendations,
};