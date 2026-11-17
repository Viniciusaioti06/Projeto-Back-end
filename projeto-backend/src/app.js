const express = require('express');
const qs = require('qs');
const swaggerUi = require('swagger-ui-express');
const routes = require('./routes');
const swaggerDocument = require('./docs/swagger');
const { UPLOAD_DIR } = require('./config/upload');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// sem isso, option[1]=40 viraria array em vez de objeto {1: '40'}
app.set('query parser', (str) => qs.parse(str, { parseArrays: false }));

app.use(express.json({ limit: '20mb' }));
app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
