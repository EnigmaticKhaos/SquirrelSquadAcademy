import express from 'express';
import { protect } from '../middleware/auth';
import {
  exportUserDataHandler,
  getExportStatus,
  getExportHistory,
  requestAccountDeletionHandler,
  cancelAccountDeletionHandler,
  deleteAccountHandler,
  saveCookieConsentHandler,
  getCookieConsent,
  acceptPrivacyPolicyHandler,
  updateDataProcessingConsentHandler,
  updateMarketingConsentHandler,
  getPrivacySettings,
} from '../controllers/dataPrivacyController';

const router = express.Router();

// Cookie consent (public - can be used by anonymous users)
router.post('/cookie-consent', saveCookieConsentHandler);
router.get('/cookie-consent', getCookieConsent);

// All other routes require authentication
router.use(protect);

// Data export
router.post('/export', exportUserDataHandler);
router.get('/exports', getExportHistory);
router.get('/export/:id', getExportStatus);

// Account deletion
router.post('/account/deletion-request', requestAccountDeletionHandler);
router.post('/account/cancel-deletion', cancelAccountDeletionHandler);
router.delete('/account', deleteAccountHandler);

// Privacy policy and consents
router.post('/privacy-policy/accept', acceptPrivacyPolicyHandler);
router.put('/data-processing-consent', updateDataProcessingConsentHandler);
router.put('/marketing-consent', updateMarketingConsentHandler);

// Privacy settings
router.get('/settings', getPrivacySettings);

export default router;

