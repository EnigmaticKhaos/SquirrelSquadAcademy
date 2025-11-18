import request from 'supertest';
import app from '../../server';
import { createTestUser, createTestBadge, getAuthHeaders, cleanDatabase } from '../helpers/testHelpers';
import User from '../../models/User';
import Badge from '../../models/Badge';

describe('Badge System', () => {
  let user: any;
  let authHeaders: any;

  beforeEach(async () => {
    await cleanDatabase();
    user = await createTestUser();
    authHeaders = getAuthHeaders(user._id.toString());
  });

  describe('Badge Unlock Validation', () => {
    it('should unlock badge when criteria is met', async () => {
      const badge = await createTestBadge({
        name: 'First Course Completed',
        triggerType: 'course_completed',
      });

      // Simulate course completion
      const { checkBadgesForTrigger } = await import('../../services/badgeService');
      await checkBadgesForTrigger({
        userId: user._id.toString(),
        triggerType: 'course_completed',
        triggerData: { courseId: 'test-course-id' },
      });

      const { default: UserBadge } = await import('../../models/UserBadge');
      const userBadges = await UserBadge.find({ user: user._id });
      expect(userBadges).toContainEqual(
        expect.objectContaining({
          badge: badge._id,
        })
      );
    });

    it('should not unlock badge if criteria is not met', async () => {
      const badge = await createTestBadge({
        name: 'Complete 10 Courses',
        triggerType: 'course_completed',
        triggerData: { count: 10 },
      });

      // Complete only 1 course
      const { checkBadgesForTrigger } = await import('../../services/badgeService');
      await checkBadgesForTrigger({
        userId: user._id.toString(),
        triggerType: 'course_completed',
        triggerData: { courseId: 'test-course-id' },
      });

      const { default: UserBadge } = await import('../../models/UserBadge');
      const userBadges = await UserBadge.find({ user: user._id });
      expect(userBadges).not.toContainEqual(
        expect.objectContaining({
          badge: badge._id,
        })
      );
    });

    it('should allow user to select badge for profile card', async () => {
      const badge = await createTestBadge();
      
      // Unlock badge
      const { checkBadgesForTrigger } = await import('../../services/badgeService');
      await checkBadgesForTrigger({
        userId: user._id.toString(),
        triggerType: 'course_completed',
        triggerData: { courseId: 'test-course-id' },
      });

      // Select badge for profile card
      const response = await request(app)
        .put('/api/users/profile')
        .set(authHeaders)
        .send({ selectedBadge: badge._id.toString() })
        .expect(200);

      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.profileCardBadge?.toString()).toBe(badge._id.toString());
    });
  });

  describe('GET /api/badges', () => {
    it('should get all badges', async () => {
      await createTestBadge({ name: 'Badge 1' });
      await createTestBadge({ name: 'Badge 2' });

      const response = await request(app)
        .get('/api/badges')
        .set(authHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.badges.length).toBeGreaterThanOrEqual(2);
    });
  });
});

