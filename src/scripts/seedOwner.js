/**
 * One-time seed script — creates the first Owner account.
 * Run ONCE before launching: node src/scripts/seedOwner.js
 * Safe to run multiple times — will skip if owner already exists.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ role: 'owner' });
  if (existing) {
    console.log('Owner already exists:', existing.email);
    process.exit(0);
  }

  const owner = await User.create({
    firstName: 'Pharmacy',
    lastName: 'Owner',
    email: process.env.OWNER_EMAIL || 'owner@pharmacy.com',
    password: process.env.OWNER_PASSWORD || 'Owner@1234',
    role: 'owner',
  });

  console.log('✅ Owner created:', owner.email);
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
