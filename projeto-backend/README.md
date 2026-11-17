# Projeto Back-end

API REST com Node.js, Express, Sequelize (MySQL) e autenticação JWT.

## Requisitos

- Node.js 18+
- MySQL 8+

## Como rodar

```bash
npm install
cp .env.example .env      # ajuste as credenciais do MySQL e o JWT_SECRET
```

Crie o banco (o nome precisa ser o mesmo de `DB_NAME`) e rode as migrations:

```bash
mysql -u root -p -e "CREATE DATABASE projeto_backend"
npm run migrate
npm run dev
```

A API sobe em `http://localhost:3000` e a documentação Swagger fica em `/docs`.

## Testes

```bash
npm test
```

Os testes usam SQLite em memória, então não precisam do MySQL.

## Estrutura

```
src/
├── config/        conexão com o banco, upload e configuração do CLI
├── controllers/   recebem a requisição e devolvem a resposta
├── middleware/    autenticação JWT e tratamento de erros
├── migrations/    criação das tabelas
├── models/        modelos do Sequelize e associações
├── routes/        definição das rotas
├── services/      regras de negócio e acesso ao banco
├── docs/          documentação Swagger
├── app.js
└── server.js
tests/
```

## Endpoints

| Método | Rota | Token |
| --- | --- | --- |
| POST | `/v1/user/token` | não |
| POST | `/v1/user` | não |
| GET | `/v1/user/:id` | não |
| PUT, DELETE | `/v1/user/:id` | sim |
| GET | `/v1/category/search` | não |
| GET | `/v1/category/:id` | não |
| POST | `/v1/category` | sim |
| PUT, DELETE | `/v1/category/:id` | sim |
| GET | `/v1/product/search` | não |
| GET | `/v1/product/:id` | não |
| POST | `/v1/product` | sim |
| PUT, DELETE | `/v1/product/:id` | sim |

O token é enviado no header `Authorization: Bearer <token>`.

### Parâmetros de busca

- Categorias: `limit`, `page`, `fields`, `use_in_menu`
- Produtos: `limit`, `page`, `fields`, `match`, `category_ids`, `price-range` (ex.: `100-200`) e `option[id]` (ex.: `option[45]=GG,PP`)
- `limit=-1` retorna todos os registros

## Códigos de resposta

`200` sucesso · `201` criado · `204` sem conteúdo · `400` dados inválidos · `401` token ausente ou inválido · `404` não encontrado
