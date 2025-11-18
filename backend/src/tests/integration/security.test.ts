import request from 'supertest';
import app from '../../server';
import { createTestUser, getAuthHeaders, cleanDatabase } from '../helpers/testHelpers';

describe('Security Features', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('XSS Protection', () => {
    it('should sanitize XSS in user input', async () => {
      const user = await createTestUser();
      const headers = getAuthHeaders(user._id.toString());

      const maliciousInput = '<script>alert("xss")</script>';

      const response = await request(app)
        .post('/api/posts')
        .set(headers)
        .send({
          content: maliciousInput,
          type: 'text',
        });

      // Should either reject or sanitize
      if (response.status === 201) {
        expect(response.body.post.content).not.toContain('<script>');
      } else {
        expect(response.status).toBeGreaterThanOrEqual(400);
      }
    });
  });

  describe('NoSQL Injection Protection', () => {
    it('should prevent NoSQL injection in queries', async () => {
      const user = await createTestUser();
      const headers = getAuthHeaders(user._id.toString());

      // Attempt NoSQL injection
      const maliciousQuery = { $ne: null };

      const response = await request(app)
        .get('/api/courses')
        .set(headers)
        .query(maliciousQuery);

      // Should handle safely without exposing data
      expect(response.status).not.toBe(500);
    });
  });

  describe('Input Validation', () => {
    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'invalid-email',
          password: 'TestPassword123!',
          confirmPassword: 'TestPassword123!',
        });

      expect(response.status).toBe(400);
    });

    it('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'weak',
          confirmPassword: 'weak',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Authentication', () => {
    it('should require authentication for protected routes', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid tokens', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});

