const { AppError } = require('../middleware/errorHandler');

function parsePagination({ limit = 12, page = 1 }) {
  const size = Number(limit);
  const current = Number(page);

  if (!Number.isInteger(size) || size === 0 || size < -1 || !Number.isInteger(current) || current < 1) {
    throw new AppError(400, 'Parâmetros de paginação inválidos');
  }

  // limit=-1 retorna todos os registros
  return { size, current, query: size > 0 ? { limit: size, offset: (current - 1) * size } : {} };
}

module.exports = { parsePagination };
