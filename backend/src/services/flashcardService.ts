import Flashcard from '../models/Flashcard';
import FlashcardDeck from '../models/FlashcardDeck';
import { reviewFlashcard, getCardsDueForReview, getNewCards } from './spacedRepetitionService';
import { awardXP } from './xpService';
import logger from '../utils/logger';

/**
 * Create a new flashcard deck
 */
export const createDeck = async (
  userId: string,
  data: {
    title: string;
    description?: string;
    color?: string;
    icon?: string;
    tags?: string[];
    category?: string;
    courseId?: string;
    lessonId?: string;
    isPublic?: boolean;
    newCardsPerDay?: number;
    reviewCardsPerDay?: number;
  }
): Promise<any> => {
  try {
    const deck = await FlashcardDeck.create({
      user: userId,
      title: data.title,
      description: data.description,
      color: data.color,
      icon: data.icon,
      tags: data.tags,
      category: data.category,
      course: data.courseId,
      lesson: data.lessonId,
      isPublic: data.isPublic || false,
      newCardsPerDay: data.newCardsPerDay || 20,
      reviewCardsPerDay: data.reviewCardsPerDay || 100,
    });

    logger.info(`Created flashcard deck ${deck._id} for user ${userId}`);
    return deck;
  } catch (error) {
    logger.error('Error creating flashcard deck:', error);
    throw error;
  }
};

/**
 * Update flashcard deck
 */
export const updateDeck = async (
  deckId: string,
  userId: string,
  data: Partial<{
    title: string;
    description: string;
    color: string;
    icon: string;
    tags: string[];
    category: string;
    isPublic: boolean;
    newCardsPerDay: number;
    reviewCardsPerDay: number;
  }>
): Promise<any> => {
  try {
    const deck = await FlashcardDeck.findOne({
      _id: deckId,
      user: userId,
    });

    if (!deck) {
      throw new Error('Deck not found');
    }

    Object.assign(deck, data);
    await deck.save();

    logger.info(`Updated flashcard deck ${deckId}`);
    return deck;
  } catch (error) {
    logger.error('Error updating flashcard deck:', error);
    throw error;
  }
};

/**
 * Delete flashcard deck
 */
export const deleteDeck = async (deckId: string, userId: string): Promise<void> => {
  try {
    const deck = await FlashcardDeck.findOne({
      _id: deckId,
      user: userId,
    });

    if (!deck) {
      throw new Error('Deck not found');
    }

    // Delete all cards in the deck
    await Flashcard.deleteMany({ deck: deckId });

    // Delete the deck
    await FlashcardDeck.findByIdAndDelete(deckId);

    logger.info(`Deleted flashcard deck ${deckId}`);
  } catch (error) {
    logger.error('Error deleting flashcard deck:', error);
    throw error;
  }
};

/**
 * Create a new flashcard
 */
export const createFlashcard = async (
  userId: string,
  deckId: string,
  data: {
    front: string;
    back: string;
    hint?: string;
    frontImage?: string;
    backImage?: string;
    frontAudio?: string;
    backAudio?: string;
    tags?: string[];
    courseId?: string;
    lessonId?: string;
  }
): Promise<any> => {
  try {
    // Verify deck belongs to user
    const deck = await FlashcardDeck.findOne({
      _id: deckId,
      user: userId,
    });

    if (!deck) {
      throw new Error('Deck not found');
    }

    // Check for duplicates if not allowed
    if (!deck.allowDuplicates) {
      const existing = await Flashcard.findOne({
        user: userId,
        deck: deckId,
        front: data.front,
        back: data.back,
      });

      if (existing) {
        throw new Error('Duplicate flashcard already exists');
      }
    }

    const flashcard = await Flashcard.create({
      user: userId,
      deck: deckId,
      front: data.front,
      back: data.back,
      hint: data.hint,
      frontImage: data.frontImage,
      backImage: data.backImage,
      frontAudio: data.frontAudio,
      backAudio: data.backAudio,
      tags: data.tags,
      course: data.courseId,
      lesson: data.lessonId,
    });

    // Update deck statistics
    deck.totalCards += 1;
    deck.activeCards += 1;
    await deck.save();

    // Award XP for creating flashcard
    await awardXP({
      userId,
      amount: 5,
      source: 'flashcard_created',
      sourceId: flashcard._id.toString(),
      description: 'Created a flashcard',
    }).catch((error) => {
      logger.error('Error awarding XP for flashcard creation:', error);
    });

    logger.info(`Created flashcard ${flashcard._id} in deck ${deckId}`);
    return flashcard;
  } catch (error) {
    logger.error('Error creating flashcard:', error);
    throw error;
  }
};

/**
 * Update flashcard
 */
