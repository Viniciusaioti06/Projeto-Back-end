const asyncHandler = require('../middleware/asyncHandler');
const productService = require('../services/productService');

exports.search = asyncHandler(async (req, res) => {
  res.status(200).json(await productService.search(req.query));
});

exports.getById = asyncHandler(async (req, res) => {
  res.status(200).json(await productService.getById(req.params.id));
});

exports.create = asyncHandler(async (req, res) => {
  res.status(201).json(await productService.create(req.body));
});

exports.update = asyncHandler(async (req, res) => {
  await productService.update(req.params.id, req.body);
  res.status(204).send();
});

exports.remove = asyncHandler(async (req, res) => {
  await productService.remove(req.params.id);
  res.status(204).send();
});
