const Bakery = require('../models/bakery');
const Pastry = require('../models/pastry');
const Snack = require('../models/snack');
const AuditLog = require('../models/auditLog');
const audit = require('../services/audit.service');

/** /dashboard overview: counts per module plus the latest audit entries. */
async function overview(req, res, next) {
  try {
    const [bakeryCount, pastryCount, snackCount, recent] = await Promise.all([
      Bakery.countDocuments(),
      Pastry.countDocuments(),
      Snack.countDocuments(),
      AuditLog.find()
        .sort({ createdAt: -1, _id: -1 })
        .limit(6)
        .populate('user', 'first_name last_name username email')
        .lean(),
    ]);

    return res.render('admin/dashboard', {
      title: 'Dashboard',
      counts: { bakery: bakeryCount, pastries: pastryCount, snacks: snackCount },
      recent: recent.map((entry) => ({
        ...entry,
        userLabel: audit.userName(entry.user),
      })),
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { overview };
