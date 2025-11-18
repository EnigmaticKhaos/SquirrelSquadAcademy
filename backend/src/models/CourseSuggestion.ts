import mongoose, { Document, Schema } from 'mongoose';

export type SuggestionStatus = 'pending' | 'approved' | 'denied';

export interface ICourseSuggestion extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  description: string;
  desiredContent: string;
  
  // Voting
  votes: Array<{
    user: mongoose.Types.ObjectId;
    createdAt: Date;
  }>;
  voteCount: number;
  
  // Admin review
  status: SuggestionStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  
  // If approved and course created
  generatedCourse?: mongoose.Types.ObjectId;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const courseSuggestionSchema = new Schema<ICourseSuggestion>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Suggestion title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Suggestion description is required'],
    },
    desiredContent: String,
    votes: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
    voteCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'denied'],
      default: 'pending',
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: Date,
    reviewNotes: String,
    generatedCourse: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
    },
  },
  {
    timestamps: true,
  }
);

courseSuggestionSchema.index({ status: 1, createdAt: -1 });
courseSuggestionSchema.index({ user: 1 });
courseSuggestionSchema.index({ voteCount: -1 });

// Update vote count before saving
courseSuggestionSchema.pre('save', function (next) {
  if (this.isModified('votes')) {
    this.voteCount = this.votes.length;
  }
  next();
});

export default mongoose.model<ICourseSuggestion>('CourseSuggestion', courseSuggestionSchema);

