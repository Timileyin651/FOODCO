const crypto = require('crypto');
const AppError = require('../utils/AppError');

/**
 * Session-stored CSRF protection (the csurf equivalent for this project,
 * which has no npm registry access).
 *   csrf.token  -> puts a token on res.locals.csrfToken for the forms
 *   csrf.verify -> rejects POSTs without a matching _csrf field
 */

function ensureToken(req) {
  if (!req.session) return '';
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(24).toString('base64url');
  }
  return req.session.csrfToken;
}

function matches(expected, given) {
  const a = crypto.createHash('sha256').update(String(expected)).digest();
  const b = crypto.createHash('sha256').update(String(given)).digest();
  return crypto.timingSafeEqual(a, b);
}

function token(req, res, next) {
  res.locals.csrfToken = ensureToken(req);
  next();
}

function verify(req, res, next) {
  const expected = (req.session && req.session.csrfToken) || '';
  const given =
    (req.body && req.body._csrf) || req.get('x-csrf-token') || '';

  if (!expected || !given || !matches(expected, given)) {
    return next(
      new AppError(
        'Your form has expired. Go back, refresh the page and try again.',
        403,
      ),
    );
  }
  return next();
}

module.exports = { token, verify };
