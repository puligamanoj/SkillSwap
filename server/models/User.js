const mongoose = require('mongoose');

const skillOfferedSchema = new mongoose.Schema({
  skillName: {
    type: String,
    required: [true, 'Skill name is required'],
    trim: true,
  },
  proficiency: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    default: 'Intermediate',
  },
  experienceYears: {
    type: Number,
    min: [0, 'Experience years cannot be negative'],
    max: [50, 'Experience years cannot exceed 50'],
    default: 1,
  },
});

const skillWantedSchema = new mongoose.Schema({
  skillName: {
    type: String,
    required: [true, 'Skill name is required'],
    trim: true,
  },
  targetProficiency: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner',
  },
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Do not return password by default in queries
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },
    institution: {
      type: String,
      trim: true,
      maxlength: [100, 'Institution name cannot exceed 100 characters'],
      default: '',
    },
    skillsOffered: [skillOfferedSchema],
    skillsWanted: [skillWantedSchema],
    availability: {
      type: [String],
      default: ['Weekends', 'Evenings'],
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient skill searching
userSchema.index({ 'skillsOffered.skillName': 1 });
userSchema.index({ 'skillsWanted.skillName': 1 });

module.exports = mongoose.model('User', userSchema);