export const updateFlashcard = async (
  flashcardId: string,
  userId: string,
  data: Partial<{
    front: string;
    back: string;
    hint: string;
    frontImage: string;
    backImage: string;
    frontAudio: string;
    backAudio: string;
    tags: string[];
  }>
): Promise<any> => {
  try {
    const flashcard = await Flashcard.findOne({
      _id: flashcardId,
      user: userId,
    });

    if (!flashcard) {
      throw new Error('Flashcard not found');
    }

    Object.assign(flashcard, data);
    await flashcard.save();

    logger.info(`Updated flashcard ${flashcardId}`);
    return flashcard;
  } catch (error) {
    logger.error('Error updating flashcard:', error);
    throw error;
  }
};

/**
 * Delete flashcard
 */
export const deleteFlashcard = async (flashcardId: string, userId: string): Promise<void> => {
  try {
    const flashcard = await Flashcard.findOne({
      _id: flashcardId,
      user: userId,
    });

    if (!flashcard) {
      throw new Error('Flashcard not found');
    }

    const deckId = flashcard.deck;

    // Delete the flashcard
    await Flashcard.findByIdAndDelete(flashcardId);

    // Update deck statistics
    const deck = await FlashcardDeck.findById(deckId);
    if (deck) {
      deck.totalCards = Math.max(0, deck.totalCards - 1);
      if (flashcard.isActive) {
        deck.activeCards = Math.max(0, deck.activeCards - 1);
      }
      await deck.save();
    }

    logger.info(`Deleted flashcard ${flashcardId}`);
  } catch (error) {
    logger.error('Error deleting flashcard:', error);
    throw error;
  }
};

/**
 * Review a flashcard
 */
export const reviewFlashcardCard = async (
  flashcardId: string,
  userId: string,
  quality: number,
  timeSpent: number = 0
): Promise<any> => {
  try {
    await reviewFlashcard(flashcardId, userId, quality, timeSpent);

    // Award XP for reviewing flashcard
    await awardXP({
      userId,
      amount: 2,
      source: 'flashcard_reviewed',
      sourceId: flashcardId,
      description: 'Reviewed a flashcard',
    }).catch((error) => {
      logger.error('Error awarding XP for flashcard review:', error);
    });

    // Update deck statistics
    const flashcard = await Flashcard.findById(flashcardId);
    if (flashcard) {
      const deck = await FlashcardDeck.findById(flashcard.deck);
      if (deck) {
        deck.lastStudied = new Date();
        await deck.save();
      }
    }

    return flashcard;
  } catch (error) {
    logger.error('Error reviewing flashcard:', error);
    throw error;
  }
};

/**
 * Get study session cards (mix of new and due cards)
 */
export const getStudySessionCards = async (
  userId: string,
  deckId?: string,
  newCardsLimit: number = 10,
  reviewCardsLimit: number = 20
): Promise<{
  newCards: any[];
  reviewCards: any[];
  totalDue: number;
  totalNew: number;
}> => {
  try {
    const newCards = await getNewCards(userId, deckId, newCardsLimit);
    const reviewCards = await getCardsDueForReview(userId, deckId, reviewCardsLimit);

    // Get total counts
    const newCardsQuery: any = {
      user: userId,
      isActive: true,
      isArchived: false,
      repetitions: 0,
      interval: 0,
    };
    if (deckId) {
      newCardsQuery.deck = deckId;
    }

    const reviewCardsQuery: any = {
      user: userId,
      isActive: true,
      isArchived: false,
      nextReviewDate: { $lte: new Date() },
    };
    if (deckId) {
      reviewCardsQuery.deck = deckId;
    }

    const totalNew = await Flashcard.countDocuments(newCardsQuery);
    const totalDue = await Flashcard.countDocuments(reviewCardsQuery);

    return {
      newCards,
      reviewCards,
      totalDue,
      totalNew,
    };
  } catch (error) {
    logger.error('Error getting study session cards:', error);
    throw error;
  }
};

/**
 * Update deck statistics
 */
export const updateDeckStatistics = async (deckId: string): Promise<void> => {
  try {
    const deck = await FlashcardDeck.findById(deckId);
    if (!deck) {
      return;
    }

    const cards = await Flashcard.find({ deck: deckId });
    
    deck.totalCards = cards.length;
    deck.activeCards = cards.filter(c => c.isActive && !c.isArchived).length;
    deck.cardsDue = cards.filter(c => 
      c.isActive && 
      !c.isArchived && 
      c.nextReviewDate <= new Date()
    ).length;

    // Calculate average ease factor
    const activeCards = cards.filter(c => c.isActive && !c.isArchived);
    if (activeCards.length > 0) {
      const totalEaseFactor = activeCards.reduce((sum, c) => sum + c.easeFactor, 0);
      deck.averageEaseFactor = totalEaseFactor / activeCards.length;
    }

    await deck.save();
  } catch (error) {
    logger.error('Error updating deck statistics:', error);
  }
};

