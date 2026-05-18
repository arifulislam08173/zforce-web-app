const bcrypt = require('bcryptjs');
const { User } = require('../models');

const DEFAULT_ADMIN_EMAIL = 'admin@zforce.com';
const DEFAULT_ADMIN_PASSWORD = '12345';
const DEFAULT_ADMIN_NAME = 'System Admin';

function readBool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).trim().toLowerCase() === 'true';
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

async function seedDefaultAdmin() {
  const shouldSeed = readBool(process.env.SEED_DEFAULT_ADMIN, true);

  if (!shouldSeed) {
    console.log('[SEED] Default admin seed skipped. SEED_DEFAULT_ADMIN=false');
    return;
  }

  const email = normalizeEmail(process.env.DEFAULT_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL);
  const password = process.env.DEFAULT_ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
  const name = process.env.DEFAULT_ADMIN_NAME || DEFAULT_ADMIN_NAME;

  if (!email || !password) {
    console.log('[SEED] Default admin seed skipped. Missing email or password.');
    return;
  }

  const existingAdmin = await User.findOne({
    where: { email },
    paranoid: false,
  });

  if (existingAdmin) {
    const updates = {
      name: existingAdmin.name || name,
      role: 'ADMIN',
      isActive: true,
    };

    if (existingAdmin.deletedAt) {
      updates.deletedAt = null;
    }

    await existingAdmin.update(updates, { hooks: false });
    console.log(`[SEED] Default admin already exists: ${email}`);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create(
    {
      name,
      email,
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
      faceEnrolled: false,
      faceEmbeddings: null,
      faceEnrollMeta: null,
      faceEnrollAt: null,
    },
    { hooks: false }
  );

  console.log(`[SEED] Default admin created: ${email}`);
}

async function seedDefaults() {
  await seedDefaultAdmin();
}

module.exports = {
  seedDefaults,
  seedDefaultAdmin,
};