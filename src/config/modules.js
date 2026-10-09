const Bakery = require('../models/bakery');
const Pastry = require('../models/pastry');
const Snack = require('../models/snack');

/**
 * Registry for the three CRUD modules. One entry per URL segment:
 *   /dashboard/bakery /dashboard/pastries /dashboard/snacks
 * `singular` is used for flash text ("Pastry added", "Bakery item deleted").
 */
const registry = {
  bakery: {
    key: 'bakery',
    path: 'bakery',
    heading: 'Bakery',
    singular: 'Bakery item',
    model: Bakery,
  },
  pastries: {
    key: 'pastries',
    path: 'pastries',
    heading: 'Pastries',
    singular: 'Pastry',
    model: Pastry,
  },
  snacks: {
    key: 'snacks',
    path: 'snacks',
    heading: 'Snacks',
    singular: 'Snack',
    model: Snack,
  },
};

function getModule(key) {
  return Object.prototype.hasOwnProperty.call(registry, key)
    ? registry[key]
    : null;
}

module.exports = { registry, getModule };
