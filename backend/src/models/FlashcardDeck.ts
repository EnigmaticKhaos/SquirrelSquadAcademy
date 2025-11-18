import mongoose, { Document, Schema } from 'mongoose';

export interface IFlashcardDeck extends Document {
  user: mongoose.Types.ObjectId;
  
  // Deck information
  title: string;
  description?: string;
  color?: string; // Hex color for UI customization
  icon?: string; // Icon identifier for UI
  
  // Organization
  tags?: string[];
  category?: string;
  
  // Related content (optional)
  course?: mongoose.Types.ObjectId;
  lesson?: mongoose.Types.ObjectId;
  
  // Settings
  isPublic: boolean; // Whether deck can be shared/copied by others
  allowDuplicates: boolean; // Whether to allow duplicate cards
  
  // Statistics
  totalCards: number; // Total number of cards in deck
  activeCards: number; // Number of active cards
  cardsDue: number; // Number of cards due for review
  averageEaseFactor: number; // Average ease factor of cards
  lastStudied?: Date; // Last time deck was studied
  
  // Study settings
  newCardsPerDay: number; // Maximum new cards to introduce per day
  reviewCardsPerDay: number; // Maximum review cards per day
  
  // Status
  isArchived: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const flashcardDeckSchema = new Schema<IFlashcardDeck>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Deck title is required'],
      trim: true,
    },
    description: String,
    color: String,
    icon: String,
    tags: [String],
    category: String,
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
    },
    lesson: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    allowDuplicates: {
      type: Boolean,
      default: false,
    },
    totalCards: {
      type: Number,
      default: 0,
      min: 0,
    },
    activeCards: {
      type: Number,
      default: 0,
      min: 0,
    },
    cardsDue: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageEaseFactor: {
      type: Number,
      default: 2.5,
    },
    lastStudied: Date,
    newCardsPerDay: {
      type: Number,
      default: 20,
      min: 1,
    },
    reviewCardsPerDay: {
      type: Number,
      default: 100,
      min: 1,
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

flashcardDeckSchema.index({ user: 1, isArchived: 1 });
flashcardDeckSchema.index({ user: 1, course: 1 });
flashcardDeckSchema.index({ isPublic: 1 });

export default mongoose.model<IFlashcardDeck>('FlashcardDeck', flashcardDeckSchema);

