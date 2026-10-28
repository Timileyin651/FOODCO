/**
 * Seed script: npm run seed
 *  - replaces every old branch with the 11 Ibadan branches (Bodija, Idi-Ape,
 *    Akobo, Jericho, Ring Road, Dugbe, Apata, Ologuneru, Monatan,
 *    Akala Express, Adegbayi). Names are stored clean, without any "FoodCo"
 *    prefix; the slug is the lowercase hyphenated name.
 *  - clears whatever pointed at the removed branches (their stock, their
 *    branch accounts, their audit rows) so nothing keeps a dangling reference
 *  - creates a superadmin from ADMIN_EMAIL (sees all branches)
 *  - creates one branch account per branch: username = the branch slug.
 *    Every seeded account gets the same seed password (SEED_PASSWORD below),
 *    hashed by the User model's bcrypt hook, and the username/email/password
 *    rows are printed at the end of the run.
 *  - fills every branch with its own sample stock (image left empty where no
 *    product picture matches)
 * Re-running is safe: branches and stock are upserted, and every seeded
 * account's password is (re)set to SEED_PASSWORD, so no seeded account can be
 * left behind on an older password.
 */
require('dotenv').config();
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const User = require('./models/users');
const Branch = require('./models/branch');
const Bakery = require('./models/bakery');
const Pastry = require('./models/pastry');
const Snack = require('./models/snack');
const AuditLog = require('./models/auditLog');

const BRANCHES = [
  { name: 'Bodija', slug: 'bodija', location: 'Opposite Aare Junction, Bodija/UI Road, Ibadan' },
  { name: 'Idi-Ape', slug: 'idi-ape', location: 'Odua Shopping Complex, opposite Mary Hill Crescent School, Idi-Ape, Ibadan' },
  { name: 'Akobo', slug: 'akobo', location: 'Baptist Bus Stop, near Police Post, Akobo, Ibadan' },
  { name: 'Jericho', slug: 'jericho', location: '50 Jericho Street, by Jericho Nursing Home, All Saints Road, Jericho, Ibadan' },
  { name: 'Ring Road', slug: 'ring-road', location: '117 MKO Abiola Way, beside IBEDC, Ring Road, Ibadan' },
  { name: 'Dugbe', slug: 'dugbe', location: 'Inside Cocoa Mall, Dugbe, Ibadan' },
  { name: 'Apata', slug: 'apata', location: 'UBL premises, by Lafia Hotel, Ibadan-Abeokuta Road, Apata' },
  { name: 'Ologuneru', slug: 'ologuneru', location: 'Atinuke Bus Stop, New Eleyele Road, Ologuneru, Ibadan' },
  { name: 'Monatan', slug: 'monatan', location: 'Monatan, Iwo Road, Ibadan' },
  { name: 'Akala Express', slug: 'akala-express', location: 'Akala Express Road, Oluyole, Ibadan' },
  { name: 'Adegbayi', slug: 'adegbayi', location: 'Adegbayi, Ibadan' },
];

