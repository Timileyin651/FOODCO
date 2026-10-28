const { listActive, findBySlug } = require('../services/branch.service');
const { getModule } = require('../config/modules');
const items = require('../services/item.service');

const BRANCH_COOKIE = 'foodco.branch';

/* Warm shelf colours, one per card position (same palette as the original
   static storefront markup). */
const PALETTES = {
  bakery: [
    { a: '#d9a15a', b: '#9c5f26' },
    { a: '#a8733f', b: '#6a3f1c' },
    { a: '#e3b066', b: '#a8692b' },
    { a: '#d58a3c', b: '#9a5a1f' },
  ],
  pastries: [
    { a: '#e9a845', b: '#b06a1c' },
    { a: '#d9a15a', b: '#f08cb4' },
    { a: '#8c6f9e', b: '#e7cfa6', c: '#3b3f8f' },
    { a: '#e0a24f', b: '#f08a3a', c: '#fff0c9' },
  ],
  snacks: [
    { a: '#d9a15a', b: '#a8662a', c: '#8c4a2f' },
    { a: '#d9983f', b: '#9d5d1b' },
    { a: '#d6a04a', b: '#8f5a1c' },
    { a: '#d9964a', b: '#f6d9a0' },
  ],
};

const SHELVES = [
  { key: 'bakery', heading: 'Bakery', id: 'h-bakery' },
  { key: 'pastries', heading: 'Pastries', id: 'h-pastries' },
  { key: 'snacks', heading: 'Snacks', id: 'h-snacks' },
];

function readCookie(req, name) {
  const header = req.headers.cookie || '';
  const match = new RegExp('(?:^|; )' + name + '=([^;]*)').exec(header);
  return match ? decodeURIComponent(match[1]) : '';
}

async function buildShelves(branch) {
  return Promise.all(
    SHELVES.map(async (shelf) => {
      const result = await items.listItems(getModule(shelf.key).model, {
        page: 1,
        branch: branch._id,
      });
      const shelfItems = result.items
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name));

      return { ...shelf, items: shelfItems, palettes: PALETTES[shelf.key] };
    }),
  );
}

/**
 * Storefront homepage. With no branch chosen it shows the picker
 * (?branch=bodija or the foodco.branch cookie picks one); each branch sees
 * only its own case, kept in sync with its dashboard.
 */
async function index(req, res, next) {
  try {
    const wanted = (
      req.query.branch ||
      readCookie(req, BRANCH_COOKIE) ||
      ''
    ).toLowerCase();

    const branches = await listActive();
    const branch = wanted ? await findBySlug(wanted) : null;

    if (!branch) {
      return res.render('index', {
        title: 'Fresh from the case',
        branch: null,
        branches,
        shelves: [],
      });
    }

    res.cookie(BRANCH_COOKIE, branch.slug, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 90,
    });

    const shelves = await buildShelves(branch);

    return res.render('index', {
      title: `Fresh from the case | ${branch.name}`,
      branch,
      branches,
      shelves,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { index, BRANCH_COOKIE };
