const db = require('../backend/config/db');
const bcrypt = require('bcrypt');

async function seed() {
  const username = 'admin';
  const password = 'admin_password_2026';
  const role = 'super_admin';

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  
  if (existing) {
    console.log('Admin user already exists.');
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  
  db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)')
    .run(username, hash, role);

  console.log('------------------------------------------');
  console.log('ADMIN USER CREATED');
  console.log(`Username: ${username}`);
  console.log(`Password: ${password}`);
  console.log('------------------------------------------');
}

seed().catch(console.error);
