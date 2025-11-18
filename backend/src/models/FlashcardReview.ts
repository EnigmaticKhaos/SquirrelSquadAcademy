import mongoose, { Document, Schema } from 'mongoose';

export interface IFlashcardReview extends Document {
  user: mongoose.Types.ObjectId;
  flashcard: mongoose.Types.ObjectId;
  deck: mongoose.Types.ObjectId;
  
  // Review result
  quality: number; // 0-5 (SM-2 algorithm quality rating)
  // 0: Complete blackout
  // 1: Incorrect response, but remembered after seeing the answer
  // 2: Incorrect response, but correct one seemed easy to recall
  // 3: Correct response, but with serious difficulty
  // 4: Correct response, but with hesitation
  // 5: Perfect response
  
  // Review metadata
  timeSpent: number; // Time spent on review in seconds
  reviewDate: Date; // When the review was performed
  
  // Previous state (for tracking changes)
  previousEaseFactor: number;
  previousInterval: number;
  previousRepetitions: number;
  
  // New state (after review)
  newEaseFactor: number;
  newInterval: number;
  newRepetitions: number;
  nextReviewDate: Date;
  
  // Timestamps
  createdAt: Date;
}

const flashcardReviewSchema = new Schema<IFlashcardReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    flashcard: {
      type: Schema.Types.ObjectId,
      ref: 'Flashcard',
      required: true,
      index: true,
    },
    deck: {
      type: Schema.Types.ObjectId,
      ref: 'FlashcardDeck',
      required: true,
      index: true,
    },
    quality: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
    },
    timeSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    reviewDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    previousEaseFactor: Number,
    previousInterval: Number,
    previousRepetitions: Number,
    newEaseFactor: Number,
    newInterval: Number,
    newRepetitions: Number,
    nextReviewDate: Date,
  },
  {
    timestamps: true,
  }
);

flashcardReviewSchema.index({ user: 1, reviewDate: -1 });
flashcardReviewSchema.index({ flashcard: 1, reviewDate: -1 });
flashcardReviewSchema.index({ deck: 1, reviewDate: -1 });

export default mongoose.model<IFlashcardReview>('FlashcardReview', flashcardReviewSchema);

