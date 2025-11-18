import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import {
  createDeck,
  updateDeck,
  deleteDeck,
  createFlashcard,
  updateFlashcard,
  deleteFlashcard,
  reviewFlashcardCard,
  getStudySessionCards,
  updateDeckStatistics,
} from '../services/flashcardService';
import FlashcardDeck from '../models/FlashcardDeck';
import Flashcard from '../models/Flashcard';
import FlashcardReview from '../models/FlashcardReview';

// @desc    Get all decks for user
// @route   GET /api/flashcards/decks
// @access  Private
export const getDecks = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { archived, courseId } = req.query;

  const query: any = { user: userId };
  if (archived !== undefined) {
    query.isArchived = archived === 'true';
  }
  if (courseId) {
    query.course = courseId;
  }

  const decks = await FlashcardDeck.find(query)
    .sort({ updatedAt: -1 })
    .populate('course', 'title')
    .populate('lesson', 'title');

  res.json({
    success: true,
    decks,
  });
});

// @desc    Get single deck
// @route   GET /api/flashcards/decks/:id
// @access  Private
export const getDeck = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { id } = req.params;

  const deck = await FlashcardDeck.findOne({
    _id: id,
    user: userId,
  })
    .populate('course', 'title')
    .populate('lesson', 'title');

  if (!deck) {
    return res.status(404).json({
      success: false,
      message: 'Deck not found',
    });
  }

  // Update statistics
  await updateDeckStatistics(id);

  res.json({
    success: true,
    deck,
  });
});

// @desc    Create new deck
// @route   POST /api/flashcards/decks
// @access  Private
export const createDeckHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const {
    title,
    description,
    color,
    icon,
    tags,
    category,
    courseId,
    lessonId,
    isPublic,
    newCardsPerDay,
    reviewCardsPerDay,
  } = req.body;

  if (!title) {
    return res.status(400).json({
      success: false,
      message: 'Deck title is required',
    });
  }

  const deck = await createDeck(userId, {
    title,
    description,
    color,
    icon,
    tags,
    category,
    courseId,
    lessonId,
    isPublic,
    newCardsPerDay,
    reviewCardsPerDay,
  });

  res.status(201).json({
    success: true,
    deck,
  });
});

// @desc    Update deck
// @route   PUT /api/flashcards/decks/:id
// @access  Private
export const updateDeckHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { id } = req.params;

  const deck = await updateDeck(id, userId, req.body);

  res.json({
    success: true,
    deck,
  });
});

// @desc    Delete deck
// @route   DELETE /api/flashcards/decks/:id
// @access  Private
export const deleteDeckHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { id } = req.params;

  await deleteDeck(id, userId);

  res.json({
    success: true,
    message: 'Deck deleted successfully',
  });
});

// @desc    Get flashcards in deck
// @route   GET /api/flashcards/decks/:id/cards
// @access  Private
export const getDeckCards = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { id } = req.params;
  const { archived, active } = req.query;

  // Verify deck belongs to user
  const deck = await FlashcardDeck.findOne({
    _id: id,
    user: userId,
  });

  if (!deck) {
    return res.status(404).json({
      success: false,
      message: 'Deck not found',
    });
  }

  const query: any = {
    user: userId,
    deck: id,
  };

  if (archived !== undefined) {
    query.isArchived = archived === 'true';
  }
  if (active !== undefined) {
    query.isActive = active === 'true';
  }

  const cards = await Flashcard.find(query)
    .sort({ createdAt: -1 })
    .populate('course', 'title')
    .populate('lesson', 'title');

  res.json({
    success: true,
    cards,
  });
});

// @desc    Create flashcard
// @route   POST /api/flashcards/decks/:id/cards
// @access  Private
export const createFlashcardHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { id } = req.params;
  const {
    front,
    back,
    hint,
    frontImage,
    backImage,
    frontAudio,
    backAudio,
    tags,
    courseId,
    lessonId,
  } = req.body;

  if (!front || !back) {
    return res.status(400).json({
      success: false,
      message: 'Front and back are required',
    });
  }

  const flashcard = await createFlashcard(userId, id, {
    front,
    back,
    hint,
    frontImage,
    backImage,
    frontAudio,
    backAudio,
    tags,
    courseId,
    lessonId,
  });

  res.status(201).json({
    success: true,
    flashcard,
  });
});

