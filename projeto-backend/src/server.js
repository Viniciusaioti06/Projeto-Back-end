require('dotenv').config({ quiet: true });
const app = require('./app');
const { sequelize } = require('./models');

const port = process.env.PORT || 3000;

sequelize
  .authenticate()
  .then(() => app.listen(port, () => console.log(`Servidor rodando na porta ${port}`)))
  .catch((error) => {
    console.error('Não foi possível conectar ao banco de dados:', error.message);
    process.exit(1);
  });
