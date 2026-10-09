const crypto = require('crypto');
const PasswordResetToken = require('../models/passwordResetToken');

const RESET_TTL_MS = 1000 * 60 * 60; // 1 hour

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

/** Create a fresh single-use token for a user (only the hash is stored). */
async function issueToken(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  await PasswordResetToken.deleteMany({ user: userId, usedAt: null });
  await PasswordResetToken.create({
    user: userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + RESET_TTL_MS),
  });
  return token;
}

/**
 * Look up a token. Returns { ok:true, doc } when it is valid and unused,
 * otherwise { ok:false, reason } with one of: missing | invalid | expired | used.
 */
async function consumeToken(token) {
  if (!token || String(token).length < 16) return { ok: false, reason: 'invalid' };
  const doc = await PasswordResetToken.findOne({ tokenHash: hashToken(token) });
  if (!doc) return { ok: false, reason: 'invalid' };
  if (doc.usedAt) return { ok: false, reason: 'used' };
  if (doc.expiresAt < new Date()) return { ok: false, reason: 'expired' };
  return { ok: true, doc };
}

/** Burn a token once the password has been changed. */
async function markUsed(doc) {
  doc.usedAt = new Date();
  await doc.save();
}

module.exports = { issueToken, consumeToken, markUsed, RESET_TTL_MS };
