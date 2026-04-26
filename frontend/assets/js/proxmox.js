/**
 * proxmox.js - Real-time Chart integration for Proxmox data
 */

document.addEventListener('DOMContentLoaded', () => {
    const nodeIdInput = document.getElementById('nodeId');
    const refreshBtn = document.getElementById('refreshBtn');
    const statusEl = document.getElementById('chart-status');

    // Chart instances
    let cpuChart, memChart, diskChart, netChart;

    function createChart(ctxId, label, color, fill = true) {
        const ctx = document.getElementById(ctxId).getContext('2d');
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: label,
                    data: [],
                    borderColor: color,
                    backgroundColor: fill ? color.replace('1)', '0.1)') : 'transparent',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: fill,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 0 }, // Disable for performance
                scales: {
                    x: { ticks: { color: '#8b949e', font: { size: 10 } }, grid: { color: '#30363d' } },
                    y: { beginAtZero: true, ticks: { color: '#8b949e' }, grid: { color: '#30363d' } }
                },
                plugins: { legend: { labels: { color: '#e6edf3', boxWidth: 12 } } }
            }
        });
    }

    // Initialize charts
    cpuChart = createChart('cpuChart', 'CPU Usage (%)', '#1a73e8');
    cpuChart.options.scales.y.max = 100;

    memChart = createChart('memChart', 'Memory Used (GB)', '#8957e5');
    diskChart = createChart('diskChart', 'Disk Used (GB)', '#1abc9c');
    
    // Net chart has two datasets
    const netCtx = document.getElementById('netChart').getContext('2d');
    netChart = new Chart(netCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                { label: 'Net In (MB/s)', data: [], borderColor: '#2ea043', borderWidth: 2, tension: 0.3, fill: false, pointRadius: 0 },
                { label: 'Net Out (MB/s)', data: [], borderColor: '#1a73e8', borderWidth: 2, tension: 0.3, fill: false, pointRadius: 0 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 0 },
            scales: {
                x: { ticks: { color: '#8b949e', font: { size: 10 } }, grid: { color: '#30363d' } },
                y: { beginAtZero: true, ticks: { color: '#8b949e' }, grid: { color: '#30363d' } }
            },
            plugins: { legend: { labels: { color: '#e6edf3', boxWidth: 12 } } }
        }
    });

    async function fetchHistory() {
        const nodeId = nodeIdInput.value;
        if (!nodeId) return;

        try {
            const response = await window.api.get(`/proxmox/${nodeId}/history?hours=1`);
            
            if (response.success && Array.isArray(response.data)) {
                const history = response.data; // Backend now returns ASC
                
                const labels = history.map(item => new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
                const cpuData = history.map(item => item.cpu * 100);
                const memData = history.map(item => item.mem_used / (1024**3));
                const diskData = history.map(item => item.disk_used / (1024**3));
                const netInData = history.map(item => item.net_in / (1024**2));
                const netOutData = history.map(item => item.net_out / (1024**2));

                const update = (chart, l, d) => {
                    chart.data.labels = l;
                    chart.data.datasets[0].data = d;
                    chart.update();
                };

                update(cpuChart, labels, cpuData);
                update(memChart, labels, memData);
                update(diskChart, labels, diskData);
                
                netChart.data.labels = labels;
                netChart.data.datasets[0].data = netInData;
                netChart.data.datasets[1].data = netOutData;
                netChart.update();
                
                if (statusEl) statusEl.textContent = `Loaded ${history.length} historical points.`;
            }
        } catch (error) {
            console.error('Failed to fetch Proxmox history:', error);
        }
    }

    refreshBtn.addEventListener('click', fetchHistory);

    // --- ADMIN CONFIGURATION LOGIC ---
    const configList = document.getElementById('node-config-list');
    const addNodeForm = document.getElementById('add-node-form');

    async function loadConfigs() {
        try {
            const response = await window.api.get('/proxmox/config');
            if (response.success) {
                // AUTO-SELECT FIRST NODE
                if (response.data.length > 0 && nodeIdInput.value === 'pve1') {
                    nodeIdInput.value = response.data[0].name;
                    fetchHistory();
                }

                configList.innerHTML = response.data.map(n => `
                    <div style="padding: 12px; border-bottom: 1px solid #30363d; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: bold; color: #58a6ff;">${n.name}</div>
                            <div style="font-size: 12px; color: #8b949e;">${n.host}:${n.port} (Node: ${n.node})</div>
                        </div>
                        <div style="display: flex; gap: 5px;">
                            <button data-testid="${n.id}" onclick="testConnection(${n.id}, this)" style="background: #2ea043; padding: 4px 12px; font-size: 12px;">Test</button>
                            <button onclick="deleteConfig(${n.id})" style="background: #da3633; padding: 4px 12px; font-size: 12px;">Delete</button>
                        </div>
                    </div>
                `).join('') || '<div style="padding: 10px; color: #8b949e;">No nodes configured.</div>';
            }
        } catch (e) {
            console.error('Failed to load configs:', e);
        }
    }

    window.testConnection = async function(id, btn) {
        const originalText = btn.innerText;
        btn.innerText = '...';
        btn.disabled = true;
        try {
            const res = await window.api.post(`/proxmox/config/${id}/test`);
            alert(res.success ? `Success: Proxmox ${res.data.version}` : 'Failed to connect');
        } catch (e) {
            alert('Error: ' + (e.response?.data?.error || e.message));
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    };

    window.deleteConfig = async function(id) {
        if (!confirm('Delete this node?')) return;
        try {
            await window.api.delete(`/proxmox/config/${id}`);
            loadConfigs();
        } catch (e) { alert('Delete failed'); }
    };

    addNodeForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById('node-name').value,
            host: document.getElementById('node-host').value,
            node: document.getElementById('node-pve').value,
            token_id: document.getElementById('node-tokenId').value,
            token_secret: document.getElementById('node-tokenSecret').value
        };
        try {
            const res = await window.api.post('/proxmox/config', payload);
            if (res.success) { addNodeForm.reset(); loadConfigs(); }
        } catch (err) { alert('Add failed: ' + (err.response?.data?.error || err.message)); }
    });

    loadConfigs();

    // --- WEBSOCKET LIVE UPDATES ---
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
        try {
            const payload = JSON.parse(event.data);
            if (payload.channel === 'proxmox' && payload.event === 'metrics_update') {
                const currentNodeId = nodeIdInput.value;
                const nodeData = payload.data.find(d => d.nodeId === currentNodeId);
                
                if (nodeData) {
                    const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    
                    const updateChartLive = (chart, dataPoints) => {
                        chart.data.labels.push(timeLabel);
                        if (chart.data.labels.length > 100) chart.data.labels.shift();
                        
                        dataPoints.forEach((val, idx) => {
                            chart.data.datasets[idx].data.push(val);
                            if (chart.data.datasets[idx].data.length > 100) chart.data.datasets[idx].data.shift();
                        });
                        chart.update('none');
                    };

                    updateChartLive(cpuChart, [nodeData.cpu * 100]);
                    updateChartLive(memChart, [nodeData.mem_used / (1024**3)]);
                    updateChartLive(diskChart, [nodeData.disk_used / (1024**3)]);
                    updateChartLive(netChart, [nodeData.net_in / (1024**2), nodeData.net_out / (1024**2)]);
                }
            }
        } catch (e) { console.error('WS Error:', e); }
    };
});
