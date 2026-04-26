const db = require('../config/db');

async function getAllNodeStats() {
    // Skeleton implementation
    return [];
}

async function saveMetrics(nodeId, stats) {
    const { cpu, memUsedGb, memTotalGb } = stats;
    db.prepare('INSERT INTO proxmox_metrics (node_id, cpu, mem_used, mem_total) VALUES (?, ?, ?, ?)').run(nodeId, cpu, memUsedGb, memTotalGb);
}

module.exports = {
    getAllNodeStats,
    saveMetrics
};
