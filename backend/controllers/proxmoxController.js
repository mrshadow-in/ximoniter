const db = require('../config/db');
const proxmoxService = require('../services/proxmoxService');

exports.getHistory = async (req, res) => {
  const { node } = req.params;
  const hours = parseInt(req.query.hours) || 1;
  
  if (isNaN(hours) || hours <= 0) {
    return res.status(422).json({
      success: false,
      error: 'Hours must be a positive integer',
      code: 'VALIDATION_ERROR'
    });
  }

  try {
    const data = await proxmoxService.getHistory(node, hours);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching proxmox history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch historical metrics',
      code: 'PROXMOX_ERROR'
    });
  }
};

exports.getConfig = (req, res) => {
  try {
    const rows = db.prepare('SELECT id, name, host, port, node, token_id, reject_unauth FROM proxmox_nodes').all();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 'INTERNAL_ERROR' });
  }
};

exports.addConfig = (req, res) => {
  try {
    const { name, host, port, node, token_id, token_secret, rejectUnauthorized } = req.body;
    const stmt = db.prepare(`INSERT INTO proxmox_nodes (name, host, port, node, token_id, token_secret, reject_unauth) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    stmt.run(name, host, port || 8006, node, token_id, token_secret, rejectUnauthorized ? 1 : 0);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 'INTERNAL_ERROR' });
  }
};

exports.deleteConfig = (req, res) => {
  try {
    db.prepare('DELETE FROM proxmox_nodes WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: 'INTERNAL_ERROR' });
  }
};

exports.testConfigConnection = async (req, res) => {
  const { id } = req.params;

  try {
    const config = db.prepare('SELECT * FROM proxmox_nodes WHERE id = ?').get(id);
    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Proxmox configuration not found',
        code: 'NOT_FOUND'
      });
    }

    const result = await proxmoxService.testConnection(config);
    res.json(result);
  } catch (error) {
    console.error(`Error testing Proxmox connection for ID ${id}:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'PROXMOX_CONNECTION_ERROR'
    });
  }
};