const SAMPLES = {
  Bakery: [
    { name: ' Whole wheat loaf', price: 2500, quantity: 12, image: 'country-loaf.svg' },
    { name: 'White sliced bread', price: 2800, quantity: 8, image: 'sliced-bread.svg' },
    { name: 'Whole white loaf', price: 2800, quantity: 8, image: 'whole-wheat-loaf.svg' },
    { name: 'Wheat sliced bread', price: 2800, quantity: 8, image: 'sliced-bread.svg' },

    // { name: 'Baguette', price: 1500, quantity: 0, image: 'baguette.svg' },
    // { name: 'Sesame bun', price: 800, quantity: 24, image: 'sesame-bun.svg' },
  ],
  Pastries: [
    // { name: 'Butter croissant', price: 1200, quantity: 18, image: 'butter-croissant.svg' },
    { name: 'Glazed donut', price: 700, quantity: 0, image: 'glazed-donut.svg' },
    // { name: 'Blueberry muffin', price: 1000, quantity: 14, image: 'blueberry-muffin.svg' },
    // { name: 'Apricot danish', price: 1300, quantity: 9, image: 'apricot-danish.svg' },
    { name: 'Meat Pie', price: 1300, quantity: 22, image: 'meat-pie.svg' },
    { name: 'Spice Beef Pie', price: 1500, quantity: 14, image: 'spice-beef-pie.svg' },
    { name: 'Chicken Pie', price: 1600, quantity: 12, image: 'chicken-pie.svg' },
    { name: 'Sausage Roll', price: 1000, quantity: 24, image: 'sausage-roll.svg' },
  ],
  Snacks: [
    { name: 'Sausage roll', price: 900, quantity: 20, image: 'sausage-roll.svg' },
    { name: 'Meat pie', price: 1100, quantity: 16, image: 'meat-pie.svg' },
    // { name: 'Samosa', price: 600, quantity: 0, image: 'samosa.svg' },
    // { name: 'Puff-puff', price: 500, quantity: 30, image: 'puff-puff.svg' },
    { name: 'Scotch Egg', price: 900, quantity: 20, image: 'scotch-egg.svg' },
    { name: 'Hot Dog', price: 1200, quantity: 18, image: 'hot-dog.svg' },
    { name: 'Buns', price: 700, quantity: 30, image: 'buns.svg' },
  ],
};

const MODELS = { Bakery, Pastries: Pastry, Snacks: Snack };

/* Each branch keeps its own stock numbers so the dashboards are clearly
   separate: different branches sell out of different things. */
function branchStock(base, branchIndex, index) {
  const offset = (branchIndex % 5) - 2;
  const quantity = Math.max(0, base.quantity + offset * 3 + index);
  const soldOut = quantity === 0 || (index + branchIndex) % 4 === 0;
  return {
    quantity: soldOut ? 0 : quantity,
    status: soldOut ? 'out' : 'in',
  };
}

/* Single password for every account this script seeds. The database only ever
   holds the bcrypt hash produced by the User model's pre-save hook. */
const SEED_PASSWORD = 'foodco@1234';

/** Delete every branch that is not one of the 11, and the records that
 *  pointed at it (stock rows and audit rows). Account cleanup happens later,
 *  once the surviving branch ids are known. */
async function dropOldBranches() {
  const keep = BRANCHES.map((entry) => entry.slug);
  const old = await Branch.find({ slug: { $nin: keep } });
  if (!old.length) return;

  const oldIds = old.map((entry) => entry._id);
  const [bakery, pastry, snack, audits] = await Promise.all([
    Bakery.deleteMany({ branch: { $in: oldIds } }),
    Pastry.deleteMany({ branch: { $in: oldIds } }),
    Snack.deleteMany({ branch: { $in: oldIds } }),
    AuditLog.deleteMany({ branch: { $in: oldIds } }),
  ]);
  await Branch.deleteMany({ _id: { $in: oldIds } });

  console.log(
    `Removed old branches: ${old.map((entry) => entry.name).join(', ')} ` +
      `(${bakery.deletedCount + pastry.deletedCount + snack.deletedCount} stock rows, ` +
      `${audits.deletedCount} audit rows)`,
  );
}

async function ensureBranches() {
  const bySlug = {};
  for (const branch of BRANCHES) {
    const doc = await Branch.findOneAndUpdate(
      { slug: branch.slug },
      { $setOnInsert: branch },
      { new: true, upsert: true },
    );
    bySlug[branch.slug] = doc._id;
  }
  console.log(`Branches: ${BRANCHES.map((b) => b.name).join(', ')}`);
  return bySlug;
}

/** Every non-superadmin account must belong to one of the 11 branches.
 *  Anything left over (old branch admins, orphans) is dropped together with
 *  its audit rows, so no session can reference a branch that is gone. */
