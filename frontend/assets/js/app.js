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
        const response = await axios.get('/api/settings/sandbox');
        updateSandboxBanner(response.data.sandboxMode);
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
        const response = await axios.post('/api/settings/sandbox/toggle');
        const isSandbox = response.data.sandboxMode;
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
