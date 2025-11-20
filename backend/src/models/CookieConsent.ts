import mongoose, { Document, Schema } from 'mongoose';

export interface ICookieConsent extends Document {
  user?: mongoose.Types.ObjectId; // Optional - can track anonymous users
  sessionId?: string; // For anonymous users
  
  // Consent details
  necessary: boolean; // Always true (required cookies)
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  
  // Metadata
  ipAddress?: string;
  userAgent?: string;
  
  // Timestamps
  consentedAt: Date;
  lastUpdatedAt: Date;
}

const cookieConsentSchema = new Schema<ICookieConsent>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    sessionId: String,
    necessary: {
      type: Boolean,
      default: true, // Always required
    },
    functional: {
      type: Boolean,
      default: false,
    },
    analytics: {
      type: Boolean,
      default: false,
    },
    marketing: {
      type: Boolean,
      default: false,
    },
    ipAddress: String,
    userAgent: String,
    consentedAt: {
      type: Date,
      default: Date.now,
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

cookieConsentSchema.index({ user: 1 });
cookieConsentSchema.index({ sessionId: 1 });

export default mongoose.model<ICookieConsent>('CookieConsent', cookieConsentSchema);

