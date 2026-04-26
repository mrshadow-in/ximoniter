const db = require('../config/db');
const axios = require('axios');
const https = require('https');
const wsHub = require('../websocket/wsHub');

const lastNetStats = {}; // { [nodeId]: { timestamp, netin, netout } }

async function testConnection(config) {
    const { host, port, token_id, token_secret, reject_unauth } = config;
    const url = `https://${host}:${port}/api2/json/version`;

    const agent = new https.Agent({
        rejectUnauthorized: reject_unauth === 1 || reject_unauth === true
    });

    try {
        const response = await axios.get(url, {
            headers: { 'Authorization': `PVEAPIToken=${token_id}=${token_secret}` },
            httpsAgent: agent,
            timeout: 5000
        });
        return { success: true, version: response.data.data.version };
    } catch (error) {
        throw new Error(`Proxmox connection failed: ${error.message}`);
    }
}

async function getNodeStatus(config) {
    const agent = new https.Agent({ rejectUnauthorized: !!config.reject_unauth });
    const headers = { 'Authorization': `PVEAPIToken=${config.token_id}=${config.token_secret}` };
    const baseUrl = `https://${config.host}:${config.port}/api2/json/nodes/${config.node}`;

    try {
        const [statusRes, netRes] = await Promise.all([
            axios.get(`${baseUrl}/status`, { headers, httpsAgent: agent, timeout: 5000 }),
            axios.get(`${baseUrl}/netstat`, { headers, httpsAgent: agent, timeout: 5000 }).catch(() => ({ data: { data: [] } }))
        ]);

        const s = statusRes.data.data;
        
        // Calculate network totals from netstat if available
        let currentNetIn = 0;
        let currentNetOut = 0;
        if (netRes.data && Array.isArray(netRes.data.data)) {
            for (const iface of netRes.data.data) {
                currentNetIn += parseInt(iface.receive) || 0;
                currentNetOut += parseInt(iface.transmit) || 0;
            }
        }

        const now = Date.now();
        let netInBps = 0;
        let netOutBps = 0;

        if (lastNetStats[config.name]) {
            const last = lastNetStats[config.name];
            const timeDiffSec = (now - last.timestamp) / 1000;
            
            if (timeDiffSec > 0) {
                // Handle counter resets (reboots)
                if (currentNetIn >= last.netin) {
                    netInBps = (currentNetIn - last.netin) / timeDiffSec;
                }
                if (currentNetOut >= last.netout) {
                    netOutBps = (currentNetOut - last.netout) / timeDiffSec;
                }
            }
        }

        lastNetStats[config.name] = { timestamp: now, netin: currentNetIn, netout: currentNetOut };

        return {
            cpu: s.cpu || 0,
            mem_used: s.memory?.used || 0,
            mem_total: s.memory?.total || 0,
            disk_used: s.rootfs?.used || 0,
            disk_total: s.rootfs?.total || 0,
            net_in: netInBps,
            net_out: netOutBps,
            disk_read: 0,
            disk_write: 0
        };
    } catch (err) {
        console.error(`Failed to fetch stats for ${config.name}:`, err.message);
        return null;
    }
}

let pollingInterval = null;

function startPolling(frequencyMs = 5000) {
    if (pollingInterval) clearInterval(pollingInterval);
    
    pollingInterval = setInterval(async () => {
        const nodes = db.prepare('SELECT * FROM proxmox_nodes').all();
        const results = [];

        for (const node of nodes) {
            const stats = await getNodeStatus(node);
            if (stats) {
                stats.nodeId = node.name;
                results.push(stats);
                
                // Save to DB every tick for high-resolution live charts
                await saveMetrics(node.name, stats);
            }
        }

        if (results.length > 0) {
            wsHub.broadcast('proxmox', 'metrics_update', results);
        }
    }, frequencyMs);
}

async function saveMetrics(nodeId, stats) {
    const stmt = db.prepare(`
        INSERT INTO proxmox_metrics 
        (node_id, cpu, mem_used, mem_total, disk_used, disk_total, net_in, net_out, disk_read, disk_write) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
        nodeId, 
        stats.cpu || 0, 
        stats.mem_used || 0, 
        stats.mem_total || 0, 
        stats.disk_used || 0, 
        stats.disk_total || 0, 
        stats.net_in || 0, 
        stats.net_out || 0, 
        stats.disk_read || 0, 
        stats.disk_write || 0
    );
}

async function getHistory(nodeId, hours) {
    const rows = db.prepare(`
        SELECT timestamp, cpu, mem_used, mem_total, disk_used, disk_total, net_in, net_out, disk_read, disk_write
        FROM proxmox_metrics 
        WHERE node_id = ? AND timestamp >= datetime('now', '-' || ? || ' hours')
        ORDER BY timestamp ASC
    `).all(nodeId, hours);
    return rows;
}

module.exports = {
    testConnection,
    saveMetrics,
    getHistory,
    startPolling
};
