import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Requires a running Postgres reachable via DATABASE_URL (see docker-compose.yml)
 * and migrations applied: `npm run prisma:migrate`.
 * Run with: npm run test:e2e
 */
describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const testEmail = `e2e-${Date.now()}@example.com`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await app.close();
  });

  it('rejects registration with a weak password', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: testEmail, password: 'weak', firstName: 'E2E', lastName: 'Test' })
      .expect(400);
  });

  it('registers a new user and returns a token pair', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        password: 'Str0ngP@ssword!',
        firstName: 'E2E',
        lastName: 'Test',
      })
      .expect(201);

    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it('rejects a duplicate registration', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        password: 'Str0ngP@ssword!',
        firstName: 'E2E',
        lastName: 'Test',
      })
      .expect(409);
  });

  it('logs in with valid credentials', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: 'Str0ngP@ssword!' })
      .expect(200);

    expect(res.body.data.accessToken).toBeDefined();
  });

  it('rejects login with an incorrect password', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: 'WrongPassword1' })
      .expect(401);
  });

  it('blocks access to a protected route without a token', () => {
    return request(app.getHttpServer()).get('/api/v1/users/me').expect(401);
  });

  it('allows access to a protected route with a valid token', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: 'Str0ngP@ssword!' });

    const accessToken = loginRes.body.data.accessToken;

    const res = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.email).toBe(testEmail);
  });
});
