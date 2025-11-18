import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  conversation: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content: string; // Encrypted content
  contentEncrypted: boolean; // Flag to indicate if content is encrypted
  
  // Files
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  
  // Read status
  isRead: boolean;
  readAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
    },
    contentEncrypted: {
      type: Boolean,
      default: false,
    },
    attachments: [{
      name: String,
      url: String,
      type: String,
      size: Number,
    }],
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

export default mongoose.model<IMessage>('Message', messageSchema);

