import request from 'supertest';
import app from '../../server';
import { createTestUser, getAuthHeaders, cleanDatabase } from '../helpers/testHelpers';
import Conversation from '../../models/Conversation';
import Message from '../../models/Message';
import { decrypt } from '../../utils/encryption';

describe('Direct Messaging', () => {
  let user1: any;
  let user2: any;
  let user1Headers: any;
  let user2Headers: any;

  beforeEach(async () => {
    await cleanDatabase();
    user1 = await createTestUser({ username: 'user1', email: 'user1@test.com' });
    user2 = await createTestUser({ username: 'user2', email: 'user2@test.com' });
    user1Headers = getAuthHeaders(user1._id.toString());
    user2Headers = getAuthHeaders(user2._id.toString());
  });

  describe('Message Encryption', () => {
    it('should encrypt messages before storing', async () => {
      // Create conversation
      const conversation = await Conversation.create({
        participants: [user1._id, user2._id],
      });

      // Send message via API
      const messageContent = 'This is a secret message';
      const response = await request(app)
        .post(`/api/messages/conversations/${conversation._id}/messages`)
        .set(user1Headers)
        .send({ content: messageContent })
        .expect(201);

      // Check that message is encrypted in database
      const message = await Message.findById(response.body.message._id);
      expect(message?.contentEncrypted).toBe(true);
      expect(message?.content).not.toBe(messageContent);
      
      // Verify it can be decrypted
      const decrypted = decrypt(message!.content);
      expect(decrypted).toBe(messageContent);
    });

    it('should decrypt messages when retrieving', async () => {
      const conversation = await Conversation.create({
        participants: [user1._id, user2._id],
      });

      const messageContent = 'Test message';
      const { encrypt } = await import('../../utils/encryption');
      const encryptedContent = encrypt(messageContent);

      const message = await Message.create({
        conversation: conversation._id,
        sender: user1._id,
        content: encryptedContent,
        contentEncrypted: true,
      });

      // Retrieve messages
      const response = await request(app)
        .get(`/api/messages/conversations/${conversation._id}/messages`)
        .set(user1Headers)
        .expect(200);

      expect(response.body.messages).toHaveLength(1);
      expect(response.body.messages[0].content).toBe(messageContent);
      expect(response.body.messages[0].contentEncrypted).toBe(true);
    });
  });

  describe('GET /api/messages/conversations', () => {
    it('should get user conversations', async () => {
      await Conversation.create({
        participants: [user1._id, user2._id],
      });

      const response = await request(app)
        .get('/api/messages/conversations')
        .set(user1Headers)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.conversations.length).toBeGreaterThan(0);
    });
  });
});

