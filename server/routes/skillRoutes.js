const express = require('express');
const router = express.Router();
const { createSkill, getSkills, getSkillById } = require('../controllers/skillController');

router.post('/', createSkill);
router.get('/', getSkills);
router.get('/:id', getSkillById);

module.exports = router;
