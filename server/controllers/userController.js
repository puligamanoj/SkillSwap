const User = require('../models/User');
const { calculateSkillCompatibility } = require('../utils/matchAlgorithm');

/**
 * @desc    Get all users / search users by skill or name
 * @route   GET /api/users
 * @access  Public
 */
const getUsers = async (req, res, next) => {
  try {
    const { search, skill, page = 1, limit = 20 } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
        { institution: { $regex: search, $options: 'i' } },
      ];
    }

    if (skill) {
      query['skillsOffered.skillName'] = { $regex: skill, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({
      status: 'success',
      results: users.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get matched users ranked by skill compatibility score
 * @route   GET /api/users/matches
 * @access  Private (Protected by JWT)
 */
const getMatches = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user._id);

    if (!currentUser) {
      return res.status(404).json({
        status: 'fail',
        message: 'Current user profile not found',
      });
    }

    // Exclude current user from candidate list
    const candidateUsers = await User.find({ _id: { $ne: currentUser._id } }).select('-password');

    // Calculate compatibility score for each candidate
    const matches = candidateUsers
      .map((candidate) => {
        const { matchScore, isDirectMutualSwap, mutualSkills, breakdown } =
          calculateSkillCompatibility(currentUser, candidate);

        return {
          user: candidate,
          matchScore,
          isDirectMutualSwap,
          mutualSkills,
          breakdown,
        };
      })
      // Rank descending from highest compatibility score to lowest
      .sort((a, b) => b.matchScore - a.matchScore);

    res.status(200).json({
      status: 'success',
      count: matches.length,
      matches,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user profile by ID
 * @route   GET /api/users/:id
 * @access  Public
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User profile not found',
      });
    }

    res.status(200).json({
      status: 'success',
      user,
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
 * @desc    Update current user profile
 * @route   PUT /api/users/profile
 * @access  Private (Protected by JWT)
 */
const updateProfile = async (req, res, next) => {
  try {
    const {
      name,
      bio,
      institution,
      avatar,
      skillsOffered,
      skillsWanted,
      availability,
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User profile not found',
      });
    }

    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (institution !== undefined) user.institution = institution;
    if (avatar !== undefined) user.avatar = avatar;
    if (skillsOffered !== undefined) user.skillsOffered = skillsOffered;
    if (skillsWanted !== undefined) user.skillsWanted = skillsWanted;
    if (availability !== undefined) user.availability = availability;

    const updatedUser = await user.save();
    const safeUser = updatedUser.toObject();
    delete safeUser.password;

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      user: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add a skill user can teach (Offered Skill)
 * @route   POST /api/users/skills/offered
 * @access  Private (Protected by JWT)
 */
const addOfferedSkill = async (req, res, next) => {
  try {
    const { skillName, proficiency, experienceYears } = req.body;

    if (!skillName) {
      return res.status(400).json({
        status: 'fail',
        message: 'skillName is required',
      });
    }

    const user = await User.findById(req.user._id);

    // Prevent duplicate offered skill
    const exists = user.skillsOffered.some(
      (s) => s.skillName.toLowerCase() === skillName.trim().toLowerCase()
    );

    if (exists) {
      return res.status(400).json({
        status: 'fail',
        message: `You have already added '${skillName}' to your offered skills list`,
      });
    }

    user.skillsOffered.push({
      skillName: skillName.trim(),
      proficiency: proficiency || 'Intermediate',
      experienceYears: experienceYears !== undefined ? parseInt(experienceYears) : 1,
    });

    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;

    res.status(201).json({
      status: 'success',
      message: 'Offered skill added successfully',
      skillsOffered: user.skillsOffered,
      user: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove an offered skill by skillId or skillName
 * @route   DELETE /api/users/skills/offered/:skillId
 * @access  Private (Protected by JWT)
 */
const removeOfferedSkill = async (req, res, next) => {
  try {
    const target = req.params.skillId;
    const user = await User.findById(req.user._id);

    const initialCount = user.skillsOffered.length;

    user.skillsOffered = user.skillsOffered.filter(
      (s) => s._id.toString() !== target && s.skillName.toLowerCase() !== target.toLowerCase()
    );

    if (user.skillsOffered.length === initialCount) {
      return res.status(404).json({
        status: 'fail',
        message: 'Offered skill not found in your list',
      });
    }

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Offered skill removed successfully',
      skillsOffered: user.skillsOffered,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add a skill user wants to learn (Wanted Skill)
 * @route   POST /api/users/skills/wanted
 * @access  Private (Protected by JWT)
 */
const addWantedSkill = async (req, res, next) => {
  try {
    const { skillName, targetProficiency } = req.body;

    if (!skillName) {
      return res.status(400).json({
        status: 'fail',
        message: 'skillName is required',
      });
    }

    const user = await User.findById(req.user._id);

    // Prevent duplicate wanted skill
    const exists = user.skillsWanted.some(
      (s) => s.skillName.toLowerCase() === skillName.trim().toLowerCase()
    );

    if (exists) {
      return res.status(400).json({
        status: 'fail',
        message: `You have already added '${skillName}' to your wanted skills list`,
      });
    }

    user.skillsWanted.push({
      skillName: skillName.trim(),
      targetProficiency: targetProficiency || 'Beginner',
    });

    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;

    res.status(201).json({
      status: 'success',
      message: 'Wanted skill added successfully',
      skillsWanted: user.skillsWanted,
      user: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove a wanted skill by skillId or skillName
 * @route   DELETE /api/users/skills/wanted/:skillId
 * @access  Private (Protected by JWT)
 */
const removeWantedSkill = async (req, res, next) => {
  try {
    const target = req.params.skillId;
    const user = await User.findById(req.user._id);

    const initialCount = user.skillsWanted.length;

    user.skillsWanted = user.skillsWanted.filter(
      (s) => s._id.toString() !== target && s.skillName.toLowerCase() !== target.toLowerCase()
    );

    if (user.skillsWanted.length === initialCount) {
      return res.status(404).json({
        status: 'fail',
        message: 'Wanted skill not found in your list',
      });
    }

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Wanted skill removed successfully',
      skillsWanted: user.skillsWanted,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateProfile,
  getMatches,
  addOfferedSkill,
  removeOfferedSkill,
  addWantedSkill,
  removeWantedSkill,
};
