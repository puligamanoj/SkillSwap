const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema(
  {
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    exchangeRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExchangeRequest',
      required: [true, 'Associated ExchangeRequest ID is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'completed', 'terminated'],
        message: '{VALUE} is not a valid connection status',
      },
      default: 'active',
    },
    connectedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Unique index to prevent duplicate active connections between the same exchange request or users
connectionSchema.index({ exchangeRequest: 1 }, { unique: true });
connectionSchema.index({ users: 1 });

module.exports = mongoose.model('Connection', connectionSchema);
