'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Comment extends Model {
    static associate(models) {
      Comment.belongsTo(models.Table, { foreignKey: 'iMesaId', as: 'mesa' });
    }
  }

  Comment.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      iMesaId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      sEmoji: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      sCalificacion: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      sComentario: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Comment',
      tableName: 'comments',
      timestamps: true,
    }
  );

  return Comment;
};
