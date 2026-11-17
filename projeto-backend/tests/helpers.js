const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models');

const userData = { firstname: 'Ana', surname: 'Lima', email: 'ana@email.com', password: '123456', confirmPassword: '123456' };

async function resetDatabase() {
  await sequelize.sync({ force: true });
}

async function getToken() {
  await request(app).post('/v1/user').send(userData);
  const res = await request(app).post('/v1/user/token').send({ email: userData.email, password: userData.password });
  return `Bearer ${res.body.token}`;
}

module.exports = { app, userData, resetDatabase, getToken };
