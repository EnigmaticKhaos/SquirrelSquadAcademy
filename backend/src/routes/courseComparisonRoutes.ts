import express from 'express';
import { compare, getSummary } from '../controllers/courseComparisonController';

const router = express.Router();

// Public routes
router.post('/', compare);
router.post('/summary', getSummary);

export default router;

