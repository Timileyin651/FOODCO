const fs = require('fs');
const path = require('path');

const PRODUCTS_DIR = path.join(__dirname, '..', 'public', 'images', 'products');
const IMAGE_EXT = /\.(svg|png|jpe?g|webp|gif)$/i;

/**
 * Names of the pictures available in public/images/products, so the admin form
 * can offer them in a dropdown instead of a free-text path. Re-read on each
 * call: adding a file to the folder is enough to make it selectable.
 */
function listImages() {
  try {
    return fs
      .readdirSync(PRODUCTS_DIR)
      .filter((file) => IMAGE_EXT.test(file))
      .sort();
  } catch (err) {
    return [];
  }
}

module.exports = listImages;