// @desc    Get single flashcard
// @route   GET /api/flashcards/cards/:id
// @access  Private
export const getFlashcard = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { id } = req.params;

  const flashcard = await Flashcard.findOne({
    _id: id,
    user: userId,
  })
    .populate('deck', 'title')
    .populate('course', 'title')
    .populate('lesson', 'title');

  if (!flashcard) {
    return res.status(404).json({
      success: false,
      message: 'Flashcard not found',
    });
  }

  res.json({
    success: true,
    flashcard,
  });
});

// @desc    Update flashcard
// @route   PUT /api/flashcards/cards/:id
// @access  Private
export const updateFlashcardHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { id } = req.params;

  const flashcard = await updateFlashcard(id, userId, req.body);

  res.json({
    success: true,
    flashcard,
  });
});

// @desc    Delete flashcard
// @route   DELETE /api/flashcards/cards/:id
// @access  Private
export const deleteFlashcardHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { id } = req.params;

  await deleteFlashcard(id, userId);

  res.json({
    success: true,
    message: 'Flashcard deleted successfully',
  });
});

// @desc    Review flashcard
// @route   POST /api/flashcards/cards/:id/review
// @access  Private
export const reviewFlashcardHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { id } = req.params;
  const { quality, timeSpent } = req.body;

  if (quality === undefined || quality < 0 || quality > 5) {
    return res.status(400).json({
      success: false,
      message: 'Quality must be a number between 0 and 5',
    });
  }

  const flashcard = await reviewFlashcardCard(id, userId, quality, timeSpent || 0);

  res.json({
    success: true,
    flashcard,
    message: 'Flashcard reviewed successfully',
  });
});

// @desc    Get study session cards
// @route   GET /api/flashcards/study
// @access  Private
export const getStudySession = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { deckId, newCardsLimit, reviewCardsLimit } = req.query;

  const session = await getStudySessionCards(
    userId,
    deckId as string,
    newCardsLimit ? parseInt(newCardsLimit as string) : 10,
    reviewCardsLimit ? parseInt(reviewCardsLimit as string) : 20
  );

  res.json({
    success: true,
    ...session,
  });
});

// @desc    Get review history for flashcard
// @route   GET /api/flashcards/cards/:id/reviews
// @access  Private
export const getFlashcardReviews = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { id } = req.params;
  const { limit } = req.query;

  // Verify flashcard belongs to user
  const flashcard = await Flashcard.findOne({
    _id: id,
    user: userId,
  });

  if (!flashcard) {
    return res.status(404).json({
      success: false,
      message: 'Flashcard not found',
    });
  }

  const reviews = await FlashcardReview.find({
    user: userId,
    flashcard: id,
  })
    .sort({ reviewDate: -1 })
    .limit(limit ? parseInt(limit as string) : 50);

  res.json({
    success: true,
    reviews,
  });
});

// @desc    Archive/unarchive flashcard
// @route   PATCH /api/flashcards/cards/:id/archive
// @access  Private
export const archiveFlashcard = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { id } = req.params;
  const { isArchived } = req.body;

  const flashcard = await Flashcard.findOne({
    _id: id,
    user: userId,
  });

  if (!flashcard) {
    return res.status(404).json({
      success: false,
      message: 'Flashcard not found',
    });
  }

  flashcard.isArchived = isArchived !== undefined ? isArchived : !flashcard.isArchived;
  await flashcard.save();

  // Update deck statistics
  await updateDeckStatistics(flashcard.deck.toString());

  res.json({
    success: true,
    flashcard,
  });
});

// @desc    Archive/unarchive deck
// @route   PATCH /api/flashcards/decks/:id/archive
// @access  Private
export const archiveDeck = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id.toString();
  const { id } = req.params;
  const { isArchived } = req.body;

  const deck = await FlashcardDeck.findOne({
    _id: id,
    user: userId,
  });

  if (!deck) {
    return res.status(404).json({
      success: false,
      message: 'Deck not found',
    });
  }

  deck.isArchived = isArchived !== undefined ? isArchived : !deck.isArchived;
  await deck.save();

  res.json({
    success: true,
    deck,
  });
});

