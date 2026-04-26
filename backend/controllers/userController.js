const db = require('../config/db');
const bcrypt = require('bcrypt');

exports.getUsers = (req, res) => {
  try {
    const rows = db.prepare('SELECT id, username, role, created_at, last_login FROM users').all();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 'INTERNAL_ERROR' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
        return res.status(422).json({ success: false, error: 'Missing fields', code: 'VALIDATION_ERROR' });
    }
    const hash = await bcrypt.hash(password, 12);
    db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run(username, hash, role);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 'INTERNAL_ERROR' });
  }
};

exports.deleteUser = (req, res) => {
  try {
    // Prevent deleting self (simplified check)
    if (req.user.id == req.params.id) {
        return res.status(400).json({ success: false, error: 'Cannot delete yourself' });
    }
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 'INTERNAL_ERROR' });
  }
};
