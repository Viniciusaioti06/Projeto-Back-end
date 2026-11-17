const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define(
  'User',
  {
    firstname: { type: DataTypes.STRING, allowNull: false },
    surname: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
  },
  { tableName: 'users' }
);
