import express from 'express';
import { protect } from '../middleware/auth';
import {
  getDecks,
  getDeck,
  createDeckHandler,
  updateDeckHandler,
  deleteDeckHandler,
  getDeckCards,
  createFlashcardHandler,
  getFlashcard,
  updateFlashcardHandler,
  deleteFlashcardHandler,
  reviewFlashcardHandler,
  getStudySession,
  getFlashcardReviews,
  archiveFlashcard,
  archiveDeck,
} from '../controllers/flashcardController';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Study session
router.get('/study', getStudySession);

// Decks
router.get('/decks', getDecks);
router.post('/decks', createDeckHandler);
router.get('/decks/:id', getDeck);
router.put('/decks/:id', updateDeckHandler);
router.delete('/decks/:id', deleteDeckHandler);
router.patch('/decks/:id/archive', archiveDeck);

// Deck cards
router.get('/decks/:id/cards', getDeckCards);
router.post('/decks/:id/cards', createFlashcardHandler);

// Cards
router.get('/cards/:id', getFlashcard);
router.put('/cards/:id', updateFlashcardHandler);
router.delete('/cards/:id', deleteFlashcardHandler);
router.post('/cards/:id/review', reviewFlashcardHandler);
router.get('/cards/:id/reviews', getFlashcardReviews);
router.patch('/cards/:id/archive', archiveFlashcard);

export default router;

