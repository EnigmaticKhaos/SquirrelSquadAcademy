import request from 'supertest';
import app from '../../server';
import { createTestUser, getAuthHeaders, cleanDatabase } from '../helpers/testHelpers';

describe('Rate Limiting', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Authentication Rate Limiting', () => {
    it('should rate limit login attempts', async () => {
      // Make 6 login attempts (limit is 5)
      for (let i = 0; i < 6; i++) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword',
          });

        if (i < 5) {
          expect(response.status).toBe(401);
        } else {
          // 6th request should be rate limited
          expect(response.status).toBe(429);
        }
      }
    });

    it('should rate limit registration attempts', async () => {
      // Make 6 registration attempts
      for (let i = 0; i < 6; i++) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: `user${i}`,
            email: `user${i}@example.com`,
            password: 'TestPassword123!',
            confirmPassword: 'TestPassword123!',
          });

        if (i < 5) {
          expect([200, 201, 400]).toContain(response.status);
        } else {
          expect(response.status).toBe(429);
        }
      }
    });
  });

  describe('API Rate Limiting', () => {
    it('should rate limit general API requests', async () => {
      const user = await createTestUser();
      const headers = getAuthHeaders(user._id.toString());

      // Make 101 requests (limit is 100)
      const requests = [];
      for (let i = 0; i < 101; i++) {
        requests.push(
          request(app)
            .get('/api/achievements')
            .set(headers)
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter((r) => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });
});

