const Bakery = require('../models/bakery');
const Pastry = require('../models/pastry');
const Snack = require('../models/snack');
const AuditLog = require('../models/auditLog');
const audit = require('../services/audit.service');

/** /dashboard/:branch overview: that branch's stock counts + latest activity. */
async function overview(req, res, next) {
  try {
    const branch = req.branch;
    const scope = { branch: branch._id };

    const [bakeryCount, pastryCount, snackCount, recent] = await Promise.all([
      Bakery.countDocuments(scope),
      Pastry.countDocuments(scope),
      Snack.countDocuments(scope),
      AuditLog.find(scope)
        .sort({ createdAt: -1, _id: -1 })
        .limit(6)
        .populate('user', 'first_name last_name username email')
        .lean(),
    ]);

    return res.render('admin/dashboard', {
      title: `${branch.name} overview`,
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
