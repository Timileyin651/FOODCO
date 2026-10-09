const AppError = require('../utils/AppError');
const {
  findBySlug,
  homeSlug,
  listActive,
} = require('../services/branch.service');

/* Old single-dashboard URLs: /dashboard/pastries -> /dashboard/<branch>/pastries */
const LEGACY_SEGMENTS = ['bakery', 'pastries', 'snacks', 'audit'];

/**
 * Applied to every /dashboard/:branch/* route.
 *  - unknown or inactive branch -> 404
 *  - a user who cannot access that branch -> 403
 *  - a hit on an old pre-branch URL -> redirect to the user's home branch
 * On success it sets req.branch and res.locals.branch for the views.
 */
async function requireBranch(req, res, next) {
  try {
    const slug = (req.params.branch || '').toLowerCase();
    const user = req.session.user;
    const branch = await findBySlug(slug);

    if (!branch) {
      if (LEGACY_SEGMENTS.includes(slug)) {
        const home = homeSlug(user);
        if (!home) return res.redirect('/dashboard');
        const queryIndex = req.originalUrl.indexOf('?');
        const query = queryIndex === -1 ? '' : req.originalUrl.slice(queryIndex);
        return res.redirect(`/dashboard/${home}/${slug}${query}`);
      }
      throw new AppError('Unknown branch', 404);
    }

    const allowed =
      user.role === 'superadmin' ||
      (user.branches || []).some((entry) => entry.slug === branch.slug);

    if (!allowed) {
      throw new AppError('You do not have access to this branch', 403);
    }

    req.branch = branch;
    res.locals.branch = branch;

    // A superadmin's session carries no branch list, so give the switcher
    // every open branch to pick from.
    if (user.role === 'superadmin' && !(user.branches || []).length) {
      res.locals.branches = await listActive();
    }

    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = requireBranch;
