const express = require('express');
const router = express.Router();
const {
  createReview,
  getUserReviews,
  getConnectionReviews,
  updateReview,
  deleteReview,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

// Public route to view reviews received by a user
router.get('/user/:userId', getUserReviews);

// Protected review endpoints
router.post('/', protect, createReview);
router.get('/connection/:connectionId', protect, getConnectionReviews);
router.patch('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
