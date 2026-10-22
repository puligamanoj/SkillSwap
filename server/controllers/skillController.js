const Skill = require('../models/Skill');

/**
 * @desc    Create a new skill
 * @route   POST /api/skills
 * @access  Public / Protected
 */
const createSkill = async (req, res, next) => {
  try {
    const { name, category, description } = req.body;

    if (!name) {
      return res.status(400).json({
        status: 'fail',
        message: 'Skill name is required',
      });
    }

    // Check duplicate skill name (case insensitive)
    const existingSkill = await Skill.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });

    if (existingSkill) {
      return res.status(400).json({
        status: 'fail',
        message: 'A skill with this name already exists',
        skill: existingSkill,
      });
    }

    const skill = await Skill.create({
      name: name.trim(),
      category: category || 'Other',
      description: description || '',
    });

    res.status(201).json({
      status: 'success',
      message: 'Skill created successfully',
      skill,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all skills / Search skills
 * @route   GET /api/skills
 * @access  Public
 */
const getSkills = async (req, res, next) => {
  try {
    const { search, category, page = 1, limit = 50 } = req.query;

    const query = {};

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const skills = await Skill.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ name: 1 });

    const total = await Skill.countDocuments(query);

    res.status(200).json({
      status: 'success',
      results: skills.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      skills,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get skill details by ID
 * @route   GET /api/skills/:id
 * @access  Public
 */
const getSkillById = async (req, res, next) => {
  try {
    const skill = await Skill.findById(req.params.id);

    if (!skill) {
      return res.status(404).json({
        status: 'fail',
        message: 'Skill not found',
      });
    }

    res.status(200).json({
      status: 'success',
      skill,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        status: 'fail',
        message: 'Invalid skill ID format',
      });
    }
    next(error);
  }
};

module.exports = {
  createSkill,
  getSkills,
  getSkillById,
};
