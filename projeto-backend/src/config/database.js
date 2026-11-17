require('dotenv').config({ quiet: true });
const { Sequelize } = require('sequelize');

const dialect = process.env.DB_DIALECT || 'mysql';

const sequelize =
  dialect === 'sqlite'
    ? new Sequelize({ dialect, storage: ':memory:', logging: false })
    : new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        dialect,
        logging: false,
      });

module.exports = sequelize;
