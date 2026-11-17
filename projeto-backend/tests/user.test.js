const request = require('supertest');
const { app, userData, resetDatabase, getToken } = require('./helpers');

let auth;

beforeEach(async () => {
  await resetDatabase();
  auth = await getToken();
});

describe('usuários', () => {
  it('cadastra usuário sem expor a senha', async () => {
    const res = await request(app).post('/v1/user').send({ ...userData, email: 'novo@email.com' });
    expect(res.status).toBe(201);
    expect(res.body.email).toBe('novo@email.com');
    expect(res.body.password).toBeUndefined();
  });

  it('rejeita senhas diferentes e e-mail repetido', async () => {
    const diff = await request(app).post('/v1/user').send({ ...userData, email: 'x@email.com', confirmPassword: '000' });
    const repeated = await request(app).post('/v1/user').send(userData);
    expect(diff.status).toBe(400);
    expect(repeated.status).toBe(400);
  });

  it('gera token apenas com credenciais válidas', async () => {
    const wrong = await request(app).post('/v1/user/token').send({ email: userData.email, password: 'errada' });
    expect(wrong.status).toBe(400);
    expect(auth).toMatch(/^Bearer .+/);
  });

  it('busca usuário por id', async () => {
    expect((await request(app).get('/v1/user/1')).status).toBe(200);
    expect((await request(app).get('/v1/user/99')).status).toBe(404);
  });

  it('exige token para atualizar e deletar', async () => {
    const body = { firstname: 'Ana', surname: 'Souza', email: 'ana@email.com' };
    expect((await request(app).put('/v1/user/1').send(body)).status).toBe(401);
    expect((await request(app).put('/v1/user/1').set('Authorization', auth).send(body)).status).toBe(204);
    expect((await request(app).delete('/v1/user/1')).status).toBe(401);
    expect((await request(app).delete('/v1/user/1').set('Authorization', auth)).status).toBe(204);
    expect((await request(app).get('/v1/user/1')).status).toBe(404);
  });
});
