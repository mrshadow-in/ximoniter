function updateSandboxBanner(isSandbox) {
    const banner = document.getElementById('sandbox-banner');
    const toggleBtn = document.getElementById('toggle-sandbox');
    if (banner) {
        banner.style.display = isSandbox ? 'block' : 'none';
    }
    if (toggleBtn) {
        toggleBtn.setAttribute('aria-pressed', isSandbox);
    }
}

async function checkSandboxMode() {
    try {
        const response = await api.get('/settings/sandbox');
        updateSandboxBanner(response.sandboxMode);
    } catch (error) {
        console.error('Error checking sandbox mode:', error);
    }
}

async function toggleSandboxMode() {
    const toggleBtn = document.getElementById('toggle-sandbox');
    const errorMsg = document.getElementById('error-message');
    
    if (toggleBtn) toggleBtn.disabled = true;
    if (errorMsg) errorMsg.style.display = 'none';

    try {
        const response = await api.post('/settings/sandbox/toggle');
        const isSandbox = response.sandboxMode;
        updateSandboxBanner(isSandbox);
        console.log(`Sandbox Mode is now ${isSandbox ? 'ON' : 'OFF'}`);
    } catch (error) {
        console.error('Error toggling sandbox mode:', error);
        if (errorMsg) {
            errorMsg.textContent = 'Failed to update sandbox mode. Please try again.';
            errorMsg.style.display = 'block';
        }
    } finally {
        if (toggleBtn) toggleBtn.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkSandboxMode();
    
    const toggleBtn = document.getElementById('toggle-sandbox');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleSandboxMode);
    }
});

function initGlobalWebSocket() {
    const token = localStorage.getItem('nod_token');
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
        try {
            const payload = JSON.parse(event.data);
            if (payload.channel === 'failover') {
                if (payload.event === 'triggered') {
                    console.error(payload.data.message);
                } else if (payload.event === 'recovery') {
                    console.log(payload.data.message);
                }
            }
        } catch (e) {
            console.error('Global WS Error:', e);
        }
    };
    
    ws.onclose = () => {
        setTimeout(initGlobalWebSocket, 5000);
    };
}
document.addEventListener('DOMContentLoaded', initGlobalWebSocket);
