const request = require('supertest');
const { app, resetDatabase, getToken } = require('./helpers');

const pixel =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

let auth;

const productBody = (extra = {}) => ({
  enabled: true,
  name: 'Tênis Nike',
  slug: 'tenis-nike',
  stock: 10,
  description: 'Tênis de corrida',
  price: 200,
  price_with_discount: 150,
  category_ids: [1],
  images: [{ type: 'image/png', content: pixel }],
  options: [{ title: 'Tamanho', shape: 'square', type: 'text', values: ['39', '40', '41'] }],
  ...extra,
});

const create = (body) => request(app).post('/v1/product').set('Authorization', auth).send(body);

beforeEach(async () => {
  await resetDatabase();
  auth = await getToken();
  await request(app).post('/v1/category').set('Authorization', auth).send({ name: 'Calçados', slug: 'calcados' });
});

describe('produtos', () => {
  it('cria produto com categorias, imagens e opções', async () => {
    const res = await create(productBody());
    expect(res.status).toBe(201);
    expect(res.body.category_ids).toEqual([1]);
    expect(res.body.images[0].content).toMatch(/^\/uploads\/.+\.png$/);
    expect(res.body.options[0].values).toEqual(['39', '40', '41']);
  });

  it('valida os dados de entrada', async () => {
    expect((await request(app).post('/v1/product').send(productBody())).status).toBe(401);
    expect((await create(productBody({ name: undefined }))).status).toBe(400);
    expect((await create(productBody({ category_ids: [99] }))).status).toBe(400);
    expect((await create(productBody({ price_with_discount: 500 }))).status).toBe(400);
  });

  it('busca por id', async () => {
    await create(productBody());
    expect((await request(app).get('/v1/product/1')).body.name).toBe('Tênis Nike');
    expect((await request(app).get('/v1/product/9')).status).toBe(404);
  });

  it('filtra na busca', async () => {
    await create(productBody());
    await create(productBody({ name: 'Camisa', slug: 'camisa', description: 'Algodão', price: 80, price_with_discount: 80, category_ids: [], images: [], options: [] }));

    const byMatch = await request(app).get('/v1/product/search?match=tênis');
    expect(byMatch.body.data).toHaveLength(1);

    const byPrice = await request(app).get('/v1/product/search?price-range=50-100');
    expect(byPrice.body.data.map((p) => p.name)).toEqual(['Camisa']);

    const byCategory = await request(app).get('/v1/product/search?category_ids=1');
    expect(byCategory.body.total).toBe(1);

    const byOption = await request(app).get('/v1/product/search?option[1]=40');
    expect(byOption.body.data[0].name).toBe('Tênis Nike');

    const paged = await request(app).get('/v1/product/search?limit=1&page=2&fields=name');
    expect(paged.body.data[0].name).toBe('Camisa');
  });

  it('atualiza produto, imagens e opções', async () => {
    const created = await create(productBody());
    const body = {
      price: 220,
      images: [{ id: created.body.images[0].id, deleted: true }],
      options: [{ id: created.body.options[0].id, values: ['42'] }],
    };
    expect((await request(app).put('/v1/product/1').set('Authorization', auth).send(body)).status).toBe(204);

    const updated = await request(app).get('/v1/product/1');
    expect(updated.body.price).toBe(220);
    expect(updated.body.images).toEqual([]);
    expect(updated.body.options[0].values).toEqual(['42']);
    expect((await request(app).put('/v1/product/9').set('Authorization', auth).send({})).status).toBe(404);
  });

  it('remove produto', async () => {
    await create(productBody());
    expect((await request(app).delete('/v1/product/1').set('Authorization', auth)).status).toBe(204);
    expect((await request(app).get('/v1/product/1')).status).toBe(404);
  });
});
