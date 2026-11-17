const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define(
  'ProductOption',
  {
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    shape: { type: DataTypes.ENUM('square', 'circle'), allowNull: false, defaultValue: 'square' },
    radius: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    type: { type: DataTypes.ENUM('text', 'color'), allowNull: false, defaultValue: 'text' },
    values: { type: DataTypes.STRING, allowNull: false },
  },
  { tableName: 'product_options' }
);
