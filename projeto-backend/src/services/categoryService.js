const { Category, ProductCategory } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { parsePagination } = require('./pagination');

const allowedFields = ['id', 'name', 'slug', 'use_in_menu'];

function validate(data = {}) {
  if (!data.name || !data.slug) {
    throw new AppError(400, 'name e slug são obrigatórios');
  }
  if (data.use_in_menu !== undefined && typeof data.use_in_menu !== 'boolean') {
    throw new AppError(400, 'use_in_menu deve ser booleano');
  }
}

async function findOrFail(id) {
  const category = await Category.findByPk(id, { attributes: allowedFields });
  if (!category) throw new AppError(404, 'Categoria não encontrada');
  return category;
}

async function search(params) {
  const { size, current, query } = parsePagination(params);
  const { fields, use_in_menu: useInMenu } = params;

  const where = {};
  if (useInMenu !== undefined) where.use_in_menu = useInMenu === 'true';

  const requested = fields ? fields.split(',').filter((field) => allowedFields.includes(field)) : allowedFields;

  const { rows, count } = await Category.findAndCountAll({
    where,
    attributes: requested.length ? requested : allowedFields,
    order: [['id', 'ASC']],
    ...query,
  });

  return { data: rows, total: count, limit: size, page: current };
}

async function getById(id) {
  return findOrFail(id);
}

async function create(data) {
  validate(data);
  const category = await Category.create({
    name: data.name,
    slug: data.slug,
    use_in_menu: data.use_in_menu,
  });
  return findOrFail(category.id);
}

async function update(id, data) {
  const category = await findOrFail(id);
  validate(data);
  await category.update({ name: data.name, slug: data.slug, use_in_menu: data.use_in_menu });
}

async function remove(id) {
  const category = await findOrFail(id);
  await ProductCategory.destroy({ where: { category_id: id } });
  await category.destroy();
}

module.exports = { search, getById, create, update, remove };
