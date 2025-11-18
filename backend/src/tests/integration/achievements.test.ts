import request from 'supertest';
import app from '../../server';
import { createTestUser, createTestAchievement, getAuthHeaders, cleanDatabase } from '../helpers/testHelpers';
import User from '../../models/User';
import Achievement from '../../models/Achievement';
import { awardXP } from '../../services/xpService';

describe('Achievement System', () => {
  let user: any;
  let authHeaders: any;

  beforeEach(async () => {
    await cleanDatabase();
    user = await createTestUser();
    authHeaders = getAuthHeaders(user._id.toString());
  });

  describe('Achievement Unlock Validation', () => {
    it('should unlock achievement when criteria is met', async () => {
      // Create achievement for XP milestone
      const achievement = await createTestAchievement({
        name: 'First 100 XP',
        triggerType: 'xp_earned',
        triggerData: { amount: 100 },
        tier: 'common',
      });

      // Award XP that meets criteria
      await awardXP({
        userId: user._id.toString(),
        amount: 100,
        source: 'lesson_completed',
      });

      // Check if achievement was unlocked
      const { default: UserAchievement } = await import('../../models/UserAchievement');
      const userAchievements = await UserAchievement.find({ user: user._id });
      expect(userAchievements).toContainEqual(
        expect.objectContaining({
          achievement: achievement._id,
        })
      );
    });

    it('should not unlock achievement if criteria is not met', async () => {
      const achievement = await createTestAchievement({
        name: 'First 1000 XP',
        triggerType: 'xp_earned',
        triggerData: { amount: 1000 },
        tier: 'common',
      });

      // Award less XP than required
      await awardXP({
        userId: user._id.toString(),
        amount: 100,
        source: 'lesson_completed',
      });

      const { default: UserAchievement } = await import('../../models/UserAchievement');
      const userAchievements = await UserAchievement.find({ user: user._id });
      expect(userAchievements).not.toContainEqual(
        expect.objectContaining({
          achievement: achievement._id,
        })
      );
    });

    it('should not unlock achievement twice', async () => {
      const achievement = await createTestAchievement({
        name: 'First 100 XP',
        triggerType: 'xp_earned',
        triggerData: { amount: 100 },
        tier: 'common',
      });

      // Award XP twice
      await awardXP({
        userId: user._id.toString(),
        amount: 100,
        source: 'lesson_completed',
      });
      await awardXP({
        userId: user._id.toString(),
        amount: 50,
        source: 'lesson_completed',
      });

      const { default: UserAchievement } = await import('../../models/UserAchievement');
      const unlockedAchievements = await UserAchievement.find({
        user: user._id,
        achievement: achievement._id,
      });
      expect(unlockedAchievements).toHaveLength(1);
    });

    it('should track achievement progress', async () => {
      const achievement = await createTestAchievement({
        name: 'Complete 10 Lessons',
        triggerType: 'lesson_completed',
        triggerData: { count: 10 },
        tier: 'common',
      });

      // Complete 5 lessons
      for (let i = 0; i < 5; i++) {
        await awardXP({
          userId: user._id.toString(),
          amount: 10,
          source: 'lesson_completed',
        });
      }

      // Check progress (this would need to be implemented in achievement service)
      // For now, just verify achievement is not unlocked
      const { default: UserAchievement } = await import('../../models/UserAchievement');
      const userAchievements = await UserAchievement.find({ user: user._id });
      expect(userAchievements).not.toContainEqual(
        expect.objectContaining({
          achievement: achievement._id,
        })
      );
    });
  });

  describe('GET /api/achievements', () => {
    it('should get all achievements', async () => {
      await createTestAchievement({ name: 'Achievement 1' });
      await createTestAchievement({ name: 'Achievement 2' });

      const response = await request(app)
        .get('/api/achievements')
        .set(authHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.achievements.length).toBeGreaterThanOrEqual(2);
    });

    it('should get user achievements', async () => {
      const achievement = await createTestAchievement();
      await awardXP({
        userId: user._id.toString(),
        amount: 100,
        source: 'lesson_completed',
      });

      const response = await request(app)
        .get('/api/achievements/my')
        .set(authHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});

