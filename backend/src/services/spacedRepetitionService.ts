import Flashcard from '../models/Flashcard';
import FlashcardReview from '../models/FlashcardReview';
import logger from '../utils/logger';

/**
 * SM-2 Algorithm for spaced repetition
 * Based on SuperMemo 2 algorithm
 * 
 * @param quality - Quality of recall (0-5)
 * @param easeFactor - Current ease factor
 * @param interval - Current interval in days
 * @param repetitions - Current number of repetitions
 * @returns Object with new ease factor, interval, and repetitions
 */
export const calculateNextReview = (
  quality: number,
  easeFactor: number,
  interval: number,
  repetitions: number
): {
  newEaseFactor: number;
  newInterval: number;
  newRepetitions: number;
} => {
  // Quality must be between 0 and 5
  const q = Math.max(0, Math.min(5, quality));

  // Calculate new ease factor
  let newEaseFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  
  // Minimum ease factor is 1.3
  newEaseFactor = Math.max(1.3, newEaseFactor);

  let newInterval: number;
  let newRepetitions: number;

  if (q < 3) {
    // If quality is less than 3, reset repetitions and interval
    newRepetitions = 0;
    newInterval = 0;
  } else {
    // If quality is 3 or higher, increase repetitions
    newRepetitions = repetitions + 1;

    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEaseFactor);
    }
  }

  return {
    newEaseFactor,
    newInterval,
    newRepetitions,
  };
};

/**
 * Review a flashcard and update its spaced repetition data
 */
export const reviewFlashcard = async (
  flashcardId: string,
  userId: string,
  quality: number,
  timeSpent: number = 0
): Promise<void> => {
  try {
    const flashcard = await Flashcard.findOne({
      _id: flashcardId,
      user: userId,
      isActive: true,
      isArchived: false,
    });

    if (!flashcard) {
      throw new Error('Flashcard not found');
    }

    // Store previous state
    const previousEaseFactor = flashcard.easeFactor;
    const previousInterval = flashcard.interval;
    const previousRepetitions = flashcard.repetitions;

    // Calculate new values using SM-2 algorithm
    const { newEaseFactor, newInterval, newRepetitions } = calculateNextReview(
      quality,
      flashcard.easeFactor,
      flashcard.interval,
      flashcard.repetitions
    );

    // Calculate next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

    // Update flashcard
    flashcard.easeFactor = newEaseFactor;
    flashcard.interval = newInterval;
    flashcard.repetitions = newRepetitions;
    flashcard.nextReviewDate = nextReviewDate;
    flashcard.totalReviews += 1;
    flashcard.lastReviewDate = new Date();
    flashcard.lastReviewResult = quality >= 3 ? 'correct' : 'incorrect';

    if (quality >= 3) {
      flashcard.correctReviews += 1;
    } else {
      flashcard.incorrectReviews += 1;
    }

    await flashcard.save();

    // Create review record
    await FlashcardReview.create({
      user: userId,
      flashcard: flashcardId,
      deck: flashcard.deck,
      quality,
      timeSpent,
      reviewDate: new Date(),
      previousEaseFactor,
      previousInterval,
      previousRepetitions,
      newEaseFactor,
      newInterval,
      newRepetitions,
      nextReviewDate,
    });

    logger.info(`Flashcard ${flashcardId} reviewed with quality ${quality}`);
  } catch (error) {
    logger.error('Error reviewing flashcard:', error);
    throw error;
  }
};

/**
 * Get cards due for review
 */
export const getCardsDueForReview = async (
  userId: string,
  deckId?: string,
  limit: number = 20
): Promise<any[]> => {
  try {
    const query: any = {
      user: userId,
      isActive: true,
      isArchived: false,
      nextReviewDate: { $lte: new Date() },
    };

    if (deckId) {
      query.deck = deckId;
    }

    const cards = await Flashcard.find(query)
      .sort({ nextReviewDate: 1 })
      .limit(limit)
      .populate('deck', 'title')
      .populate('course', 'title')
      .populate('lesson', 'title');

    return cards;
  } catch (error) {
    logger.error('Error getting cards due for review:', error);
    throw error;
  }
};

/**
 * Get new cards to learn (cards that haven't been reviewed yet)
 */
export const getNewCards = async (
  userId: string,
  deckId?: string,
  limit: number = 20
): Promise<any[]> => {
  try {
    const query: any = {
      user: userId,
      isActive: true,
      isArchived: false,
      repetitions: 0,
      interval: 0,
    };

    if (deckId) {
      query.deck = deckId;
    }

    const cards = await Flashcard.find(query)
      .sort({ createdAt: 1 })
      .limit(limit)
      .populate('deck', 'title')
      .populate('course', 'title')
      .populate('lesson', 'title');

    return cards;
  } catch (error) {
    logger.error('Error getting new cards:', error);
    throw error;
  }
};

