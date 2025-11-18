import mongoose, { Document, Schema } from 'mongoose';

export type VideoSource = 'upload' | 'youtube';

export interface ILesson extends Document {
  module: mongoose.Types.ObjectId;
  title: string;
  content: string; // Rich text content
  order: number;
  
  // Video
  hasVideo: boolean;
  videoSource?: VideoSource;
  videoUrl?: string; // Cloudinary URL or YouTube URL
  videoId?: string; // YouTube video ID (extracted from URL)
  videoDuration?: number; // in seconds
  videoThumbnail?: string; // Video thumbnail URL
  videoTranscript?: string;
  videoCaptions?: Array<{
    language: string;
    url: string;
    format: 'vtt' | 'srt';
  }>;
  
  // Video settings
  allowDownload: boolean;
  playbackSpeedOptions?: number[]; // e.g., [0.5, 0.75, 1, 1.25, 1.5, 2]
  
  // Interactive elements
  hasInteractiveQuiz: boolean;
  interactiveQuizData?: Array<{
    timestamp: number; // in seconds
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
  }>;
  
  // Resources
  resources: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  
  // Assignments/Quizzes/Exercises
  assignments: mongoose.Types.ObjectId[];
  quizzes: mongoose.Types.ObjectId[];
  exercises: mongoose.Types.ObjectId[];
  
  // Prerequisites
  prerequisites?: mongoose.Types.ObjectId[];
  isUnlocked: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const lessonSchema = new Schema<ILesson>(
  {
    module: {
      type: Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Lesson content is required'],
    },
    order: {
      type: Number,
      required: true,
    },
    hasVideo: {
      type: Boolean,
      default: false,
    },
    videoSource: {
      type: String,
      enum: ['upload', 'youtube'],
    },
    videoUrl: String,
    videoId: String, // YouTube video ID
    videoDuration: Number,
    videoThumbnail: String,
    videoTranscript: String,
    videoCaptions: [{
      language: String,
      url: String,
      format: {
        type: String,
        enum: ['vtt', 'srt'],
      },
    }],
    allowDownload: {
      type: Boolean,
      default: false,
    },
    playbackSpeedOptions: [Number],
    hasInteractiveQuiz: {
      type: Boolean,
      default: false,
    },
    interactiveQuizData: [{
      timestamp: Number,
      question: String,
      options: [String],
      correctAnswer: Number,
      explanation: String,
    }],
    resources: [{
      name: String,
      url: String,
      type: String,
    }],
    assignments: [{
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
    }],
    quizzes: [{
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
    }],
    exercises: [{
      type: Schema.Types.ObjectId,
      ref: 'Exercise',
    }],
    prerequisites: [{
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
    }],
    isUnlocked: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

lessonSchema.index({ module: 1, order: 1 });
// Text index for search (compound index for title and content)
lessonSchema.index({ title: 'text', content: 'text' });

export default mongoose.model<ILesson>('Lesson', lessonSchema);

