/**
 * Seed script: npm run seed
 *  - creates the 5 branches (Abuja, Lagos, Oyo, Benin, Sokoto)
 *  - creates a superadmin from ADMIN_EMAIL / ADMIN_PASSWORD (sees all branches)
 *  - creates one admin per branch: <slug>.admin@foodco.com with
 *    BRANCH_ADMIN_PASSWORD from .env (each can only open its own dashboard)
 *  - fills every branch with its own sample stock (image left empty where no
 *    product picture matches)
 *  - backfills any pre-branch data to the Lagos branch
 * Re-running is safe: everything is upserted.
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
  { name: 'Abuja', slug: 'abuja', location: '12 Ademola Adetokunbo Crescent, Maitama, Abuja' },
  { name: 'Lagos', slug: 'lagos', location: '14b Bourdillon Road, Ikoyi, Lagos' },
  { name: 'Oyo', slug: 'oyo', location: 'Oluyole Estate, Ibadan, Oyo' },
  { name: 'Benin', slug: 'benin', location: '18 Sapele Road, Benin City, Edo' },
  { name: 'Sokoto', slug: 'sokoto', location: 'Kabala Crescent, Sokoto' },
];

const SAMPLES = {
  Bakery: [
    { name: 'Country loaf', price: 2500, quantity: 12, image: 'country-loaf.svg' },
    { name: 'Whole wheat loaf', price: 2800, quantity: 8, image: 'whole-wheat-loaf.svg' },
    { name: 'Baguette', price: 1500, quantity: 0, image: 'baguette.svg' },
    { name: 'Sesame bun', price: 800, quantity: 24, image: 'sesame-bun.svg' },
  ],
  Pastries: [
    { name: 'Butter croissant', price: 1200, quantity: 18, image: 'butter-croissant.svg' },
    { name: 'Glazed donut', price: 700, quantity: 0, image: 'glazed-donut.svg' },
    { name: 'Blueberry muffin', price: 1000, quantity: 14, image: 'blueberry-muffin.svg' },
    { name: 'Apricot danish', price: 1300, quantity: 9, image: 'apricot-danish.svg' },
  ],
  Snacks: [
    { name: 'Sausage roll', price: 900, quantity: 20, image: 'sausage-roll.svg' },
    { name: 'Meat pie', price: 1100, quantity: 16, image: 'meat-pie.svg' },
    { name: 'Samosa', price: 600, quantity: 0, image: 'samosa.svg' },
    { name: 'Puff-puff', price: 500, quantity: 30, image: 'puff-puff.svg' },
  ],
};

const MODELS = { Bakery, Pastries: Pastry, Snacks: Snack };

/* Each branch keeps its own stock numbers so the dashboards are clearly
   separate: different branches sell out of different things. */
const STOCK_OFFSET = { abuja: 2, lagos: 0, oyo: -1, benin: 1, sokoto: -2 };

function branchStock(base, branchSlug, index) {
  const branchIndex = BRANCHES.findIndex((entry) => entry.slug === branchSlug);
  const quantity = Math.max(0, base.quantity + (STOCK_OFFSET[branchSlug] || 0) * 3 + index);
  const soldOut = quantity === 0 || (index + branchIndex) % 4 === 0;
  return {
    quantity: soldOut ? 0 : quantity,
    status: soldOut ? 'out' : 'in',
  };
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

async function ensureSuperadmin() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';

  if (!email || !password) {
    console.warn('ADMIN_EMAIL / ADMIN_PASSWORD not set - no superadmin created.');
    return;
  }

  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = 'superadmin';
    existing.branches = [];
    await existing.save();
    console.log(`Superadmin already exists: ${email}`);
  } else {
    await User.create({
      first_name: 'FoodCo',
      last_name: 'Owner',
      username: 'owner',
      email,
      password,
      role: 'superadmin',
      branches: [],
    });
    console.log(`Superadmin created: ${email}`);
  }
}

async function ensureBranchAdmins(bySlug) {
  const shared = (process.env.BRANCH_ADMIN_PASSWORD || '').trim();

  for (const branch of BRANCHES) {
    const email = `${branch.slug}.admin@foodco.com`;
    const password =
      (process.env[`${branch.slug.toUpperCase()}_ADMIN_PASSWORD`] || '').trim() ||
      shared;

    if (!password) {
      console.warn(`No password for ${email} (set BRANCH_ADMIN_PASSWORD) - skipped.`);
      continue;
    }

    const existing = await User.findOne({ email });
    if (existing) {
      existing.role = 'admin';
      existing.branches = [bySlug[branch.slug]];
      await existing.save();
      console.log(`Branch admin already exists: ${email} (${branch.name})`);
    } else {
      await User.create({
        first_name: branch.name,
        last_name: 'Admin',
        username: `${branch.slug}admin`,
        email,
        password,
        role: 'admin',
        branches: [bySlug[branch.slug]],
      });
      console.log(`Branch admin created: ${email} (${branch.name})`);
    }
  }
}

async function ensureStock(bySlug) {
  const lagosId = bySlug.lagos;

  for (const [label, entries] of Object.entries(SAMPLES)) {
    const model = MODELS[label];
    let created = 0;

    for (const branch of BRANCHES) {
      for (const [index, entry] of entries.entries()) {
        const stock = branchStock(entry, branch.slug, index);
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
      { $set: { branch: lagosId } },
    );

    console.log(`${label}: ${created} rows across 5 branches (${BRANCHES.length * entries.length} total)`);
  }
}

async function backfillUsers(bySlug) {
  const lagosId = bySlug.lagos;
  const orphaned = await User.find({
    role: { $ne: 'superadmin' },
    $or: [{ branches: { $exists: false } }, { branches: { $size: 0 } }],
  });

  for (const user of orphaned) {
    user.branches = [lagosId];
    await user.save();
  }
  if (orphaned.length) {
    console.log(`Backfilled ${orphaned.length} user(s) to the Lagos branch.`);
  }

  await AuditLog.updateMany(
    { branch: { $exists: false } },
    { $set: { branch: lagosId } },
  );
}

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Check your .env file.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const bySlug = await ensureBranches();
  await ensureSuperadmin();
  await ensureBranchAdmins(bySlug);
  await ensureStock(bySlug);
  await backfillUsers(bySlug);

  await mongoose.disconnect();
  console.log('Seed complete.');
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
