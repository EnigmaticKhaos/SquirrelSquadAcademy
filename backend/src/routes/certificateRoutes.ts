import express from 'express';
import {
  createCertificate,
  getCertificates,
  getCertificateById,
  verifyCertificatePublic,
  downloadCertificate,
} from '../controllers/certificateController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Public route
router.get('/verify/:certificateId', verifyCertificatePublic);

// Protected routes
router.use(protect);

router.post('/from-completion/:completionId', createCertificate);
router.get('/', getCertificates);
router.get('/:certificateId', getCertificateById);
router.get('/:certificateId/download', downloadCertificate);

export default router;

