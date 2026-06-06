const bcrypt = require('bcryptjs');
const pool = require('./db');
require('dotenv').config();

async function seed() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO admins (username, password_hash, role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)',
      [username, hash, 'super_admin']
    );
    console.log(`✅ Admin user created: ${username} / ${password}`);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