async function pruneStaleAccounts(bySlug) {
  const valid = new Set(Object.values(bySlug).map(String));
  const accounts = await User.find({ role: { $ne: 'superadmin' } });
  const stale = accounts.filter((account) => {
    const list = (account.branches || []).map(String);
    return !list.length || !list.every((id) => valid.has(id));
  });

  if (stale.length) {
    const ids = stale.map((account) => account._id);
    await Promise.all([
      User.deleteMany({ _id: { $in: ids } }),
      AuditLog.deleteMany({ user: { $in: ids } }),
    ]);
    console.log(`Removed ${stale.length} account(s) tied to the old branches.`);
  }
}

async function ensureSuperadmin() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();

  if (!email) {
    console.warn('ADMIN_EMAIL not set - no superadmin created.');
    return;
  }

  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = 'superadmin';
    existing.branches = [];
    existing.password = SEED_PASSWORD; // re-hashed by the pre-save hook
    await existing.save();
    console.log(`Superadmin already exists: ${email}`);
  } else {
    await User.create({
      first_name: 'FoodCo',
      last_name: 'Owner',
      username: 'owner',
      email,
      password: SEED_PASSWORD,
      role: 'superadmin',
      branches: [],
    });
    console.log(`Superadmin created: ${email}`);
  }
}

/** One branch account per branch: username = lowercase hyphenated branch name.
 *  The password is random, hashed by the model's bcrypt hook, and only kept in
 *  memory long enough to be printed for this run. */
async function ensureBranchAccounts(bySlug) {
  const credentials = [];

  for (const branch of BRANCHES) {
    const email = `${branch.slug}@foodco.com`;
    const existing = await User.findOne({ email });

    if (existing) {
      existing.username = branch.slug;
      existing.first_name = branch.name;
      existing.last_name = 'Admin';
      existing.role = 'admin';
      existing.branches = [bySlug[branch.slug]];
      existing.password = SEED_PASSWORD; // re-hashed by the pre-save hook
      await existing.save();
      credentials.push({ username: branch.slug, email });
      continue;
    }

    await User.create({
      first_name: branch.name,
      last_name: 'Admin',
      username: branch.slug,
      email,
      password: SEED_PASSWORD, // hashed by the pre-save hook
      role: 'admin',
      branches: [bySlug[branch.slug]],
    });
    credentials.push({ username: branch.slug, email });
  }

  return credentials;
}

async function ensureStock(bySlug) {
  const flagship = bySlug[BRANCHES[0].slug];

  for (const [label, entries] of Object.entries(SAMPLES)) {
    const model = MODELS[label];
    let created = 0;

    for (const [branchIndex, branch] of BRANCHES.entries()) {
      for (const [index, entry] of entries.entries()) {
        const stock = branchStock(entry, branchIndex, index);
        const result = await model.updateOne(
          { name: entry.name, branch: bySlug[branch.slug] },
          {
            $setOnInsert: {
              ...entry,
              ...stock,
              branch: bySlug[branch.slug],
            },
          },
          { upsert: true },
        );
        if (result.upsertedCount) created += 1;
      }
    }

    // Anything created before branches existed belongs to the flagship branch.
    await model.updateMany(
      { branch: { $exists: false } },
      { $set: { branch: flagship } },
    );

    console.log(`${label}: ${created} rows across ${BRANCHES.length} branches (${BRANCHES.length * entries.length} total)`);
  }
}

function printCredentials(credentials) {
  const pad = (value, size) => String(value).padEnd(size);
  console.log('\nBranch credentials (every seeded account uses the same seed password):');
  console.log(`  ${pad('username', 14)}${pad('login email', 28)}password`);
  for (const entry of credentials) {
    console.log(`  ${pad(entry.username, 14)}${pad(entry.email, 28)}${SEED_PASSWORD}`);
  }
  console.log('  Log in at /login with the login email and password.\n');
}

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Check your .env file.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  await dropOldBranches();
  const bySlug = await ensureBranches();
  await pruneStaleAccounts(bySlug);
  await ensureSuperadmin();
  const credentials = await ensureBranchAccounts(bySlug);
  await ensureStock(bySlug);

  await mongoose.disconnect();
  console.log('Seed complete.');
  printCredentials(credentials);
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
