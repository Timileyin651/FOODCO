const { listActive, homeSlug } = require('../services/branch.service');

/**
 * GET /dashboard
 *  - a user with one branch goes straight to it
 *  - a superadmin (or anyone with several branches) gets the branch picker
 */
async function home(req, res, next) {
  try {
    const user = req.session.user;

    if (user.role !== 'superadmin') {
      const only = homeSlug(user);
      if (only) return res.redirect(`/dashboard/${only}`);
    }

    const branches = await listActive();
    return res.render('admin/branch-picker', {
      title: 'Choose a branch',
      branches,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { home };
