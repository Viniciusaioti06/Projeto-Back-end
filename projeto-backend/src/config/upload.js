require('dotenv').config({ quiet: true });
const path = require('path');

module.exports = {
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads'),
};
