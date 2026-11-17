const { Op } = require('sequelize');
const { sequelize, Product, Category, ProductImage, ProductOption, ProductCategory } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { parsePagination } = require('./pagination');
const imageService = require('./imageService');

const productFields = ['enabled', 'name', 'slug', 'use_in_menu', 'stock', 'description', 'price', 'price_with_discount'];
const searchableFields = ['id', ...productFields];

const includes = [
  { model: ProductImage, as: 'images', attributes: ['id', 'path'] },
  { model: ProductOption, as: 'options', attributes: ['id', 'title', 'shape', 'radius', 'type', 'values'] },
  { model: Category, as: 'categories', attributes: ['id'], through: { attributes: [] } },
];

function format(instance) {
  const { categories, images, options, ...product } = instance.toJSON();
  return {
    ...product,
    category_ids: categories.map((category) => category.id),
    images: images.map((image) => ({ id: image.id, content: image.path })),
    options: options.map((option) => ({ ...option, values: option.values ? option.values.split(',') : [] })),
  };
}

function pick(data) {
  return Object.fromEntries(productFields.filter((field) => data[field] !== undefined).map((field) => [field, data[field]]));
}

function validate(data = {}, partial = false) {
  if (!partial) {
    ['name', 'slug', 'price', 'price_with_discount'].forEach((field) => {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        throw new AppError(400, `O campo ${field} é obrigatório`);
      }
    });
  }

  ['price', 'price_with_discount', 'stock'].forEach((field) => {
    if (data[field] !== undefined && (Number.isNaN(Number(data[field])) || Number(data[field]) < 0)) {
      throw new AppError(400, `O campo ${field} é inválido`);
    }
  });

  if (data.price !== undefined && data.price_with_discount !== undefined && Number(data.price_with_discount) > Number(data.price)) {
    throw new AppError(400, 'price_with_discount não pode ser maior que price');
  }

  ['category_ids', 'images', 'options'].forEach((field) => {
    if (data[field] !== undefined && !Array.isArray(data[field])) {
      throw new AppError(400, `O campo ${field} deve ser uma lista`);
    }
  });
}

async function setCategories(productId, categoryIds = [], transaction) {
  const ids = [...new Set(categoryIds.map(Number))];

  if (ids.some((id) => Number.isNaN(id))) {
    throw new AppError(400, 'category_ids inválido');
  }
  if (ids.length && (await Category.count({ where: { id: ids }, transaction })) !== ids.length) {
    throw new AppError(400, 'Uma das categorias informadas não existe');
  }

  await ProductCategory.destroy({ where: { product_id: productId }, transaction });
  await ProductCategory.bulkCreate(ids.map((category_id) => ({ product_id: productId, category_id })), { transaction });
}

async function syncImages(productId, images = [], transaction) {
  for (const image of images) {
    if (!image.id) {
      await ProductImage.create({ product_id: productId, enabled: true, path: imageService.save(image) }, { transaction });
      continue;
    }

    const current = await ProductImage.findOne({ where: { id: image.id, product_id: productId }, transaction });
    if (!current) throw new AppError(400, `A imagem ${image.id} não pertence a este produto`);

    if (image.deleted) {
      imageService.remove(current.path);
      await current.destroy({ transaction });
    } else if (image.content) {
      imageService.remove(current.path);
      await current.update({ path: imageService.save(image) }, { transaction });
    }
  }
}

function optionData({ title, shape = 'square', radius = 0, type = 'text', values }) {
  if (!title || !Array.isArray(values) || !values.length) {
    throw new AppError(400, 'Opção do produto inválida');
  }
  if (!['square', 'circle'].includes(shape) || !['text', 'color'].includes(type)) {
    throw new AppError(400, 'shape ou type da opção inválido');
  }
  return { title, shape, radius, type, values: values.join(',') };
}

