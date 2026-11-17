const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define(
  'Product',
  {
    enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    name: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, allowNull: false },
    use_in_menu: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    description: { type: DataTypes.TEXT },
    price: { type: DataTypes.FLOAT, allowNull: false },
    price_with_discount: { type: DataTypes.FLOAT, allowNull: false },
  },
  { tableName: 'products' }
);
