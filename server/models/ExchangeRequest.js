const mongoose = require('mongoose');

const exchangeRequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender user ID is required'],
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiver user ID is required'],
    },
    offeredSkill: {
      type: String,
      required: [true, 'Offered skill is required'],
      trim: true,
    },
    wantedSkill: {
      type: String,
      required: [true, 'Wanted skill is required'],
      trim: true,
    },
    message: {
      type: String,
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
        message: '{VALUE} is not a valid request status',
      },
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookup of sender/receiver requests
exchangeRequestSchema.index({ sender: 1, receiver: 1, status: 1 });
exchangeRequestSchema.index({ receiver: 1, status: 1 });

module.exports = mongoose.model('ExchangeRequest', exchangeRequestSchema);
