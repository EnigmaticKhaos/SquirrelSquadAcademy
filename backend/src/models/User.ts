import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  username: string;
  password: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  role: 'user' | 'admin';
  
  // Profile
  profilePhoto?: string;
  backgroundImage?: string;
  bio?: string;
  socialLinks?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  
  // Status
  onlineStatus: 'online' | 'offline';
  lastSeen?: Date;
  
  // Settings
  privacySettings?: {
    profileVisibility: 'public' | 'private' | 'friends';
    whoCanMessage: 'everyone' | 'friends' | 'none';
    activityVisibility: 'public' | 'private' | 'friends';
  };
  notificationPreferences?: {
    email: boolean;
    inApp: boolean;
    [key: string]: boolean | undefined;
  };
  theme: 'light' | 'dark' | 'auto' | 'custom';
  language: string;
  
  // Accessibility preferences
  accessibilityPreferences?: {
    highContrast: boolean; // High contrast mode
    fontSize: 'small' | 'medium' | 'large' | 'extra-large'; // Font size preference
    reducedMotion: boolean; // Reduce animations and motion
    screenReaderOptimized: boolean; // Optimize for screen readers
    keyboardNavigation: boolean; // Enhanced keyboard navigation
    focusVisible: boolean; // Enhanced focus indicators
    altTextForImages: boolean; // Always show alt text for images
    captionsEnabled: boolean; // Default captions enabled for videos
    captionsLanguage?: string; // Preferred caption language
    audioDescriptions: boolean; // Enable audio descriptions when available
    colorBlindMode?: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'; // Color blind support
    dyslexiaFont: boolean; // Use dyslexia-friendly font
    readingAssistance: boolean; // Enable reading assistance features
  };
  
  // 2FA
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  twoFactorBackupCodes?: string[];
  
  // Gamification
  xp: number;
  level: number;
  profileCardBadge?: mongoose.Types.ObjectId;
  
  // Subscription
  subscription: {
    tier: 'free' | 'premium';
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    currentPeriodEnd?: Date;
  };
  
  // OAuth
  oauthProviders?: {
    google?: string;
    github?: string;
    discord?: string;
  };
  oauthTokens?: {
    github?: string; // GitHub access token for API operations
  };
  
  // Moderation
  moderationStatus?: {
    isBanned: boolean;
    isSuspended: boolean;
    banReason?: string;
    suspensionReason?: string;
    bannedUntil?: Date;
    suspendedUntil?: Date;
    warningCount: number;
    lastWarningAt?: Date;
  };
  
  // Mentor Status
  mentorStatus?: {
    isMentor: boolean;
    isAvailable: boolean; // Can accept new mentees
    maxMentees?: number; // Limit concurrent mentees
    specialties?: string[]; // Areas of expertise
    mentorBio?: string; // Mentor-specific bio
    applicationDate?: Date;
    approvedDate?: Date;
    approvedBy?: mongoose.Types.ObjectId; // Admin who approved
    rejectionReason?: string;
    stats?: {
      totalMentees: number;
      activeMentorships: number;
      completedMentorships: number;
      averageRating: number;
    };
  };
  
  // Privacy & GDPR
  privacyPolicyAccepted: boolean;
  privacyPolicyAcceptedAt?: Date;
  privacyPolicyVersion?: string; // Track which version was accepted
  cookieConsent?: {
    necessary: boolean;
    functional: boolean;
    analytics: boolean;
    marketing: boolean;
    consentedAt?: Date;
  };
  dataProcessingConsent: boolean; // GDPR consent for data processing
  dataProcessingConsentAt?: Date;
  marketingConsent: boolean; // Consent for marketing emails
  marketingConsentAt?: Date;
  
  // Account deletion
  accountDeletionRequested?: Date;
  accountDeletionScheduled?: Date; // Scheduled deletion date (e.g., 30 days after request)
  accountDeletedAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    username: {
      type: String,
      required: [true, 'Please provide a username'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    password: {
      type: String,
      required: function(this: IUser) {
        return !this.oauthProviders || Object.keys(this.oauthProviders).length === 0;
      },
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    profilePhoto: String,
    backgroundImage: String,
    bio: String,
    socialLinks: {
      github: String,
      linkedin: String,
      twitter: String,
      website: String,
    },
    onlineStatus: {
      type: String,
      enum: ['online', 'offline'],
      default: 'offline',
    },
    lastSeen: Date,
    privacySettings: {
      profileVisibility: {
        type: String,
        enum: ['public', 'private', 'friends'],
        default: 'public',
      },
      whoCanMessage: {
        type: String,
        enum: ['everyone', 'friends', 'none'],
        default: 'everyone',
      },
      activityVisibility: {
        type: String,
        enum: ['public', 'private', 'friends'],
        default: 'public',
      },
    },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto', 'custom'],
      default: 'auto',
    },
    language: {
      type: String,
      default: 'en',
    },
    accessibilityPreferences: {
      highContrast: {
        type: Boolean,
        default: false,
      },
      fontSize: {
        type: String,
        enum: ['small', 'medium', 'large', 'extra-large'],
        default: 'medium',
      },
      reducedMotion: {
        type: Boolean,
        default: false,
      },
      screenReaderOptimized: {
        type: Boolean,
        default: false,
      },
      keyboardNavigation: {
        type: Boolean,
        default: false,
      },
      focusVisible: {
        type: Boolean,
        default: true,
      },
      altTextForImages: {
        type: Boolean,
        default: false,
      },
      captionsEnabled: {
        type: Boolean,
        default: true,
      },
      captionsLanguage: String,
      audioDescriptions: {
        type: Boolean,
        default: false,
      },
      colorBlindMode: {
        type: String,
        enum: ['none', 'protanopia', 'deuteranopia', 'tritanopia'],
        default: 'none',
      },
      dyslexiaFont: {
        type: Boolean,
        default: false,
      },
      readingAssistance: {
        type: Boolean,
        default: false,
      },
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: String,
    twoFactorBackupCodes: [String],
    xp: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
    },
    profileCardBadge: {
      type: Schema.Types.ObjectId,
      ref: 'Badge',
    },
    subscription: {
      tier: {
        type: String,
        enum: ['free', 'premium'],
        default: 'free',
      },
      stripeCustomerId: String,
      stripeSubscriptionId: String,
      currentPeriodEnd: Date,
    },
    oauthProviders: {
      google: String,
      github: String,
      discord: String,
    },
    oauthTokens: {
      github: String, // GitHub access token for API operations
    },
    moderationStatus: {
      isBanned: {
        type: Boolean,
        default: false,
      },
      isSuspended: {
        type: Boolean,
        default: false,
      },
      banReason: String,
      suspensionReason: String,
      bannedUntil: Date,
      suspendedUntil: Date,
      warningCount: {
        type: Number,
        default: 0,
      },
      lastWarningAt: Date,
    },
    mentorStatus: {
      isMentor: {
        type: Boolean,
        default: false,
        index: true,
      },
      isAvailable: {
        type: Boolean,
        default: false,
      },
      maxMentees: {
        type: Number,
        default: 5,
        min: 1,
        max: 20,
      },
      specialties: [String],
      mentorBio: String,
      applicationDate: Date,
      approvedDate: Date,
      approvedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      rejectionReason: String,
      stats: {
        totalMentees: {
          type: Number,
          default: 0,
        },
        activeMentorships: {
          type: Number,
          default: 0,
        },
        completedMentorships: {
          type: Number,
          default: 0,
        },
        averageRating: {
          type: Number,
          default: 0,
        },
      },
    },
    privacyPolicyAccepted: {
      type: Boolean,
      default: false,
    },
    privacyPolicyAcceptedAt: Date,
    privacyPolicyVersion: String,
    cookieConsent: {
      necessary: {
        type: Boolean,
        default: true,
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
      consentedAt: Date,
    },
    dataProcessingConsent: {
      type: Boolean,
      default: false,
    },
    dataProcessingConsentAt: Date,
    marketingConsent: {
      type: Boolean,
      default: false,
    },
    marketingConsentAt: Date,
    accountDeletionRequested: Date,
    accountDeletionScheduled: Date,
    accountDeletedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Text index for search (compound index for username, email, and bio)
userSchema.index({ username: 'text', email: 'text', bio: 'text' });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', userSchema);

