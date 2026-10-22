const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Skill name must be at least 2 characters long'],
      maxlength: [50, 'Skill name cannot exceed 50 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: [
          'Programming',
          'Web Development',
          'Mobile Development',
          'Data Science',
          'Design',
          'Languages',
          'Music',
          'Academics',
          'Business',
          'Other',
        ],
        message: '{VALUE} is not a supported skill category',
      },
      default: 'Programming',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index for text search on name and description
skillSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Skill', skillSchema);
