const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { UPLOAD_DIR } = require('../config/upload');
const { AppError } = require('../middleware/errorHandler');

const extensions = { 'image/png': 'png', 'image/jpeg': 'jpg' };

function save({ type, content } = {}) {
  const extension = extensions[type];

  if (!extension || typeof content !== 'string' || !content) {
    throw new AppError(400, 'Imagem inválida');
  }

  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const filename = `${crypto.randomUUID()}.${extension}`;
  const base64 = content.replace(/^data:.+;base64,/, '');
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), Buffer.from(base64, 'base64'));

  return `/uploads/${filename}`;
}

function remove(filePath) {
  if (!filePath) return;
  fs.rmSync(path.join(UPLOAD_DIR, path.basename(filePath)), { force: true });
}

module.exports = { save, remove };
