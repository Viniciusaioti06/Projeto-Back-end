const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define(
  'Category',
  {
    name: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, allowNull: false },
    use_in_menu: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { tableName: 'categories' }
);
