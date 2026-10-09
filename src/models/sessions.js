const mongoose = require('mongoose');

/**
 * Server-side session store (the connect-mongo equivalent for this project,
 * which has no npm registry access). One document per browser session.
 */
const sessionSchema = new mongoose.Schema(
  {
    sid: {
      type: String,
      required: true,
      unique: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

// Sessions expire from Mongo on their own.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Session', sessionSchema);
