const express = require('express');
const router = express.Router();
const {
  getConnections,
  getConnectionById,
  updateConnectionStatus,
} = require('../controllers/connectionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Require authentication for all connection endpoints

router.get('/', getConnections);
router.get('/:id', getConnectionById);
router.patch('/:id/status', updateConnectionStatus);

module.exports = router;
