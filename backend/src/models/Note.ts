import mongoose, { Document, Schema } from 'mongoose';

export interface INote extends Document {
  user: mongoose.Types.ObjectId;
  lesson: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  
  // Note content
  title?: string;
  content: string;
  
  // Highlight/annotation
  isHighlight: boolean;
  highlightedText?: string;
  highlightStart?: number; // Character position start
  highlightEnd?: number; // Character position end
  highlightColor?: string; // Hex color code
  
  // Position in lesson
  position?: {
    section?: string; // Section identifier in lesson
    timestamp?: number; // For video lessons, timestamp in seconds
    paragraphIndex?: number; // For text lessons
  };
  
  // Tags and organization
  tags: string[];
  isPinned: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INote>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lesson: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    title: String,
    content: {
      type: String,
      required: [true, 'Note content is required'],
    },
    isHighlight: {
      type: Boolean,
      default: false,
    },
    highlightedText: String,
    highlightStart: Number,
    highlightEnd: Number,
    highlightColor: {
      type: String,
      default: '#FFEB3B', // Default yellow highlight
    },
    position: {
      section: String,
      timestamp: Number,
      paragraphIndex: Number,
    },
    tags: [String],
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

noteSchema.index({ user: 1, lesson: 1 });
noteSchema.index({ user: 1, course: 1 });
noteSchema.index({ user: 1, isPinned: -1, createdAt: -1 });
noteSchema.index({ user: 1, tags: 1 });

export default mongoose.model<INote>('Note', noteSchema);

