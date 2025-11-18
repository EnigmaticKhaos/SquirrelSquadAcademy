import express from 'express';
import { protect } from '../middleware/auth';
import {
  createApiKeyHandler,
  getUserApiKeysHandler,
  deleteApiKeyHandler,
  revokeApiKeyHandler,
} from '../controllers/apiKeyController';

const router = express.Router();

router.use(protect);

router.post('/', createApiKeyHandler);
router.get('/', getUserApiKeysHandler);
router.delete('/:id', deleteApiKeyHandler);
router.post('/:id/revoke', revokeApiKeyHandler);

export default router;

