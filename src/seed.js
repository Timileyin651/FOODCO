/**
 * Seed script: npm run seed
 * - creates one admin user from ADMIN_EMAIL / ADMIN_PASSWORD if none exists
 * - adds a few sample bakery items, pastries and snacks (image left empty
 *   where no product picture matches)
 */
require('dotenv').config();
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const User = require('./models/users');
const Bakery = require('./models/bakery');
const Pastry = require('./models/pastry');
const Snack = require('./models/snack');

const SAMPLES = {
  bakery: [
    { name: 'Country loaf', price: 2500, quantity: 12, status: 'in', image: 'country-loaf.svg' },
    { name: 'Whole wheat loaf', price: 2800, quantity: 8, status: 'in', image: 'whole-wheat-loaf.svg' },
    { name: 'Baguette', price: 1500, quantity: 0, status: 'out', image: 'baguette.svg' },
    { name: 'Sesame bun', price: 800, quantity: 24, status: 'in', image: 'sesame-bun.svg' },
  ],
  pastries: [
    { name: 'Butter croissant', price: 1200, quantity: 18, status: 'in', image: 'butter-croissant.svg' },
    { name: 'Glazed donut', price: 700, quantity: 0, status: 'out', image: 'glazed-donut.svg' },
    { name: 'Blueberry muffin', price: 1000, quantity: 14, status: 'in', image: 'blueberry-muffin.svg' },
    { name: 'Apricot danish', price: 1300, quantity: 9, status: 'in', image: 'apricot-danish.svg' },
  ],
  snacks: [
    { name: 'Sausage roll', price: 900, quantity: 20, status: 'in', image: 'sausage-roll.svg' },
    { name: 'Meat pie', price: 1100, quantity: 16, status: 'in', image: 'meat-pie.svg' },
    { name: 'Samosa', price: 600, quantity: 0, status: 'out', image: 'samosa.svg' },
    { name: 'Puff-puff', price: 500, quantity: 30, status: 'in', image: 'puff-puff.svg' },
  ],
};

async function seedModule(model, entries, label) {
  let created = 0;
  for (const entry of entries) {
    const result = await model.updateOne(
      { name: entry.name },
      { $setOnInsert: entry },
      { upsert: true },
    );
    if (result.upsertedCount) created += 1;
  }
  console.log(`${label}: ${created} added, ${entries.length - created} already present`);
}

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Check your .env file.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  // --- admin user ---
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';

  if (!email || !password) {
    console.warn('ADMIN_EMAIL / ADMIN_PASSWORD not set - skipping the admin user.');
  } else {
    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`Admin user already exists: ${email}`);
    } else {
      await User.create({
        first_name: 'FoodCo',
        last_name: 'Admin',
        username: 'admin',
        email,
        password, // hashed by the existing pre-save hook
      });
      console.log(`Admin user created: ${email}`);
    }
  }

  // --- sample stock ---
  await seedModule(Bakery, SAMPLES.bakery, 'Bakery');
  await seedModule(Pastry, SAMPLES.pastries, 'Pastries');
  await seedModule(Snack, SAMPLES.snacks, 'Snacks');

  await mongoose.disconnect();
  console.log('Seed complete.');
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
