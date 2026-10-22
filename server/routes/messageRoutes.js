const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getMessagesByConnection,
  markMessageAsRead,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Require JWT authentication for all message routes

router.post('/', sendMessage);
router.get('/:connectionId', getMessagesByConnection);
router.patch('/:id/read', markMessageAsRead);

module.exports = router;
