class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const notFound = (req, res) => res.status(404).json({ message: 'Rota não encontrada' });

const errorHandler = (err, req, res, next) => {
  if (err.status) {
    return res.status(err.status).json({ message: err.message });
  }
  console.error(err);
  return res.status(500).json({ message: 'Erro interno do servidor' });
};

module.exports = { AppError, notFound, errorHandler };
