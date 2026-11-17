const request = require('supertest');
const { app, resetDatabase, getToken } = require('./helpers');

let auth;

beforeEach(async () => {
  await resetDatabase();
  auth = await getToken();
});

const create = (body) => request(app).post('/v1/category').set('Authorization', auth).send(body);

describe('categorias', () => {
  it('exige token e dados válidos para criar', async () => {
    expect((await request(app).post('/v1/category').send({ name: 'A', slug: 'a' })).status).toBe(401);
    expect((await create({ name: 'A' })).status).toBe(400);
    const res = await create({ name: 'Camisetas', slug: 'camisetas', use_in_menu: true });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
  });

  it('lista com paginação, filtro e campos', async () => {
    await create({ name: 'A', slug: 'a', use_in_menu: true });
    await create({ name: 'B', slug: 'b' });
    await create({ name: 'C', slug: 'c', use_in_menu: true });

    const page = await request(app).get('/v1/category/search?limit=2&page=1');
    expect(page.body.data).toHaveLength(2);
    expect(page.body.total).toBe(3);

    const menu = await request(app).get('/v1/category/search?use_in_menu=true&fields=name');
    expect(menu.body.data).toEqual([{ name: 'A' }, { name: 'C' }]);

    const all = await request(app).get('/v1/category/search?limit=-1');
    expect(all.body.data).toHaveLength(3);
    expect((await request(app).get('/v1/category/search?limit=abc')).status).toBe(400);
  });

  it('busca, atualiza e remove', async () => {
    await create({ name: 'A', slug: 'a' });
    expect((await request(app).get('/v1/category/1')).status).toBe(200);
    expect((await request(app).get('/v1/category/9')).status).toBe(404);
    expect((await request(app).put('/v1/category/1').set('Authorization', auth).send({ name: 'Novo', slug: 'novo' })).status).toBe(204);
    expect((await request(app).get('/v1/category/1')).body.name).toBe('Novo');
    expect((await request(app).delete('/v1/category/1').set('Authorization', auth)).status).toBe(204);
    expect((await request(app).delete('/v1/category/1').set('Authorization', auth)).status).toBe(404);
  });
});
