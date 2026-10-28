const mongoose = require('mongoose');

/**
 * A FoodCo shop: Bodija, Idi-Ape, Ring Road... (11 Ibadan branches). Items and
 * audit entries belong to one branch, and each branch has its own dashboard.
 */
const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Branch name is required'],
      trim: true,
      maxlength: 60,
    },
    slug: {
      type: String,
      required: [true, 'Branch slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 40,
    },
    location: {
      type: String,
      default: '',
      trim: true,
      maxlength: 160,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Branch', branchSchema);
