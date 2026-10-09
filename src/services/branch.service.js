const Branch = require('../models/branch');

/** Every branch that is open, alphabetical. */
async function listActive() {
  return Branch.find({ active: true }).sort({ name: 1 });
}

/** Look one branch up by its URL slug (case-insensitive). */
async function findBySlug(slug) {
  if (!slug) return null;
  return Branch.findOne({ slug: String(slug).toLowerCase(), active: true });
}

/** Slug of the branch a non-superadmin user calls home (first assigned). */
function homeSlug(user) {
  if (!user || user.role === 'superadmin') return null;
  const list = user.branches || [];
  return list.length ? list[0].slug : null;
}

module.exports = { Branch, listActive, findBySlug, homeSlug };
