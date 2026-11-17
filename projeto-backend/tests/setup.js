const os = require('os');
const path = require('path');

process.env.DB_DIALECT = 'sqlite';
process.env.JWT_SECRET = 'segredo-de-teste';
process.env.UPLOAD_DIR = path.join(os.tmpdir(), 'projeto-backend-uploads');
