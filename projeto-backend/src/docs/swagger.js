const bearer = [{ bearerAuth: [] }];
const idParam = { name: 'id', in: 'path', required: true, schema: { type: 'integer' } };
const body = (schema) => ({ required: true, content: { 'application/json': { schema } } });
const ok = (description, schema) =>
  schema ? { description, content: { 'application/json': { schema } } } : { description };

const user = {
  type: 'object',
  properties: { id: { type: 'integer' }, firstname: { type: 'string' }, surname: { type: 'string' }, email: { type: 'string' } },
};
const category = {
  type: 'object',
  properties: { id: { type: 'integer' }, name: { type: 'string' }, slug: { type: 'string' }, use_in_menu: { type: 'boolean' } },
};
const product = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    enabled: { type: 'boolean' },
    name: { type: 'string' },
    slug: { type: 'string' },
    use_in_menu: { type: 'boolean' },
    stock: { type: 'integer' },
    description: { type: 'string' },
    price: { type: 'number' },
    price_with_discount: { type: 'number' },
    category_ids: { type: 'array', items: { type: 'integer' } },
    images: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, content: { type: 'string' } } } },
    options: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          shape: { type: 'string', enum: ['square', 'circle'] },
          radius: { type: 'integer' },
          type: { type: 'string', enum: ['text', 'color'] },
          values: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
};

const searchParams = [
  { name: 'limit', in: 'query', schema: { type: 'integer', default: 12 }, description: '-1 retorna todos' },
  { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
  { name: 'fields', in: 'query', schema: { type: 'string' }, description: 'Campos separados por vírgula' },
];

const crud = (tag, schema, searchExtra = []) => ({
  search: {
    get: {
      tags: [tag],
      summary: `Listar (${tag})`,
      parameters: [...searchParams, ...searchExtra],
      responses: { 200: ok('Lista paginada'), 400: ok('Parâmetros inválidos') },
    },
  },
  create: {
    post: { tags: [tag], security: bearer, requestBody: body(schema), responses: { 201: ok('Criado', schema), 400: ok('Dados inválidos'), 401: ok('Não autorizado') } },
  },
  byId: {
    get: { tags: [tag], parameters: [idParam], responses: { 200: ok('Encontrado', schema), 404: ok('Não encontrado') } },
    put: { tags: [tag], security: bearer, parameters: [idParam], requestBody: body(schema), responses: { 204: ok('Atualizado'), 400: ok('Dados inválidos'), 401: ok('Não autorizado'), 404: ok('Não encontrado') } },
    delete: { tags: [tag], security: bearer, parameters: [idParam], responses: { 204: ok('Removido'), 401: ok('Não autorizado'), 404: ok('Não encontrado') } },
  },
});

const categories = crud('Categorias', category, [{ name: 'use_in_menu', in: 'query', schema: { type: 'boolean' } }]);
const products = crud('Produtos', product, [
  { name: 'match', in: 'query', schema: { type: 'string' } },
  { name: 'category_ids', in: 'query', schema: { type: 'string' }, description: 'Ex.: 1,2' },
  { name: 'price-range', in: 'query', schema: { type: 'string' }, description: 'Ex.: 100-200' },
  { name: 'option[id]', in: 'query', schema: { type: 'string' }, description: 'Ex.: option[45]=GG,PP' },
]);

module.exports = {
  openapi: '3.0.0',
  info: { title: 'Projeto Back-end', version: '1.0.0' },
  components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
  paths: {
    '/v1/user/token': {
      post: {
        tags: ['Usuários'],
        summary: 'Gerar token JWT',
        requestBody: body({ type: 'object', properties: { email: { type: 'string' }, password: { type: 'string' } } }),
        responses: { 200: ok('Token gerado'), 400: ok('Credenciais inválidas') },
      },
    },
    '/v1/user': {
      post: {
        tags: ['Usuários'],
        requestBody: body({
          type: 'object',
          properties: { ...user.properties, password: { type: 'string' }, confirmPassword: { type: 'string' } },
        }),
        responses: { 201: ok('Criado', user), 400: ok('Dados inválidos') },
      },
    },
    '/v1/user/{id}': {
      get: { tags: ['Usuários'], parameters: [idParam], responses: { 200: ok('Encontrado', user), 404: ok('Não encontrado') } },
      put: { tags: ['Usuários'], security: bearer, parameters: [idParam], requestBody: body(user), responses: { 204: ok('Atualizado'), 400: ok('Dados inválidos'), 401: ok('Não autorizado'), 404: ok('Não encontrado') } },
      delete: { tags: ['Usuários'], security: bearer, parameters: [idParam], responses: { 204: ok('Removido'), 401: ok('Não autorizado'), 404: ok('Não encontrado') } },
    },
    '/v1/category/search': categories.search,
    '/v1/category': categories.create,
    '/v1/category/{id}': categories.byId,
    '/v1/product/search': products.search,
    '/v1/product': products.create,
    '/v1/product/{id}': products.byId,
  },
};