async function syncOptions(productId, options = [], transaction) {
  for (const option of options) {
    if (!option.id) {
      await ProductOption.create({ ...optionData(option), product_id: productId }, { transaction });
      continue;
    }

    const current = await ProductOption.findOne({ where: { id: option.id, product_id: productId }, transaction });
    if (!current) throw new AppError(400, `A opção ${option.id} não pertence a este produto`);

    if (option.deleted) {
      await current.destroy({ transaction });
    } else {
      const merged = { ...current.toJSON(), values: current.values.split(','), ...option };
      await current.update(optionData(merged), { transaction });
    }
  }
}

async function search(params) {
  const { size, current, query } = parsePagination(params);
  const { fields, match, category_ids: categoryIds, option } = params;
  const priceRange = params['price-range'];

  const where = {};
  const idSets = [];

  if (match) {
    where[Op.or] = [{ name: { [Op.like]: `%${match}%` } }, { description: { [Op.like]: `%${match}%` } }];
  }

  if (priceRange) {
    const [min, max] = priceRange.split('-').map(Number);
    if (Number.isNaN(min) || Number.isNaN(max)) throw new AppError(400, 'price-range inválido');
    where.price = { [Op.between]: [min, max] };
  }

  if (categoryIds) {
    const ids = categoryIds.split(',').map(Number);
    if (ids.some(Number.isNaN)) throw new AppError(400, 'category_ids inválido');
    const rows = await ProductCategory.findAll({ where: { category_id: ids }, attributes: ['product_id'] });
    idSets.push(rows.map((row) => row.product_id));
  }

  if (option && typeof option === 'object') {
    for (const [optionId, values] of Object.entries(option)) {
      const rows = await ProductOption.findAll({
        where: {
          id: Number(optionId),
          [Op.or]: String(values).split(',').map((value) => ({ values: { [Op.like]: `%${value}%` } })),
        },
        attributes: ['product_id'],
      });
      idSets.push(rows.map((row) => row.product_id));
    }
  }

  // um produto precisa atender a todos os filtros de id ao mesmo tempo
  if (idSets.length) {
    where.id = idSets.reduce((result, ids) => result.filter((id) => ids.includes(id)));
  }

  const requested = fields ? fields.split(',').filter((field) => searchableFields.includes(field)) : searchableFields;

  const { rows, count } = await Product.findAndCountAll({
    where,
    attributes: [...new Set(['id', ...requested])],
    include: includes,
    distinct: true,
    order: [['id', 'ASC']],
    ...query,
  });

  return { data: rows.map(format), total: count, limit: size, page: current };
}

async function getById(id) {
  const product = await Product.findByPk(id, { attributes: searchableFields, include: includes });
  if (!product) throw new AppError(404, 'Produto não encontrado');
  return format(product);
}

async function create(data) {
  validate(data);

  const id = await sequelize.transaction(async (transaction) => {
    const product = await Product.create(pick(data), { transaction });
    await setCategories(product.id, data.category_ids, transaction);
    await syncImages(product.id, data.images, transaction);
    await syncOptions(product.id, data.options, transaction);
    return product.id;
  });

  return getById(id);
}

async function update(id, data = {}) {
  const product = await Product.findByPk(id);
  if (!product) throw new AppError(404, 'Produto não encontrado');
  validate(data, true);

  await sequelize.transaction(async (transaction) => {
    await product.update(pick(data), { transaction });
    if (data.category_ids) await setCategories(id, data.category_ids, transaction);
    await syncImages(id, data.images, transaction);
    await syncOptions(id, data.options, transaction);
  });
}

async function remove(id) {
  const product = await Product.findByPk(id, { include: [{ model: ProductImage, as: 'images' }] });
  if (!product) throw new AppError(404, 'Produto não encontrado');

  await sequelize.transaction(async (transaction) => {
    await ProductCategory.destroy({ where: { product_id: id }, transaction });
    await ProductOption.destroy({ where: { product_id: id }, transaction });
    await ProductImage.destroy({ where: { product_id: id }, transaction });
    await product.destroy({ transaction });
  });

  product.images.forEach((image) => imageService.remove(image.path));
}

module.exports = { search, getById, create, update, remove };
