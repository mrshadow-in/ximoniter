const db = require('../config/db');

async function getAllNodeStats() {
    // Skeleton implementation
    return [];
}

async function saveMetrics(nodeId, stats) {
    const { cpu, memUsedGb, memTotalGb } = stats;
    db.prepare('INSERT INTO proxmox_metrics (node_id, cpu, mem_used, mem_total) VALUES (?, ?, ?, ?)').run(nodeId, cpu, memUsedGb, memTotalGb);
}

async function getHistory(nodeId, hours) {
    const query = `
      SELECT * FROM proxmox_metrics 
      WHERE node_id = ? 
      AND timestamp >= datetime('now', '-' || ? || ' hours')
      ORDER BY timestamp DESC
    `;
    return db.prepare(query).all(nodeId, hours);
}

module.exports = {
    getAllNodeStats,
    saveMetrics,
    getHistory
};
