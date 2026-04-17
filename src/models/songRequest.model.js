'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SongRequest extends Model {
    static associate(models) {
      SongRequest.belongsTo(models.Table, { foreignKey: 'iMesaId', as: 'mesa' });
      SongRequest.belongsTo(models.User,  { foreignKey: 'iUsuarioId', as: 'usuario' });
    }
  }

  SongRequest.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      iMesaId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'tables', key: 'id' },
      },
      iUsuarioId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      sSpotifyTrackId: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'ID del track en Spotify',
      },
      sNombre: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Nombre de la canción',
      },
      sArtista: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Artista(s)',
      },
      sAlbum: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Nombre del álbum',
      },
      sImagenUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'URL de la portada del álbum',
      },
      sPreviewUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'URL del preview de 30s',
      },
      iDuracionMs: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Duración en milisegundos',
      },
      sEstado: {
        type: DataTypes.ENUM('en_cola', 'reproduciendo', 'completada', 'descartada', 'cancelada'),
        defaultValue: 'en_cola',
        allowNull: false,
      },
      iPosicion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Posición en la cola de reproducción',
      },
      bStaffAdded: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'true si fue agregada por el staff manualmente',
      },
    },
    {
      sequelize,
      modelName: 'SongRequest',
      tableName: 'song_requests',
      timestamps: true,
    }
  );

  return SongRequest;
};
