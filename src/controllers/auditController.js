const audit = require('../services/audit.service');

/** Read-only audit trail for one branch: newest first, paginated. */
async function list(req, res, next) {
  try {
    const result = await audit.list({
      page: req.query.page,
      limit: 20,
      branch: req.branch._id,
    });
    return res.render('admin/module/audit', {
      title: `${req.branch.name} audit log`,
      userName: audit.userName,
      ...result,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { list };
