/**
 * Flash messages stored in the session and shown once.
 *   req.flash('success', 'Pastry added')  ->  rendered by partials/flash.ejs
 */
function flash() {
  return function flashMiddleware(req, res, next) {
    req.flash = function push(type, text) {
      if (!req.session) return;
      const queue = Array.isArray(req.session.flash) ? req.session.flash : [];
      queue.push({ type, text });
      req.session.flash = queue;
    };

    // Move whatever was queued last request onto the page, then clear it so it
    // is only ever shown once.
    res.locals.flash = [];
    if (req.session && Array.isArray(req.session.flash)) {
      res.locals.flash = req.session.flash;
      delete req.session.flash;
    }

    next();
  };
}

module.exports = flash;
