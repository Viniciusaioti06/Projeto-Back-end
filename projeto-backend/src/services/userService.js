const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User } = require('../models');
const { AppError } = require('../middleware/errorHandler');

const publicFields = ['id', 'firstname', 'surname', 'email'];
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function findOrFail(id) {
  const user = await User.findByPk(id);
  if (!user) throw new AppError(404, 'Usuário não encontrado');
  return user;
}

async function checkProfile({ firstname, surname, email }, ignoreId) {
  if (!firstname || !surname || !email) {
    throw new AppError(400, 'firstname, surname e email são obrigatórios');
  }
  if (!emailRegex.test(email)) {
    throw new AppError(400, 'E-mail inválido');
  }

  const where = ignoreId ? { email, id: { [Op.ne]: ignoreId } } : { email };
  if (await User.findOne({ where })) {
    throw new AppError(400, 'E-mail já cadastrado');
  }
}

async function getById(id) {
  const user = await findOrFail(id);
  return publicFields.reduce((data, field) => ({ ...data, [field]: user[field] }), {});
}

async function create(data = {}) {
  await checkProfile(data);

  if (!data.password || data.password !== data.confirmPassword) {
    throw new AppError(400, 'As senhas não conferem');
  }

  const user = await User.create({
    firstname: data.firstname,
    surname: data.surname,
    email: data.email,
    password: await bcrypt.hash(data.password, 10),
  });

  return getById(user.id);
}

async function update(id, data = {}) {
  const user = await findOrFail(id);
  await checkProfile(data, user.id);
  await user.update({ firstname: data.firstname, surname: data.surname, email: data.email });
}

async function remove(id) {
  const user = await findOrFail(id);
  await user.destroy();
}

module.exports = { getById, create, update, remove };
