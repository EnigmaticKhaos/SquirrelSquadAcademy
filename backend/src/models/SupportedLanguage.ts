import mongoose, { Document, Schema } from 'mongoose';

export interface ISupportedLanguage extends Document {
  // Language details
  code: string; // ISO 639-1 language code (e.g., 'en', 'es', 'fr')
  name: string; // Language name in English (e.g., 'English', 'Spanish')
  nativeName: string; // Language name in native language (e.g., 'English', 'Español')
  
  // Status
  isEnabled: boolean; // Whether language is enabled
  isDefault: boolean; // Whether this is the default language
  
  // Translation support
  translationEnabled: boolean; // Whether AI translation is enabled
  manualTranslationOnly: boolean; // Whether only manual translation is allowed
  
  // Statistics
  contentCount: number; // Number of translated content items
  completionPercentage: number; // Percentage of content translated (0-100)
  
  // Metadata
  flagEmoji?: string; // Flag emoji for display
  rtl: boolean; // Right-to-left language
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const supportedLanguageSchema = new Schema<ISupportedLanguage>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    nativeName: {
      type: String,
      required: true,
    },
    isEnabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    translationEnabled: {
      type: Boolean,
      default: true,
    },
    manualTranslationOnly: {
      type: Boolean,
      default: false,
    },
    contentCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    flagEmoji: String,
    rtl: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one default language
supportedLanguageSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await mongoose.model('SupportedLanguage').updateMany(
      { _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

export default mongoose.model<ISupportedLanguage>('SupportedLanguage', supportedLanguageSchema);

