const express = require('express');
const router = express.Router();
const {
  createRequest,
  getRequests,
  getRequestById,
  updateRequestStatus,
} = require('../controllers/requestController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Require authentication for all request endpoints

router.post('/', createRequest);
router.get('/', getRequests);
router.get('/:id', getRequestById);
router.patch('/:id/status', updateRequestStatus);

module.exports = router;
