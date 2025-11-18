import request from 'supertest';
import app from '../../server';
import { cleanDatabase, createTestUser } from '../helpers/testHelpers';
import User from '../../models/User';

describe('Authentication', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'TestPassword123!',
          confirmPassword: 'TestPassword123!',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toHaveProperty('_id');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should reject weak passwords', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'weak',
          confirmPassword: 'weak',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject duplicate email', async () => {
      await createTestUser({ email: 'test@example.com' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser2',
          email: 'test@example.com',
          password: 'TestPassword123!',
          confirmPassword: 'TestPassword123!',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      await createTestUser({
        email: 'test@example.com',
        password: 'TestPassword123!',
        isEmailVerified: true,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('accessToken');
    });

    it('should reject incorrect password', async () => {
      await createTestUser({
        email: 'test@example.com',
        password: 'TestPassword123!',
        isEmailVerified: true,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject unverified email', async () => {
      await createTestUser({
        email: 'test@example.com',
        password: 'TestPassword123!',
        isEmailVerified: false,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user with valid token', async () => {
      const user = await createTestUser();
      const { getAuthHeaders } = await import('../helpers/testHelpers');
      const authHeaders = getAuthHeaders(user._id.toString());

      const response = await request(app)
        .get('/api/auth/me')
        .set(authHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user._id).toBe(user._id.toString());
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});

