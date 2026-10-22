const Review = require('../models/Review');
const Connection = require('../models/Connection');
const User = require('../models/User');
const { createAndSendNotification } = require('../services/notificationService');

/**
 * Helper function to recalculate and update a user's average rating & total reviews
 * @param {string} userId
 */
const recalculateUserRating = async (userId) => {
  const stats = await Review.aggregate([
    { $match: { reviewedUser: new User.base.Types.ObjectId(userId.toString()) } },
    {
      $group: {
        _id: '$reviewedUser',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    const average = Math.round(stats[0].averageRating * 10) / 10;
    const count = stats[0].totalReviews;
    await User.findByIdAndUpdate(userId, {
      'rating.average': average,
      'rating.count': count,
    });
  } else {
    await User.findByIdAndUpdate(userId, {
      'rating.average': 0,
      'rating.count': 0,
    });
  }
};

/**
 * @desc    Submit a peer review for a completed exchange connection
 * @route   POST /api/reviews
 * @access  Private (Protected by JWT)
 */
const createReview = async (req, res, next) => {
  try {
    const { connectionId, connection: altConnectionId, reviewedUser, rating, comment } = req.body;
    const targetConnectionId = connectionId || altConnectionId;

    // 1. Validation
    if (!targetConnectionId || !reviewedUser || rating === undefined) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide connectionId, reviewedUser, and rating',
      });
    }

    const parsedRating = parseInt(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({
        status: 'fail',
        message: 'Rating must be an integer from 1 to 5',
      });
    }

    // 2. Prevent self review
    if (req.user._id.toString() === reviewedUser.toString()) {
      return res.status(400).json({
        status: 'fail',
        message: 'You cannot review yourself',
      });
    }

    // 3. Verify connection exists and is completed
    const connection = await Connection.findById(targetConnectionId);
    if (!connection) {
      return res.status(404).json({
        status: 'fail',
        message: 'Connection not found',
      });
    }

    if (connection.status !== 'completed') {
      return res.status(400).json({
        status: 'fail',
        message: 'Reviews can only be submitted for completed skill exchanges',
      });
    }

    // 4. Verify membership
    const isReviewerInConn = connection.users.some(
      (u) => u.toString() === req.user._id.toString()
    );
    const isReviewedInConn = connection.users.some(
      (u) => u.toString() === reviewedUser.toString()
    );

    if (!isReviewerInConn || !isReviewedInConn) {
      return res.status(403).json({
        status: 'fail',
        message: 'You can only review participants in your completed connection',
      });
    }

    // 5. Prevent duplicate review
    const existingReview = await Review.findOne({
      reviewer: req.user._id,
      connection: connection._id,
    });

    if (existingReview) {
      return res.status(409).json({
        status: 'fail',
        message: 'You have already submitted a review for this skill exchange',
      });
    }

    // Create review
    const review = await Review.create({
      reviewer: req.user._id,
      reviewedUser,
      connection: connection._id,
      rating: parsedRating,
      comment: comment ? comment.trim() : '',
    });

    // Recalculate average rating for reviewed user
    await recalculateUserRating(reviewedUser);

    // Send Notification
    await createAndSendNotification({
      recipient: reviewedUser,
      sender: req.user._id,
      type: 'new_review',
      title: 'New Peer Review Received',
      message: `${req.user.name} left you a ${parsedRating}-star review for your skill exchange!`,
      relatedId: review._id,
      app: req.app,
    });

    const populatedReview = await Review.findById(review._id)
      .populate('reviewer', 'name avatar email')
      .populate('reviewedUser', 'name avatar email');

    res.status(201).json({
      status: 'success',
      message: 'Review submitted successfully',
      review: populatedReview,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid ID format provided',
      });
    }
    next(error);
  }
};

/**
 * @desc    Get reviews received by a user
 * @route   GET /api/reviews/user/:userId
 * @access  Public
 */
const getUserReviews = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const reviews = await Review.find({ reviewedUser: userId })
      .populate('reviewer', 'name avatar institution')
      .populate('connection')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        status: 'fail',
        message: 'Invalid user ID format',
      });
    }
    next(error);
  }
};

/**
 * @desc    Get reviews for a connection
 * @route   GET /api/reviews/connection/:connectionId
 * @access  Private (Protected by JWT)
 */
const getConnectionReviews = async (req, res, next) => {
  try {
    const { connectionId } = req.params;

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({
        status: 'fail',
        message: 'Connection not found',
      });
    }

    const isMember = connection.users.some(
      (u) => u.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to view reviews for this connection',
      });
    }

    const reviews = await Review.find({ connection: connectionId })
      .populate('reviewer', 'name avatar')
      .populate('reviewedUser', 'name avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        status: 'fail',
        message: 'Invalid connection ID format',
      });
    }
    next(error);
  }
};

/**
 * @desc    Update a review
 * @route   PATCH /api/reviews/:id
 * @access  Private (Protected by JWT)
 */
const updateReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        status: 'fail',
        message: 'Review not found',
      });
    }

    // Authorization: Only reviewer can edit
    if (review.reviewer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You can only edit your own reviews',
      });
    }

    if (rating !== undefined) {
      const parsedRating = parseInt(rating);
      if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({
          status: 'fail',
          message: 'Rating must be an integer from 1 to 5',
        });
      }
      review.rating = parsedRating;
    }

    if (comment !== undefined) {
      review.comment = comment.trim();
    }

    await review.save();

    // Recalculate user rating stats
    await recalculateUserRating(review.reviewedUser);

    res.status(200).json({
      status: 'success',
      message: 'Review updated successfully',
      review,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a review
 * @route   DELETE /api/reviews/:id
 * @access  Private (Protected by JWT)
 */
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        status: 'fail',
        message: 'Review not found',
      });
    }

    // Authorization: Only reviewer can delete
    if (review.reviewer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You can only delete your own reviews',
      });
    }

    const reviewedUserId = review.reviewedUser;

    await review.deleteOne();

    // Recalculate user rating stats after deletion
    await recalculateUserRating(reviewedUserId);

    res.status(200).json({
      status: 'success',
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getUserReviews,
  getConnectionReviews,
  updateReview,
  deleteReview,
};
