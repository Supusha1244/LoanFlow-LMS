import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from '../models/User';

const SEED_USERS = [
  { name: 'Admin User',        email: 'admin@lms.com',       password: 'Admin@123',       role: 'admin' },
  { name: 'Sales Executive',   email: 'sales@lms.com',       password: 'Sales@123',       role: 'sales' },
  { name: 'Sanction Officer',  email: 'sanction@lms.com',    password: 'Sanction@123',    role: 'sanction' },
  { name: 'Disburse Officer',  email: 'disburse@lms.com',    password: 'Disburse@123',    role: 'disbursement' },
  { name: 'Collection Agent',  email: 'collection@lms.com',  password: 'Collection@123',  role: 'collection' },
  { name: 'Test Borrower',     email: 'borrower@lms.com',    password: 'Borrower@123',    role: 'borrower' },
];

async function seed() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lms';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  for (const userData of SEED_USERS) {
    const existing = await User.findOne({ email: userData.email });
    if (existing) {
      console.log(`⚠️  User already exists: ${userData.email}`);
      continue;
    }
    await User.create(userData);
    console.log(`✅ Created ${userData.role}: ${userData.email} / ${userData.password}`);
  }

  console.log('\n🎉 Seed complete! Login credentials:');
  SEED_USERS.forEach(u => console.log(`  ${u.role.padEnd(12)} → ${u.email.padEnd(25)} / ${u.password}`));
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
