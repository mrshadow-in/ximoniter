/**
 * proxmox.js - Chart integration for Proxmox historical data
 */

document.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById('cpuChart').getContext('2d');
    const nodeIdInput = document.getElementById('nodeId');
    const refreshBtn = document.getElementById('refreshBtn');
    const statusEl = document.getElementById('chart-status');

    let cpuChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'CPU Usage (%)',
                data: [],
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 2,
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time',
                        color: '#aaa'
                    },
                    ticks: { color: '#aaa' },
                    grid: { color: '#444' }
                },
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Percentage (%)',
                        color: '#aaa'
                    },
                    ticks: { color: '#aaa' },
                    grid: { color: '#444' }
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#fff' }
                }
            }
        }
    });

    async function fetchHistory() {
        const nodeId = nodeIdInput.value;
        if (!nodeId) return;

        try {
            // Using the 'api' wrapper from api.js
            const response = await window.api.get(`/proxmox/${nodeId}/history?hours=1`);
            
            if (response.success && Array.isArray(response.data)) {
                // Backend returns DESC by timestamp, reverse for the chart (L-R time flow)
                const history = response.data.reverse();
                
                const labels = history.map(item => {
                    const date = new Date(item.timestamp);
                    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                });
                
                const cpuData = history.map(item => item.cpu * 100); // Assuming stored as 0-1, converting to %

                cpuChart.data.labels = labels;
                cpuChart.data.datasets[0].data = cpuData;
                cpuChart.update();
                
                if (statusEl) {
                    statusEl.textContent = `Chart updated with ${history.length} data points for node ${nodeId}.`;
                }
            }
        } catch (error) {
            console.error('Failed to fetch Proxmox history:', error);
            if (statusEl) {
                statusEl.textContent = 'Failed to update chart data.';
            }
        }
    }

    refreshBtn.addEventListener('click', fetchHistory);

    // Initial load
    fetchHistory();

    // --- ADMIN CONFIGURATION LOGIC ---
    const configList = document.getElementById('node-config-list');
    const addNodeForm = document.getElementById('add-node-form');

    async function loadConfigs() {
        try {
            const response = await window.api.get('/proxmox/config');
            if (response.success) {
                configList.innerHTML = response.data.map(n => `
                    <div style="padding: 12px; border-bottom: 1px solid #30363d; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: bold; color: #58a6ff;">${n.name}</div>
                            <div style="font-size: 12px; color: #8b949e;">${n.host}:${n.port} (Node: ${n.node})</div>
                        </div>
                        <button onclick="deleteConfig(${n.id})" style="background: #da3633; padding: 4px 12px; font-size: 12px;">Delete</button>
                    </div>
                `).join('') || '<div style="padding: 10px; color: #8b949e;">No nodes configured.</div>';
            }
        } catch (e) {
            console.error('Failed to load configs:', e);
            configList.innerText = 'Error loading configurations.';
        }
    }

    window.deleteConfig = async function(id) {
        if (!confirm('Are you sure you want to delete this node configuration?')) return;
        try {
            const res = await window.api.delete(`/proxmox/config/${id}`);
            if (res.success) loadConfigs();
        } catch (e) {
            alert('Failed to delete node');
        }
    };

    addNodeForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById('node-name').value,
            host: document.getElementById('node-host').value,
            node: document.getElementById('node-pve').value,
            token_id: document.getElementById('node-tokenId').value,
            token_secret: document.getElementById('node-tokenSecret').value,
            rejectUnauthorized: false
        };
        
        try {
            const res = await window.api.post('/proxmox/config', payload);
            if (res.success) {
                addNodeForm.reset();
                loadConfigs();
            }
        } catch (err) {
            alert('Failed to add node: ' + (err.response?.data?.error || err.message));
        }
    });

    if (configList) loadConfigs();
});
