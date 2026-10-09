const AuditLog = require('../models/auditLog');

/**
 * Audit trail helpers. A failed audit write must never break the request that
 * triggered it, so errors are logged and swallowed.
 */
async function record(entry) {
  try {
    const user =
      entry.user && entry.user._id ? entry.user._id : entry.user || null;
    await AuditLog.create({
      user,
      action: entry.action,
      module: entry.module || 'auth',
      branch: entry.branch || null,
      targetId: entry.targetId || null,
      summary: entry.summary,
    });
  } catch (err) {
    console.error('Audit write failed:', err.message);
  }
}

/** Newest first, paginated, with the user's name resolved.
 *  Pass `branch` to see one branch's history only. */
async function list({ page = 1, limit = 20, branch = null } = {}) {
  const current = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.max(1, parseInt(limit, 10) || 20);
  const filter = branch ? { branch } : {};
  const [entries, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((current - 1) * safeLimit)
      .limit(safeLimit)
      .populate('user', 'first_name last_name username email'),
    AuditLog.countDocuments(filter),
  ]);

  return {
    entries,
    total,
    page: current,
    pages: Math.max(1, Math.ceil(total / safeLimit)),
    limit: safeLimit,
  };
}

/** Display name for a populated (or missing) audit user. */
function userName(user) {
  if (!user) return 'System';
  const full = [user.first_name, user.last_name].filter(Boolean).join(' ');
  return full || user.username || user.email || 'Unknown user';
}

module.exports = { record, list, userName };
