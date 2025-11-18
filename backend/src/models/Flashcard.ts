import mongoose, { Document, Schema } from 'mongoose';

export interface IFlashcard extends Document {
  user: mongoose.Types.ObjectId;
  deck: mongoose.Types.ObjectId;
  
  // Card content
  front: string; // Question or term
  back: string; // Answer or definition
  hint?: string; // Optional hint
  
  // Media support
  frontImage?: string; // Image URL for front
  backImage?: string; // Image URL for back
  frontAudio?: string; // Audio URL for front
  backAudio?: string; // Audio URL for back
  
  // Tags for organization
  tags?: string[];
  
  // Related content (optional)
  course?: mongoose.Types.ObjectId;
  lesson?: mongoose.Types.ObjectId;
  
  // Spaced repetition data (SM-2 algorithm)
  easeFactor: number; // Ease factor (default 2.5)
  interval: number; // Days until next review (default 0)
  repetitions: number; // Number of successful reviews (default 0)
  nextReviewDate: Date; // When to review next
  
  // Statistics
  totalReviews: number; // Total number of reviews
  correctReviews: number; // Number of correct reviews
  incorrectReviews: number; // Number of incorrect reviews
  lastReviewDate?: Date; // Last time card was reviewed
  lastReviewResult?: 'correct' | 'incorrect'; // Result of last review
  
  // Status
  isActive: boolean; // Whether card is active
  isArchived: boolean; // Whether card is archived
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const flashcardSchema = new Schema<IFlashcard>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    deck: {
      type: Schema.Types.ObjectId,
      ref: 'FlashcardDeck',
      required: true,
      index: true,
    },
    front: {
      type: String,
      required: [true, 'Flashcard front is required'],
      trim: true,
    },
    back: {
      type: String,
      required: [true, 'Flashcard back is required'],
      trim: true,
    },
    hint: String,
    frontImage: String,
    backImage: String,
    frontAudio: String,
    backAudio: String,
    tags: [String],
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
    },
    lesson: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
    },
    easeFactor: {
      type: Number,
      default: 2.5,
      min: 1.3,
    },
    interval: {
      type: Number,
      default: 0,
      min: 0,
    },
    repetitions: {
      type: Number,
      default: 0,
      min: 0,
    },
    nextReviewDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    correctReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    incorrectReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastReviewDate: Date,
    lastReviewResult: {
      type: String,
      enum: ['correct', 'incorrect'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

flashcardSchema.index({ user: 1, deck: 1 });
flashcardSchema.index({ user: 1, nextReviewDate: 1 });
flashcardSchema.index({ user: 1, isActive: 1, isArchived: 1 });
flashcardSchema.index({ course: 1, lesson: 1 });

export default mongoose.model<IFlashcard>('Flashcard', flashcardSchema);

