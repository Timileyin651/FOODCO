/**
 * Values every view can read: the signed-in user, the current path, the
 * current query string and a helper that resolves stored image names.
 */
function locals(req, res, next) {
  res.locals.user = (req.session && req.session.user) || null;
  res.locals.currentPath = req.path;
  res.locals.query = req.query;
  res.locals.imgSrc = function imgSrc(value) {
    if (!value) return '';
    const image = String(value).trim();
    if (/^https?:\/\//i.test(image) || image.startsWith('/')) return image;
    return '/images/products/' + image.replace(/^\.?\//, '');
  };
  next();
}

module.exports = locals;
