import mongoose, { Document, Schema } from 'mongoose';

export type WebhookEventType = 
  | 'course.completed'
  | 'course.enrolled'
  | 'course.started'
  | 'assignment.submitted'
  | 'assignment.graded';

export type WebhookStatus = 'active' | 'paused' | 'disabled';

export interface IWebhook extends Document {
  user: mongoose.Types.ObjectId; // User who created the webhook
  
  // Webhook details
  url: string; // Webhook endpoint URL
  secret: string; // Secret for signing webhook payloads
  eventTypes: WebhookEventType[]; // Events to listen for
  
  // Status
  status: WebhookStatus;
  isActive: boolean;
  
  // Statistics
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  lastDeliveryAt?: Date;
  lastSuccessAt?: Date;
  lastFailureAt?: Date;
  lastFailureReason?: string;
  
  // Retry configuration
  retryOnFailure: boolean;
  maxRetries: number;
  retryDelay: number; // in seconds
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const webhookSchema = new Schema<IWebhook>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    secret: {
      type: String,
      required: true,
    },
    eventTypes: [{
      type: String,
      enum: [
        'course.completed',
        'course.enrolled',
        'course.started',
        'assignment.submitted',
        'assignment.graded',
      ],
      required: true,
    }],
    status: {
      type: String,
      enum: ['active', 'paused', 'disabled'],
      default: 'active',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    totalDeliveries: {
      type: Number,
      default: 0,
    },
    successfulDeliveries: {
      type: Number,
      default: 0,
    },
    failedDeliveries: {
      type: Number,
      default: 0,
    },
    lastDeliveryAt: Date,
    lastSuccessAt: Date,
    lastFailureAt: Date,
    lastFailureReason: String,
    retryOnFailure: {
      type: Boolean,
      default: true,
    },
    maxRetries: {
      type: Number,
      default: 3,
      min: 0,
      max: 10,
    },
    retryDelay: {
      type: Number,
      default: 60, // 60 seconds
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

webhookSchema.index({ user: 1, isActive: 1 });
webhookSchema.index({ eventTypes: 1, isActive: 1 });

export default mongoose.model<IWebhook>('Webhook', webhookSchema);

