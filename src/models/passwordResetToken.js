const mongoose = require('mongoose');

/**
 * Password reset tokens. Only the SHA-256 hash of the token that was emailed
 * is stored, so a database dump cannot be replayed into account takeovers.
 */
const passwordResetTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Mongo removes the document once it has expired (TTL index).
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
