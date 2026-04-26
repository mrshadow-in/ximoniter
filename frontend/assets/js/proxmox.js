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
});
