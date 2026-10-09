const audit = require('../services/audit.service');

/** Read-only audit trail: newest first, paginated. No edit or delete here. */
async function list(req, res, next) {
  try {
    const result = await audit.list({ page: req.query.page, limit: 20 });
    return res.render('admin/module/audit', {
      title: 'Audit log',
      userName: audit.userName,
      ...result,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { list };
