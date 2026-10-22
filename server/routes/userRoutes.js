const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  updateProfile,
  getMatches,
  addOfferedSkill,
  removeOfferedSkill,
  addWantedSkill,
  removeWantedSkill,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Public search/list users
router.get('/', getUsers);

// Protected compatibility matching engine
router.get('/matches', protect, getMatches);

// Protected user profile update
router.put('/profile', protect, updateProfile);

// Protected skill management routes
router.post('/skills/offered', protect, addOfferedSkill);
router.delete('/skills/offered/:skillId', protect, removeOfferedSkill);
router.post('/skills/wanted', protect, addWantedSkill);
router.delete('/skills/wanted/:skillId', protect, removeWantedSkill);

// Public single user profile fetch (MUST BE AFTER named routes)
router.get('/:id', getUserById);

module.exports = router;
